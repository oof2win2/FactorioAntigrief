import { FastifyReply, FastifyRequest } from "fastify"
import { Controller, DELETE, GET, POST } from "fastify-decorators"
import RuleModel from "../database/fagc/rule.js"
import GuildConfigModel from "../database/fagc/guildconfig.js"
import { MasterAuthenticate } from "../utils/authentication.js"
import { guildConfigChanged, ruleCreatedMessage, ruleRemovedMessage, rulesMergedMessage, ruleUpdatedMessage } from "../utils/info.js"
import { z } from "zod"
import ReportModel from "../database/fagc/report.js"
import RevocationModel from "../database/fagc/revocation.js"

@Controller({ route: "/rules" })
export default class RuleController {
	@GET({
		url: "/",
		options: {
			schema: {
				description: "Fetch all rules",
				tags: [ "rules" ],
				response: {
					"200": {
						type: "array",
						items: {
							$ref: "RuleClass#",
						},
					},
				},
			},
		},
	})
	async getAllRules(
		_req: FastifyRequest,
		res: FastifyReply
	): Promise<FastifyReply> {
		const rules = await RuleModel.find({})
		return res.send(rules)
	}

	@GET({
		url: "/:id",
		options: {
			schema: {
				params: z.object({
					id: z.string().transform(x => x.toLowerCase()),
				}).required(),

				description: "Fetch a rule by ID",
				tags: [ "rules" ],
				response: {
					"200": {
						allOf: [ { nullable: true }, { $ref: "RuleClass#" } ],
					},
				},
			},
		},
	})
	async getRule(
		req: FastifyRequest<{
			Params: {
				id: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { id } = req.params
		const rule = await RuleModel.findOne({ id: id })
		return res.send(rule)
	}

	@POST({
		url: "/",
		options: {
			schema: {
				body: z.object({
					shortdesc: z.string(),
					longdesc: z.string()
				}).required(),

				description: "Create a rule",
				tags: [ "rules" ],
				security: [
					{
						masterAuthorization: [],
					},
				],
				response: {
					"200": {
						$ref: "RuleClass#",
					},
				},
			},
		},
	})
	@MasterAuthenticate
	async create(
		req: FastifyRequest<{
			Body: {
				shortdesc: string
				longdesc: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { shortdesc, longdesc } = req.body
		const rule = await RuleModel.create({
			shortdesc: shortdesc,
			longdesc: longdesc,
		})
		ruleCreatedMessage(rule)
		return res.send(rule)
	}

	@POST({
		url: "/:id",
		options: {
			schema: {
				params: z.object({
					id: z.string()
				}).required(),
				body: z.object({
					shortdesc: z.string().optional(),
					longdesc: z.string().optional(),
				}).optional(),

				description: "Update a rule",
				tags: [ "rules" ],
				security: [
					{
						masterAuthorization: [],
					},
				],
				response: {
					"200": {
						$ref: "RuleClass#",
					},
				},
			},
		},
	})
	@MasterAuthenticate
	async update(
		req: FastifyRequest<{
			Params: {
				id: string
			}
			Body: {
				shortdesc?: string
				longdesc?: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { shortdesc, longdesc } = req.body
		const { id } = req.params

		if (!shortdesc && !longdesc) {
			return res.send(await RuleModel.findOne({ id: id }))
		}
		const oldRule = await RuleModel.findOne({ id: id })

		if (!oldRule) return res.send(null)
		const newRule = await RuleModel.findOneAndUpdate({
			id: id
		}, {
			...Boolean(shortdesc) && { shortdesc: shortdesc },
			...Boolean(longdesc) && { longdesc: longdesc }
		}, { new: true })
		if (!newRule) return res.send(null)

		ruleUpdatedMessage(oldRule, newRule)

		return res.send(newRule)
	}

	@DELETE({
		url: "/:id",
		options: {
			schema: {
				params: z.object({
					id: z.string().transform(x => x.toLowerCase()),
				}),

				description: "Remove a rule",
				tags: [ "rules" ],
				security: [
					{
						masterAuthorization: [],
					},
				],
				response: {
					"200": {
						$ref: "RuleClass#",
					},
				},
			},
		},
	})
	@MasterAuthenticate
	async delete(
		req: FastifyRequest<{
			Params: {
				id: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { id } = req.params
		const rule = await RuleModel.findOneAndRemove({
			id: id,
		})

		if (rule) {
			ruleRemovedMessage(rule)
			// store the IDs of the affected guilds - ones which have the rule filtered
			const affectedGuildConfigs = await GuildConfigModel.find({
				ruleFilters: [ rule.id ]
			})
			
			// remove the rule ID from any guild configs which may have it
			await GuildConfigModel.updateMany({
				_id: { $in: affectedGuildConfigs.map(config => config._id) }
			}, {
				$pull: { ruleFilters: rule.id }
			})

			const newGuildConfigs = await GuildConfigModel.find({
				_id: { $in: affectedGuildConfigs.map(config => config._id) }
			})

			await RevocationModel.deleteMany({
				brokenRule: rule.id
			})
			await ReportModel.deleteMany({
				brokenRule: rule.id
			})

			// tell guilds about it after the revocations + reports have been removed
			const sendGuildConfigInfo = async () => {
				const wait = (ms: number): Promise<void> => new Promise((resolve) => {
					setTimeout(() => {
						resolve()
					}, ms)
				})
				for (const config of newGuildConfigs) {
					guildConfigChanged(config)
					// 1000 * 100 / 1000 = amount of seconds it will take for 100 communities
					// staggered so not everyone at once tries to fetch their new banlists
					await wait(100)
				}
			}
			sendGuildConfigInfo() // this will make it execute whilst letting other code still run
		}
		return res.send(rule)
	}

	@POST({
		url: "/:idReceiving/merge/:idDissolving",
		options: {
			schema: {
				params: z.object({
					idReceiving: z.string().transform(x => x.toLowerCase()),
					idDissolving: z.string().transform(x => x.toLowerCase()),
				}),

				description: "Merge rule idTwo into rule idReceiving",
				tags: [ "rules" ],
				security: [
					{
						masterAuthorization: [],
					},
				],
				response: {
					"200": {
						$ref: "RuleClass#",
					},
				},
			},
		},
	})
	@MasterAuthenticate
	async mergeRules(
		req: FastifyRequest<{
			Params: {
				idReceiving: string
				idDissolving: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { idReceiving, idDissolving } = req.params
		const receiving = await RuleModel.findOne({
			id: idReceiving
		})
		if (!receiving)
			return res.status(400).send({
				errorCode: 400,
				error: "Bad Request",
				message: "idOne must be a valid rule ID",
			})
		const dissolving = await RuleModel.findOne({
			id: idDissolving
		})
		if (!dissolving)
			return res.status(400).send({
				errorCode: 400,
				error: "Bad Request",
				message: "idTwo must be a valid rule ID",
			})


		await RuleModel.findOneAndDelete({
			id: idDissolving
		})
		await ReportModel.updateMany({
			brokenRule: idDissolving
		}, {
			brokenRule: idReceiving
		})
		await RevocationModel.updateMany({
			brokenRule: idDissolving
		}, {
			brokenRule: idReceiving
		})
		
		await GuildConfigModel.updateMany({
			ruleFilters: idDissolving
		}, {
			$addToSet: { ruleFilters: idReceiving }
		})
		await GuildConfigModel.updateMany({
			ruleFilters: idDissolving,
		}, {
			$pull: { ruleFilters: idDissolving },
		})

		const affectedConfigs = await GuildConfigModel.find({
			ruleFilters: idReceiving
		})

		const sendGuildConfigInfo = async () => {
			const wait = (ms: number): Promise<void> => new Promise((resolve) => {
				setTimeout(() => {
					resolve()
				}, ms)
			})
			for (const config of affectedConfigs) {
				guildConfigChanged(config)
				// 1000 * 100 / 1000 = amount of seconds it will take for 100 communities
				// staggered so not everyone at once tries to fetch their new banlists
				await wait(100)
			}
		}
		sendGuildConfigInfo() // this will make it execute whilst letting other code still run

		rulesMergedMessage(receiving, dissolving)

		return res.send(receiving)
	}
}
