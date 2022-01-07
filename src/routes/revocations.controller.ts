import { FastifyReply, FastifyRequest } from "fastify"
import { Controller, DELETE, GET, POST } from "fastify-decorators"
import RevocationModel from "../database/fagc/revocation.js"
import { z } from "zod"
import { Authenticate } from "../utils/authentication.js"
import { client, validateDiscordUser } from "../utils/discord.js"
import ReportModel from "../database/fagc/report.js"
import RuleModel, { RuleClass } from "../database/fagc/rule.js"
import { reportRevokedMessage } from "../utils/info.js"
import {
	Community,
	Rule,
	ReportMessageExtraOpts,
	RevocationMessageExtraOpts,
} from "fagc-api-types"
import { DocumentType } from "@typegoose/typegoose"
import { BeAnObject } from "@typegoose/typegoose/lib/types"

@Controller({ route: "/revocations" })
export default class RevocationController {
	@GET({
		url: "/",
		options: {
			schema: {
				description: "Fetch all revocations",
				tags: [ "revocations" ],
				security: [
					{
						authorization: [],
					},
				],
				response: {
					"200": {
						type: "array",
						items: {
							$ref: "RevocationClass#",
						},
					},
				},
			},
		},
	})
	@Authenticate
	async fetchAll(
		req: FastifyRequest,
		res: FastifyReply
	): Promise<FastifyReply> {
		const community = req.requestContext.get("community")
		if (!community) return res.status(404).send({
			errorCode: 404,
			error: "Community not found",
			message: "Community not found",
		})

		const revocations = await RevocationModel.find({
			communityId: community.id,
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

				description: "Fetch a revocation by ID",
				tags: [ "revocations" ],
				security: [
					{
						authorization: [],
					},
				],
				response: {
					"200": {
						allOf: [ { nullable: true }, { $ref: "ReportClass#" } ],
					},
				},
			},
		},
	})
	@Authenticate
	async fetchID(
		req: FastifyRequest<{
			Params: {
				id: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { id } = req.params
		const community = req.requestContext.get("community")
		if (!community) return res.status(404).send({
			errorCode: 404,
			error: "Community not found",
			message: "Community not found",
		})

		const revocation = await RevocationModel.findOne({
			id: id,
		})
		if (!revocation) return res.send(null)
		if (revocation.communityId !== community.id) return res.status(404).send({
			errorCode: 404,
			error: "Revocation not found",
			message: "Revocation not found",
		})

		return res.send(revocation)
	}

	@POST({
		url: "/:id",
		options: {
			schema: {
				params: z.object({
					id: z.string(),
				}),
				body: z.object({
					adminId: z.string(),
				}),

				description: "Revoke a report",
				tags: [ "revocations" ],
				security: [
					{
						authorization: [],
					},
				],
				response: {
					"200": {
						$ref: "RevocationClass#",
					},
				},
			},
		},
	})
	@Authenticate
	async revokeReport(
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
		const community = req.requestContext.get("community")
		if (!community)
			return res.status(400).send({
				errorCode: 400,
				error: "Community Not Found",
				message: "Your community could not be found",
			})

		const report = await ReportModel.findOne({ id: req.params.id })
		if (!report)
			return res.status(404).send({
				errorCode: 404,
				error: "Not Found",
				message: "Report could not be found",
			})
		if (report.communityId !== community.id)
			return res.status(403).send({
				errorCode: 403,
				error: "Access Denied",
				message: `You are trying to access a report of community ${report.communityId} but your community ID is ${community.id}`,
			})

		const isDiscordUser = await validateDiscordUser(req.body.adminId)
		if (!isDiscordUser)
			return res.status(400).send({
				errorCode: 400,
				error: "Bad Request",
				message: "adminId must be a valid Discord user",
			})
		const revoker = await client.users.fetch(req.body.adminId)
		const admin = await client.users.fetch(report.adminId)
		const rule = await RuleModel.findOne({ id: report.brokenRule })

		await ReportModel.findByIdAndDelete(report._id)

		const revocation = await RevocationModel.create({
			reportId: report.id,
			playername: report.playername,
			communityId: report.communityId,
			brokenRule: report.brokenRule,
			proof: report.proof,
			description: report.description,
			automated: report.automated,
			reportedTime: report.reportedTime,
			adminId: report.adminId,
			revokedTime: new Date(),
			revokedBy: req.body.adminId,
		})

		const allReports = await ReportModel.find({
			playername: report.playername,
		}).select([ "communityId" ])
		const differentCommunities: Set<string> = new Set()
		allReports.forEach((report) =>
			differentCommunities.add(report.communityId)
		)

		reportRevokedMessage(revocation, {
			community: <Community>(<unknown>community),
			// this is allowed since the rule is GUARANTEED to exist if the report exists
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			rule: <Rule>(<unknown>rule!),
			admin: <ReportMessageExtraOpts["admin"]>(<unknown>admin),
			revokedBy: <RevocationMessageExtraOpts["revokedBy"]>(
				(<unknown>revoker)
			),
			totalReports: allReports.length,
			totalCommunities: differentCommunities.size,
		})
		return res.status(200).send(revocation)
	}

	@GET({
		url: "/rule/:id",
		options: {
			schema: {
				params: z.object({
					id: z.string(),
				}),

				description: "Fetch all revocations of a rule in your community",
				tags: [ "revocations" ],
				security: [
					{
						authorization: [],
					},
				],
				response: {
					"200": {
						type: "array",
						items: {
							$ref: "RevocationClass#",
						},
					},
				},
			},
		},
	})
	@Authenticate
	async fetchRule(
		req: FastifyRequest<{
			Params: {
				id: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { id } = req.params
		const community = req.requestContext.get("community")
		if (!community) return res.status(404).send({
			errorCode: 404,
			error: "Community not found",
			message: "Community not found",
		})

		const revocations = await RevocationModel.find({
			brokenRuleId: id,
			communityId: community.id,
		})
		
		return res.send(revocations)
	}

	@POST({
		url: "/rule/:id",
		options: {
			schema: {
				params: z.object({
					id: z.string(),
				}),
				body: z.object({
					adminId: z.string(),
				}),

				description: "Revoke all reports of a rule in your community",
				tags: [ "revocations" ],
				security: [
					{
						authorization: [],
					},
				],
				response: {
					"200": {
						type: "array",
						items: {
							$ref: "RevocationClass#",
						},
					},
				},
			},
		},
	})
	@Authenticate
	async revokeRule(
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
		const { id: ruleID } = req.params

		const community = req.requestContext.get("community")
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
		
		const rule = await RuleModel.findOne({ id: ruleID })
		if (!rule)
			return res.status(400).send({
				errorCode: 400,
				error: "Bad Request",
				message: "id must be a valid ID",
			})

		const reports = await ReportModel.find({
			communityId: community.id,
			brokenRule: ruleID,
		})

		const revocations = await Promise.all(
			reports.map(async (report) => {
				const revocation = await RevocationModel.create({
					reportId: report.id,
					playername: report.playername,
					communityId: report.communityId,
					brokenRule: report.brokenRule,
					proof: report.proof,
					description: report.description,
					automated: report.automated,
					reportedTime: report.reportedTime,
					adminId: report.adminId,
					revokedTime: new Date(),
					revokedBy: adminId,
				})
				await report.remove()
				return revocation
			})
		)

		const RuleMap: Map<string, DocumentType<RuleClass, BeAnObject> | null> =
			new Map()

		await Promise.all(
			revocations.map(async (revocation) => {
				if (RuleMap.get(revocation.brokenRule)) return

				RuleMap.set(
					revocation.brokenRule,
					await RuleModel.findOne({
						id: revocation.brokenRule,
					}).exec()
				)
			})
		)

		const revoker = await client.users.fetch(adminId)
		revocations.forEach(async (revocation) => {
			const admin = await client.users.fetch(revocation.adminId)
			const totalReports = await ReportModel.find({
				playername: revocation.playername,
			})
			const differentCommunities = new Set(totalReports.map((report) => report.communityId)).size
				
			reportRevokedMessage(revocation, {
				community: <ReportMessageExtraOpts["community"]>(
					(<unknown>community.toObject())
				),
				// this is allowed since the rule is GUARANTEED to exist if the report exists
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				rule: <ReportMessageExtraOpts["rule"]><unknown>RuleMap.get(revocation.brokenRule)!,
				admin: <ReportMessageExtraOpts["admin"]>(<unknown>admin),
				revokedBy: <RevocationMessageExtraOpts["revokedBy"]><unknown>revoker,
				totalReports: totalReports.length,
				totalCommunities: differentCommunities,
			})
		})

		return res.status(200).send(revocations)
	}

	@GET({
		url: "/player/:playername",
		options: {
			schema: {
				params: z.object({
					playername: z.string(),
				}),

				description: "Fetch all revocations of a player in your community",
				tags: [ "revocations" ],
				security: [
					{
						authorization: [],
					},
				],
				response: {
					"200": {
						type: "array",
						items: {
							$ref: "RevocationClass#",
						},
					},
				},
			},
		},
	})
	@Authenticate
	async fetchPlayer(
		req: FastifyRequest<{
			Params: {
				playername: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { playername } = req.params
		const community = req.requestContext.get("community")
		if (!community) return res.status(404).send({
			errorCode: 404,
			error: "Community not found",
			message: "Community not found",
		})

		const revocations = await RevocationModel.find({
			playername: playername,
			communityId: community.id,
		})

		return res.send(revocations)
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
				tags: [ "revocations" ],
				security: [
					{
						authorization: [],
					},
				],
				response: {
					"200": {
						type: "array",
						items: {
							$ref: "RevocationClass#",
						},
					},
				},
			},
		},
	})
	@Authenticate
	async revokePlayer(
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

		const community = req.requestContext.get("community")
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

		const reports = await ReportModel.find({
			communityId: community.id,
			playername: playername,
		})

		const revocations = await Promise.all(
			reports.map(async (report) => {
				const revocation = await RevocationModel.create({
					reportId: report.id,
					playername: report.playername,
					communityId: report.communityId,
					brokenRule: report.brokenRule,
					proof: report.proof,
					description: report.description,
					automated: report.automated,
					reportedTime: report.reportedTime,
					adminId: report.adminId,
					revokedTime: new Date(),
					revokedBy: adminId,
				})
				await report.remove()
				return revocation
			})
		)

		const RuleMap: Map<string, DocumentType<RuleClass, BeAnObject> | null> =
			new Map()

		await Promise.all(
			revocations.map(async (revocation) => {
				if (RuleMap.get(revocation.brokenRule)) return

				RuleMap.set(
					revocation.brokenRule,
					await RuleModel.findOne({
						id: revocation.brokenRule,
					}).exec()
				)
			})
		)

		const allReports = await ReportModel.find({
			playername: playername,
		}).select([ "communityId" ])
		const differentCommunities: Set<string> = new Set()
		allReports.forEach((report) =>
			differentCommunities.add(report.communityId)
		)

		const revoker = await client.users.fetch(adminId)
		revocations.forEach(async (revocation) => {
			const admin = await client.users.fetch(revocation.adminId)
			reportRevokedMessage(revocation, {
				community: <ReportMessageExtraOpts["community"]>(
					(<unknown>community.toObject())
				),
				// this is allowed since the rule is GUARANTEED to exist if the report exists
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				rule: <ReportMessageExtraOpts["rule"]><unknown>RuleMap.get(revocation.brokenRule)!,
				admin: <ReportMessageExtraOpts["admin"]>(<unknown>admin),
				revokedBy: <RevocationMessageExtraOpts["revokedBy"]><unknown>revoker,
				totalReports: allReports.length,
				totalCommunities: differentCommunities.size,
			})
		})

		return res.status(200).send(revocations)
	}

	@GET({
		url: "/admin/:snowflake",
		options: {
			schema: {
				params: z.object({
					snowflake: z.string(),
				}),

				description: "Fetch all revocations revoked by an admin in your community",
				tags: [ "revocations" ],
				security: [
					{
						authorization: [],
					},
				],
				response: {
					"200": {
						type: "array",
						items: {
							$ref: "RevocationClass#",
						},
					},
				},
			},
		},
	})
	@Authenticate
	async fetchAdmin(
		req: FastifyRequest<{
			Params: {
				snowflake: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { snowflake } = req.params
		const community = req.requestContext.get("community")
		if (!community) return res.status(404).send({
			errorCode: 404,
			error: "Community not found",
			message: "Community not found",
		})

		const admin = await validateDiscordUser(snowflake)
		if (!admin)
			return res.status(400).send({
				errorCode: 400,
				error: "Bad Request",
				message: "adminId must be a valid Discord user ID",
			})

		const revocations = await RevocationModel.find({
			adminId: snowflake,
			communityId: community.id,
		})
		
		return res.send(revocations)
	}

	@POST({
		url: "/admin/:snowflake",
		options: {
			schema: {
				params: z.object({
					snowflake: z.string(),
				}),

				description: "Revoke all reports created by an admin in your community",
				tags: [ "revocations" ],
				security: [
					{
						authorization: [],
					},
				],
				response: {
					"200": {
						type: "array",
						items: {
							$ref: "RevocationClass#",
						},
					},
				},
			},
		},
	})
	@Authenticate
	async revokeAdmin(
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
		const community = req.requestContext.get("community")
		if (!community) return res.status(404).send({
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
		const reports = await ReportModel.find({
			adminId: snowflake,
			communityId: community.id,
		})
		await ReportModel.deleteMany({
			id: {
				$in: reports.map((report) => report.id),
			}
		})
		
		const revocations = await Promise.all(
			reports.map(async (report) => {
				const revocation = await RevocationModel.create({
					reportId: report.id,
					playername: report.playername,
					communityId: report.communityId,
					brokenRule: report.brokenRule,
					proof: report.proof,
					description: report.description,
					automated: report.automated,
					reportedTime: report.reportedTime,
					adminId: report.adminId,
					revokedTime: new Date(),
					revokedBy: adminId,
				})
				await report.remove()
				return revocation
			})
		)

		const RuleMap: Map<string, DocumentType<RuleClass, BeAnObject> | null> =
			new Map()

		await Promise.all(
			revocations.map(async (revocation) => {
				if (RuleMap.get(revocation.brokenRule)) return

				RuleMap.set(
					revocation.brokenRule,
					await RuleModel.findOne({
						id: revocation.brokenRule,
					}).exec()
				)
			})
		)

		const revoker = await client.users.fetch(adminId)
		revocations.forEach(async (revocation) => {
			const admin = await client.users.fetch(revocation.adminId)
			const totalReports = await ReportModel.find({
				playername: revocation.playername,
			})
			const differentCommunities = new Set(totalReports.map((report) => report.communityId)).size
				
			reportRevokedMessage(revocation, {
				community: <ReportMessageExtraOpts["community"]>(
					(<unknown>community.toObject())
				),
				// this is allowed since the rule is GUARANTEED to exist if the report exists
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				rule: <ReportMessageExtraOpts["rule"]><unknown>RuleMap.get(revocation.brokenRule)!,
				admin: <ReportMessageExtraOpts["admin"]>(<unknown>admin),
				revokedBy: <RevocationMessageExtraOpts["revokedBy"]><unknown>revoker,
				totalReports: totalReports.length,
				totalCommunities: differentCommunities,
			})
		})
		
		return res.send(revocations)
	}

	@GET({
		url: "/modifiedSince/:timestamp",
		options: {
			schema: {
				params: z.object({
					timestamp: z.string(), // TODO: better time validation
				}),

				description:
					"Fetch all revocations of a player modified since a timestamp",
				tags: [ "revocations" ],
				security: [
					{
						authorization: [],
					},
				],
				response: {
					"200": {
						type: "array",
						items: {
							$ref: "RevocationClass#",
						},
					},
				},
			},
		},
	})
	async getModifiedSince(
		req: FastifyRequest<{
			Params: {
				timestamp: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { timestamp } = req.params

		const date = new Date(timestamp)

		const revocations = await RevocationModel.find({
			createdAt: { $gt: date },
		})
		return res.send(revocations)
	}
}
