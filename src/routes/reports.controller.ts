import { FastifyReply, FastifyRequest } from "fastify"
import { Controller, GET, POST } from "fastify-decorators"
import CategoryModel from "../database/category"
import { Authenticate } from "../utils/authentication"
import { reportCreatedMessage } from "../utils/info"
import ReportInfoModel from "../database/reportinfo"
import { validateDiscordUser, client } from "../utils/discord"
import {
	Community,
	Category,
	ReportMessageExtraOpts,
} from "fagc-api-types"
import GuildConfigModel from "../database/guildconfig"
import { z } from "zod"
import validator from "validator"

@Controller({ route: "/reports" })
export default class ReportController {
	@GET({
		url: "/",
		options: {
			schema: {
				description: "Get all reports",
				tags: [ "reports" ],
				response: {
					"200": {
						type: "array",
						items: { $ref: "ReportClass#" }
					},
				},
			},
		},
	})
	async getAllReports(
		req: FastifyRequest,
		res: FastifyReply
	): Promise<FastifyReply> {
		const community = await ReportInfoModel.find()
		return res.send(community)
	}

	@POST({
		url: "/",
		options: {
			schema: {
				body: z.object({
					adminId: z.string(),
					playername: z.string(),
					categoryId: z.string(),
					automated: z.boolean().nullish().default(false),
					reportedTime: z.string().default(new Date().toISOString()).refine((input) => validator.isISO8601(input), "reportedTime must be a valid ISO8601 date"),
					description: z.string().default("No description"),
					proof: z.string().default("No proof").refine((input) => {
						if (input === "No proof") return true
						return input
							.split(" ")
							.map((part) => validator.isURL(part))
							.reduce((prev, current) => prev && current)
					}, "Proof must be URLs split by a space"),
				}),

				description: "Create a report",
				tags: [ "reports" ],
				security: [
					{
						authorization: [],
					},
				],
				response: {
					"200": {
						$ref: "ReportClass#",
					},
				},
			},
		},
	})
	@Authenticate
	async createReport(
		req: FastifyRequest<{
			Body: {
				adminId: string
				playername: string
				categoryId: string
				automated: boolean
				reportedTime: string
				description: string
				proof: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const {
			adminId,
			playername,
			categoryId,
			automated,
			reportedTime,
			description,
			proof,
		} = req.body

		const community = req.requestContext.get("community")
		if (!community)
			return res.status(400).send({
				errorCode: 400,
				error: "Community Not Found",
				message: "Your community could not be found",
			})

		const category = await CategoryModel.findOne({ id: categoryId })
		if (!category)
			return res.status(400).send({
				errorCode: 400,
				error: "Bad Request",
				message: "categoryId must be a valid ID",
			})

		const isDiscordUser = await validateDiscordUser(adminId)
		if (!isDiscordUser)
			return res.status(400).send({
				errorCode: 400,
				error: "Bad Request",
				message: "adminId must be a valid Discord user ID",
			})
		const admin = await client.users.fetch(adminId)

		// check whether any one of the community configs allows for this category, if not, then don't accept the report
		const communityConfigs = await GuildConfigModel.find({
			communityId: community.id,
		})
		if (!communityConfigs.length)
			return res.status(400).send({
				errorCode: 400,
				error: "Bad Request",
				message: "Your community does not have a community config",
			})
		const foundCategoryFilter = communityConfigs.find((config) => {
			return (
				config.categoryFilters?.length &&
				config.categoryFilters.indexOf(category.id) !== -1
			)
		})
		if (!foundCategoryFilter)
			return res.status(400).send({
				errorCode: 400,
				error: "Bad Request",
				message:
					"Your community does not filter for the specified category",
			})
		

		const report = await ReportInfoModel.create({
			playername: playername,
			adminId: adminId,
			categoryId: categoryId,
			automated: automated,
			reportedTime: reportedTime,
			description: description,
			proof: proof,
			communityId: community.id,
		})

		const allReports = await ReportInfoModel.find({
			playername: playername,
		}).select([ "communityId" ])
		const differentCommunities: Set<string> = new Set()
		allReports.forEach((report) =>
			differentCommunities.add(report.communityId)
		)

		reportCreatedMessage(report, {
			community: <Community>(<unknown>community.toObject()),
			category: <Category>(<unknown>category.toObject()),
			createdBy: <ReportMessageExtraOpts["createdBy"]>(<unknown>admin),
			totalReports: allReports.length,
			totalCommunities: differentCommunities.size,
		})
		return res.status(200).send(report)
	}

	@GET({
		url: "/:id",
		options: {
			schema: {
				params: z.object({
					id: z.string(),
				}),

				description: "Fetch a report by it's ID",
				tags: [ "reports" ],
				response: {
					"200": {
						allOf: [ { nullable: true }, { $ref: "ReportClass#" } ],
					},
				},
			},
		},
	})
	async getReport(
		req: FastifyRequest<{
			Params: {
				id: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { id } = req.params
		const community = await ReportInfoModel.findOne({ id: id })
		return res.send(community)
	}

	@GET({
		url: "/search",
		options: {
			schema: {
				querystring: z.object({
					playername: z.string(),
					communityId: z.string(),
					categoryId: z.string(),
				}).partial().refine((x) => x.playername || x.communityId || x.categoryId, "At least one query param must be specified"),

				description: "Search for reports using their playername, communityId or categoryId",
				tags: [ "reports" ],
				response: {
					"200": {
						type: "array",
						items: {
							$ref: "ReportClass#",
						},
					},
				},
			},
		},
	})
	async search(
		req: FastifyRequest<{
			Querystring: {
				playername?: string
				communityId?: string
				categoryId?: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		// the querystring validator already makes sure that there is at least one prop, so we can just use it now
		// TODO: finish + test this
		const { playername, communityId, categoryId } = req.query
		const reports = await ReportInfoModel.find({
			playername: playername,
			communityId: communityId,
			categoryId: categoryId,
		})
		return res.send(reports)
	}

	@GET({
		url: "/category/:id",
		options: {
			schema: {
				params: z.object({
					id: z.string()
				}),

				description: "Fetch a report by it's broken category ID",
				tags: [ "reports" ],
				response: {
					"200": {
						type: "array",
						items: {
							$ref: "ReportClass#",
						},
					},
				},
			},
		},
	})
	async getByCategory(
		req: FastifyRequest<{
			Params: {
				id: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const reports = await ReportInfoModel.find({ categoryId: req.params.id })
		return res.status(200).send(reports)
	}

	@GET({
		url: "/player/:playername",
		options: {
			schema: {
				params: z.object({
					playername: z.string(),
				}),

				description: "Fetch reports by their player name",
				tags: [ "reports" ],
				response: {
					"200": {
						type: "array",
						items: {
							allOf: [
								{ nullable: true },
								{ $ref: "ReportClass#" },
							],
						},
					},
				},
			},
		},
	})
	async getPlayer(
		req: FastifyRequest<{
			Params: {
				playername: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const reports = await ReportInfoModel.find({
			playername: req.params.playername,
		})
		return res.status(200).send(reports)
	}

	@GET({
		url: "/community/:communityId",
		options: {
			schema: {
				params: z.object({
					communityId: z.string(),
				}),

				description:
					"Fetch reports by their community ID",
				tags: [ "reports" ],
				response: {
					"200": {
						type: "array",
						items: {
							$ref: "ReportClass#",
						},
					},
				},
			},
		},
	})
	async getCommunity(
		req: FastifyRequest<{
			Params: {
				communityId: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const reports = await ReportInfoModel.find({
			communityId: req.params.communityId,
		})
		return res.status(200).send(reports)
	}

	@POST({
		url: "/list",
		options: {
			schema: {
				body: z.object({
					playername: z.string().nullish(),
					categoryIds: z.array(z.string())
						.max(100, "Exceeded maximum length of 100"),
					communityIds: z.array(z.string())
						.max(100, "Exceeded maximum length of 100"),

				}),

				description:
					"Fetch reports by their community IDs and category IDs",
				tags: [ "reports" ],
				response: {
					"200": {
						type: "array",
						items: {
							$ref: "ReportClass#",
						},
					},
				},
			}
		}
	})
	async listReports(
		req: FastifyRequest<{
			Body: {
				playername?: string | null
				categoryIds: string[]
				communityIds: string[]
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { playername, categoryIds, communityIds } = req.body
		const reports = await ReportInfoModel.find({
			playername: playername ?? undefined,
			categoryId: {
				$in: categoryIds
			},
			communityId: {
				$in: communityIds
			}
		})
		return res.send(reports)
	}

	@GET({
		url: "/since/:timestamp",
		options: {
			schema: {
				params: z.object({
					timestamp: z.string().refine(
						(input) =>
						// use validator to check if it's a valid timestamp
							validator.isISO8601(input),
						"Invalid timestamp"
					)
				}),

				description: "Fetch reports modified since a timestamp",
				tags: [ "reports" ],
				response: {
					"200": {
						type: "array",
						items: {
							$ref: "ReportClass#",
						},
					},
				},
			},
		},
	})
	async getSince(
		req: FastifyRequest<{
			Params: {
				timestamp: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { timestamp } = req.params

		const date = new Date(timestamp)
		if (isNaN(date.getDate())) return res.send([])

		const reports = await ReportInfoModel.find({
			createdAt: { $gt: date },
		})
		return res.send(reports)
	}
}
