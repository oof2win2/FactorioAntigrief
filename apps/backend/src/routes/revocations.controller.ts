import { FastifyReply, FastifyRequest } from "fastify"
import { Controller, GET, POST } from "fastify-decorators"
import { z } from "zod"
import { Authenticate } from "../utils/authentication"
import { client, validateDiscordUser } from "../utils/discord"
import ReportInfoModel from "../database/reportinfo"
import CategoryModel, { CategoryClass } from "../database/category"
import { reportRevokedMessage } from "../utils/info"
import {
	Community,
	Category,
	ReportMessageExtraOpts,
	RevocationMessageExtraOpts,
	Revocation,
} from "fagc-api-types"
import { DocumentType } from "@typegoose/typegoose"
import { BeAnObject } from "@typegoose/typegoose/lib/types"
import validator from "validator"

@Controller({ route: "/revocations" })
export default class RevocationController {
	@GET({
		url: "/",
		options: {
			schema: {
				querystring: z.object({
					playername: z.string().or(z.array(z.string())).optional(),
					categoryId: z.string().or(z.array(z.string())).optional(),
					adminId: z.string().or(z.array(z.string())).optional(),
					after: z
						.string()
						.optional()
						.refine(
							(input) =>
								input === undefined ||
								validator.isISO8601(input),
							"Invalid timestamp"
						),
					revokedAfter: z
						.string()
						.optional()
						.refine(
							(input) =>
								input === undefined ||
								validator.isISO8601(input),
							"Invalid timestamp"
						),
				}),
				description: "Fetch revocations from your community",
				tags: ["revocations"],
				security: [
					{
						authorization: [],
					},
				],
				response: {
					"200": z.array(Revocation),
				},
			},
		},
	})
	@Authenticate
	async fetchAll(
		req: FastifyRequest<{
			Querystring: {
				playername?: string | string[]
				categoryId?: string | string[]
				adminId?: string | string[]
				after?: string
				revokedAfter?: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { playername, categoryId, adminId, after, revokedAfter } =
			req.query
		const { community } = req.requestContext.get("auth")
		if (!community)
			return res.status(404).send({
				errorCode: 404,
				error: "Community not found",
				message: "Community not found",
			})

		const revocations = await ReportInfoModel.find({
			playername: playername,
			categoryId: categoryId,
			adminId: adminId,
			...(after ? { reportCreatedAt: { $gt: new Date(after) } } : {}),
			communityId: community.id,
			revokedAt: {
				$ne: null,
				...(revokedAfter ? { $gt: new Date(revokedAfter) } : {}),
			},
		})

		return res.send(revocations)
	}

	@GET({
		url: "/:id",
		options: {
			schema: {
				params: z.object({
					id: z.string(),
				}),

				description: "Fetch revocation by ID",
				tags: ["revocations"],
				security: [
					{
						authorization: [],
					},
				],
				response: {
					"200": Revocation.nullable(),
				},
			},
		},
	})
	async fetch(
		req: FastifyRequest<{
			Params: {
				id: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { id } = req.params

		const revocation = await ReportInfoModel.findOne({
			id: id,
		})
		if (!revocation) return res.send(null)
		if (!revocation.revokedAt) return res.send(null) // it is a report as it has not been revoked

		return res.send(revocation)
	}

	@POST({
		url: "/bulk",
		options: {
			schema: {
				body: z.object({
					ids: z.array(z.string()),
					since: z
						.string()
						.refine(
							(input) => validator.isISO8601(input),
							"since must be a valid ISO8601 date"
						)
						.transform((input) => new Date(input)),
				}),
				response: {
					"200": z.array(Revocation),
				},
			},
		},
	})
	async bulkFetch(
		req: FastifyRequest<{
			Body: {
				ids: string[]
				since: Date
			}
		}>,
		res: FastifyReply
	) {
		if (req.body.ids.length === 0) return res.send([])

		const revocations = await ReportInfoModel.find({
			revokedAt: {
				$gt: req.body.since,
			},
		})

		// filter the revocations to be only the ones that are in the ids array
		const filteredRevocations = revocations.filter((revocation) => {
			return req.body.ids.includes(revocation.id)
		})

		return res.send(filteredRevocations)
	}

	@POST({
		url: "/",
		options: {
			schema: {
				body: z.object({
					reportId: z.string(),
					adminId: z.string(),
				}),

				description: "Revoke a report",
				tags: ["revocations"],
				security: [
					{
						authorization: [],
					},
				],
				response: {
					"200": Revocation,
				},
			},
		},
	})
	@Authenticate
	async revokeReport(
		req: FastifyRequest<{
			Body: {
				reportId: string
				adminId: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { community } = req.requestContext.get("auth")
		if (!community)
			return res.status(400).send({
				errorCode: 400,
				error: "Community Not Found",
				message: "Your community could not be found",
			})

		const report = await ReportInfoModel.findOne({
			id: req.body.reportId,
			revokedAt: { $exists: false },
		})
		if (!report || report.communityId !== community.id)
			return res.status(404).send({
				errorCode: 404,
				error: "Not Found",
				message: "Report could not be found",
			})

		const revoker = await validateDiscordUser(req.body.adminId)
		if (!revoker)
			return res.status(400).send({
				errorCode: 400,
				error: "Bad Request",
				message: "adminId must be a valid Discord user",
			})
		const category = await CategoryModel.findOne({ id: report.categoryId })

		report.revokedAt = new Date()
		report.revokedBy = revoker.id
		await report.save()

		const allReports = await ReportInfoModel.find({
			playername: report.playername,
			revokedAt: { $eq: null },
		}).select(["communityId"])
		const differentCommunities: Set<string> = new Set()
		allReports.forEach((report) =>
			differentCommunities.add(report.communityId)
		)

		reportRevokedMessage(Revocation.parse(report), {
			community: <Community>(<unknown>community),
			// this is allowed since the category is GUARANTEED to exist if the report exists
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			category: <Category>(<unknown>category!),
			revokedBy: <RevocationMessageExtraOpts["revokedBy"]>(
				(<unknown>revoker)
			),
			totalReports: allReports.length,
			totalCommunities: differentCommunities.size,
		})
		return res.status(200).send(report)
	}

	@POST({
		url: "/category/:id",
		options: {
			schema: {
				params: z.object({
					id: z.string(),
				}),
				body: z.object({
					adminId: z.string(),
				}),

				description:
					"Revoke all reports of a category in your community",
				tags: ["revocations"],
				security: [
					{
						authorization: [],
					},
				],
				response: {
					"200": z.array(Revocation),
				},
			},
		},
	})
	@Authenticate
	async revokeByCategory(
		req: FastifyRequest<{
			Params: {
				id: string
			}
			Body: {
				adminId: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { adminId } = req.body
		const { id: categoryId } = req.params

		const { community } = req.requestContext.get("auth")
		if (!community)
			return res.status(400).send({
				errorCode: 400,
				error: "Community Not Found",
				message: "Your community could not be found",
			})

		const isDiscordUser = await validateDiscordUser(adminId)
		if (!isDiscordUser)
			return res.status(400).send({
				errorCode: 400,
				error: "Bad Request",
				message: "adminId must be a valid Discord user",
			})

		const category = await CategoryModel.findOne({ id: categoryId })
		if (!category)
			return res.status(400).send({
				errorCode: 400,
				error: "Bad Request",
				message: "id must be a valid ID",
			})

		await ReportInfoModel.updateMany(
			{
				communityId: community.id,
				categoryId: categoryId,
				revokedAt: { $eq: null },
			},
			{
				revokedAt: new Date(),
				revokedBy: adminId,
			}
		)

		const rawRevocations = await ReportInfoModel.find({
			communityId: community.id,
			categoryId: categoryId,
			revokedAt: { $ne: null },
		})
		const revocations = z.array(Revocation).parse(rawRevocations)

		const CategoryMap: Map<
			string,
			DocumentType<CategoryClass, BeAnObject> | null
		> = new Map()

		await Promise.all(
			revocations.map(async (revocation) => {
				if (CategoryMap.get(revocation.categoryId)) return

				CategoryMap.set(
					revocation.categoryId,
					await CategoryModel.findOne({
						id: revocation.categoryId,
					}).exec()
				)
			})
		)

		const revoker = await client.users.fetch(adminId)
		revocations.forEach(async (revocation) => {
			const totalReports = await ReportInfoModel.find({
				playername: revocation.playername,
			})
			const differentCommunities = new Set(
				totalReports.map((report) => report.communityId)
			).size

			reportRevokedMessage(revocation, {
				community: <ReportMessageExtraOpts["community"]>(
					(<unknown>community.toObject())
				),
				// this is allowed since the category is GUARANTEED to exist if the report exists
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				category: <ReportMessageExtraOpts["category"]>(
					(<unknown>CategoryMap.get(revocation.categoryId)!)
				),
				revokedBy: <RevocationMessageExtraOpts["revokedBy"]>(
					(<unknown>revoker)
				),
				totalReports: totalReports.length,
				totalCommunities: differentCommunities,
			})
		})

		return res.status(200).send(revocations)
	}

	@POST({
		url: "/player/:playername",
		options: {
			schema: {
				params: z.object({
					playername: z.string(),
				}),
				body: z.object({
					adminId: z.string(),
				}),

				description: "Revoke all reports of a player in your community",
				tags: ["revocations"],
				security: [
					{
						authorization: [],
					},
				],
				response: {
					"200": z.array(Revocation),
				},
			},
		},
	})
	@Authenticate
	async revokeByPlayer(
		req: FastifyRequest<{
			Params: {
				playername: string
			}
			Body: {
				adminId: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { adminId } = req.body
		const { playername } = req.params

		const { community } = req.requestContext.get("auth")
		if (!community)
			return res.status(400).send({
				errorCode: 400,
				error: "Community Not Found",
				message: "Your community could not be found",
			})

		const isDiscordUser = await validateDiscordUser(adminId)
		if (!isDiscordUser)
			return res.status(400).send({
				errorCode: 400,
				error: "Bad Request",
				message: "adminId must be a valid Discord user",
			})

		const reports = await ReportInfoModel.find({
			communityId: community.id,
			playername: playername,
		})

		await ReportInfoModel.updateMany(
			{
				communityId: community.id,
				playername: playername,
				revokedAt: { $eq: null },
			},
			{
				revokedAt: new Date(),
				revokedBy: adminId,
			}
		)

		const rawRevocations = await ReportInfoModel.find({
			communityId: community.id,
			playername: playername,
			revokedAt: { $ne: null },
		})
		const revocations = z.array(Revocation).parse(rawRevocations)

		const CategoryMap: Map<
			string,
			DocumentType<CategoryClass, BeAnObject> | null
		> = new Map()

		await Promise.all(
			revocations.map(async (revocation) => {
				if (CategoryMap.get(revocation.categoryId)) return

				CategoryMap.set(
					revocation.categoryId,
					await CategoryModel.findOne({
						id: revocation.categoryId,
					}).exec()
				)
			})
		)

		const allReports = await ReportInfoModel.find({
			playername: playername,
		}).select(["communityId"])
		const differentCommunities: Set<string> = new Set()
		allReports.forEach((report) =>
			differentCommunities.add(report.communityId)
		)

		const revoker = await client.users.fetch(adminId)
		revocations.forEach(async (revocation) => {
			reportRevokedMessage(revocation, {
				community: <ReportMessageExtraOpts["community"]>(
					(<unknown>community.toObject())
				),
				// this is allowed since the category is GUARANTEED to exist if the report exists
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				category: <ReportMessageExtraOpts["category"]>(
					(<unknown>CategoryMap.get(revocation.categoryId)!)
				),
				revokedBy: <RevocationMessageExtraOpts["revokedBy"]>(
					(<unknown>revoker)
				),
				totalReports: allReports.length,
				totalCommunities: differentCommunities.size,
			})
		})

		return res.status(200).send(revocations)
	}

	@POST({
		url: "/admin/:snowflake",
		options: {
			schema: {
				params: z.object({
					snowflake: z.string(),
				}),

				description:
					"Revoke all reports created by an admin in your community",
				tags: ["revocations"],
				security: [
					{
						authorization: [],
					},
				],
				response: {
					"200": z.array(Revocation),
				},
			},
		},
	})
	@Authenticate
	async revokeByAdmin(
		req: FastifyRequest<{
			Params: {
				snowflake: string
			}
			Body: {
				adminId: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { snowflake } = req.params
		const { adminId } = req.body
		const { community } = req.requestContext.get("auth")
		if (!community)
			return res.status(404).send({
				errorCode: 404,
				error: "Community not found",
				message: "Community not found",
			})

		const admin = await validateDiscordUser(adminId)
		if (!admin)
			return res.status(400).send({
				errorCode: 400,
				error: "Bad Request",
				message: "adminId must be a valid Discord user ID",
			})

		// revoke all the reports
		await ReportInfoModel.updateMany(
			{
				communityId: community.id,
				adminId: adminId,
				revokedAt: { $eq: null },
			},
			{
				revokedAt: new Date(),
				revokedBy: snowflake,
			}
		)
		const rawRevocations = await ReportInfoModel.find({
			communityId: community.id,
			adminId: adminId,
			revokedAt: { $ne: null },
		})
		const revocations = z.array(Revocation).parse(rawRevocations)

		const CategoryMap: Map<
			string,
			DocumentType<CategoryClass, BeAnObject> | null
		> = new Map()

		await Promise.all(
			revocations.map(async (revocation) => {
				if (CategoryMap.get(revocation.categoryId)) return

				CategoryMap.set(
					revocation.categoryId,
					await CategoryModel.findOne({
						id: revocation.categoryId,
					}).exec()
				)
			})
		)

		const revoker = await client.users.fetch(adminId)
		revocations.forEach(async (revocation) => {
			const totalReports = await ReportInfoModel.find({
				playername: revocation.playername,
			})
			const differentCommunities = new Set(
				totalReports.map((report) => report.communityId)
			).size

			reportRevokedMessage(revocation, {
				community: <ReportMessageExtraOpts["community"]>(
					(<unknown>community.toObject())
				),
				// this is allowed since the category is GUARANTEED to exist if the report exists
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				category: <ReportMessageExtraOpts["category"]>(
					(<unknown>CategoryMap.get(revocation.categoryId)!)
				),
				revokedBy: <RevocationMessageExtraOpts["revokedBy"]>(
					(<unknown>revoker)
				),
				totalReports: totalReports.length,
				totalCommunities: differentCommunities,
			})
		})

		return res.send(revocations)
	}
}
