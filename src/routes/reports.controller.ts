import { FastifyReply, FastifyRequest } from "fastify"
import { Controller, GET, POST, DELETE } from "fastify-decorators"
import RuleModel, { RuleClass } from "../database/fagc/rule.js"
import { Authenticate } from "../utils/authentication.js"
import { reportCreatedMessage, reportRevokedMessage } from "../utils/info.js"
import ReportModel from "../database/fagc/report.js"
import RevocationModel from "../database/fagc/revocation.js"
import { validateDiscordUser, client } from "../utils/discord.js"
import { BeAnObject, DocumentType } from "@typegoose/typegoose/lib/types"
import {
	Community,
	Rule,
	ReportMessageExtraOpts,
	RevocationMessageExtraOpts,
} from "fagc-api-types"
import GuildConfigModel from "../database/fagc/guildconfig.js"
import { z } from "zod"
import validator from "validator"

@Controller({ route: "/reports" })
export default class ReportController {
	@GET({
		url: "/:id",
		options: {
			schema: {
				params: z.object({
					id: z.string()
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
		const community = await ReportModel.findOne({ id: id })
		return res.send(community)
	}

	@GET({
		url: "/rule/:id",
		options: {
			schema: {
				params: z.object({
					id: z.string()
				}),

				description: "Fetch a report by it's broken rule ID",
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
	async getByRule(
		req: FastifyRequest<{
			Params: {
				id: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const reports = await ReportModel.find({ brokenRule: req.params.id })
		return res.status(200).send(reports)
	}

	@GET({
		url: "/getplayer/:playername",
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
		const reports = await ReportModel.find({
			playername: req.params.playername,
		})
		return res.status(200).send(reports)
	}

	@GET({
		url: "/getplayercommunity/:playername/:communityId",
		options: {
			schema: {
				params: z.object({
					playername: z.string(),
					communityId: z.string(),
				}),

				description:
					"Fetch reports by their player name and community ID",
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
	async getPlayerCommunity(
		req: FastifyRequest<{
			Params: {
				playername: string
				communityId: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const reports = await ReportModel.find({
			playername: req.params.playername,
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
					ruleIDs: z.array(z.string()).max(100, "Exceeded maximum length of 100"),
					communityIDs: z.array(z.string()).max(100, "Exceeded maximum length of 100"),

				}),

				description:
					"Fetch reports by their community IDs and rule IDs",
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
	async getFilteredReports(
		req: FastifyRequest<{
			Body: {
				playername?: string | null
				ruleIDs: string[]
				communityIDs: string[]
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { playername, ruleIDs, communityIDs } = req.body
		const reports = await ReportModel.find({
			playername: playername ?? undefined,
			brokenRule: {
				$in: ruleIDs
			},
			communityId: {
				$in: communityIDs
			}
		})
		return res.send(reports)
	}

	@GET({
		url: "/modifiedSince/:timestamp",
		options: {
			schema: {
				params: z.object({
					timestamp: z.string()
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
		if (isNaN(date.getDate())) return res.send([])

		const reports = await ReportModel.find({
			createdAt: { $gt: date },
		})
		return res.send(reports)
	}

	@POST({
		url: "/",
		options: {
			schema: {
				body: z.object({
					adminId: z.string(),
					playername: z.string(),
					brokenRule: z.string(),
					automated: z.boolean().nullish().default(false),
					reportedTime: z.string().default(new Date().toISOString()),
					description: z.string().default("No description"),
					proof: z.string().default("No proof").refine((input) => {
						if (input === "No proof") return true
						return input
							.split(" ")
							// TODO: make the zod url validator more precise
							// logged "http://github.comhttps//reddit.com" as correct which it isnt
							.map((part) => z.string().url().safeParse(part).success)
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
				brokenRule: string
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
			brokenRule,
			automated,
			reportedTime,
			description,
			proof,
		} = req.body

		// TODO: make use of zod's URL validators when i fix them
		if (proof !== "No proof") {
			for (const string of proof.split(" ")) {
				if (!validator.isURL(string, {
					protocols: [ "http", "https" ]
				})) {
					return res.status(400).send({
						errorCode: 400,
						error: "Bad Request",
						message: "proof must be a string of URLs separated with spaces"
					})
				}
			}
		}

		const community = req.requestContext.get("community")
		if (!community)
			return res.status(400).send({
				errorCode: 400,
				error: "Community Not Found",
				message: "Your community could not be found",
			})

		const rule = await RuleModel.findOne({ id: brokenRule })
		if (!rule)
			return res.status(400).send({
				errorCode: 400,
				error: "Bad Request",
				message: "brokenRule must be a valid ID",
			})

		const isDiscordUser = await validateDiscordUser(adminId)
		if (!isDiscordUser)
			return res.status(400).send({
				errorCode: 400,
				error: "Bad Request",
				message: "adminId must be a valid Discord user ID",
			})
		const admin = await client.users.fetch(adminId)

		// check whether any one of the community configs allows for this rule, if not, then don't accept the report
		const communityConfigs = await GuildConfigModel.find({
			communityId: community.id,
		})
		if (!communityConfigs.length)
			return res.status(400).send({
				errorCode: 400,
				error: "Bad Request",
				message: "Your community does not have a community config",
			})
		const foundRuleFilter = communityConfigs.find((config) => {
			return (
				config.ruleFilters?.length &&
				config.ruleFilters.indexOf(rule.id) !== -1
			)
		})
		if (!foundRuleFilter)
			return res.status(400).send({
				errorCode: 400,
				error: "Bad Request",
				message:
					"Your community does not filter for the specified rule",
			})
		

		const report = await ReportModel.create({
			playername: playername,
			adminId: adminId,
			brokenRule: brokenRule,
			automated: automated,
			reportedTime: reportedTime,
			description: description,
			proof: proof,
			communityId: community.id,
		})

		const allReports = await ReportModel.find({
			playername: playername,
		}).select([ "communityId" ])
		const differentCommunities: Set<string> = new Set()
		allReports.forEach((report) =>
			differentCommunities.add(report.communityId)
		)

		reportCreatedMessage(report, {
			community: <Community>(<unknown>community.toObject()),
			rule: <Rule>(<unknown>rule.toObject()),
			admin: <ReportMessageExtraOpts["admin"]>(<unknown>admin),
			totalReports: allReports.length,
			totalCommunities: differentCommunities.size,
		})
		return res.status(200).send(report)
	}

	@DELETE({
		url: "/",
		options: {
			schema: {
				body: z.object({
					adminId: z.string(),
					id: z.string(),
				}),

				description: "Revoke a report",
				tags: [ "reports" ],
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
			Body: {
				adminId: string
				id: string
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

		const report = await ReportModel.findOne({ id: req.body.id })
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
		// this is allowed since the rule is GUARANTEED to exist if the report exists
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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

	@DELETE({
		url: "/revokeallname",
		options: {
			schema: {
				body: z.object({
					adminId: z.string(),
					playername: z.string(),
				}),

				description: "Revoke all report of a player in your community",
				tags: [ "reports" ],
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
	async revokeAllPlayer(
		req: FastifyRequest<{
			Body: {
				adminId: string
				playername: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { adminId, playername } = req.body

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
}
