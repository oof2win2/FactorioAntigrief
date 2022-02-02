import { FastifyReply, FastifyRequest } from "fastify"
import { Controller, DELETE, GET, PATCH, POST } from "fastify-decorators"
import { Authenticate, createApikey, MasterAuthenticate } from "../utils/authentication"
import CommunityModel from "../database/community"
import GuildConfigModel from "../database/guildconfig"
import {
	guildConfigChanged,
	communityCreatedMessage,
	communityRemovedMessage,
	communityUpdatedMessage,
	communitiesMergedMessage,
} from "../utils/info"
import {
	client,
	validateDiscordUser,
} from "../utils/discord"
import ReportInfoModel from "../database/reportinfo"
import WebhookModel from "../database/webhook"
import { CommunityCreatedMessageExtraOpts } from "fagc-api-types"
import { z } from "zod"

@Controller({ route: "/communities" })
export default class CommunityController {
	@GET({
		url: "/",
		options: {
			schema: {
				description: "Fetch all communities",
				tags: [ "community" ],
				response: {
					"200": {
						type: "array",
						items: {
							$ref: "CommunityClass#",
						},
					},
				},
			},
		},
	})
	async fetchAll(
		req: FastifyRequest,
		res: FastifyReply
	): Promise<FastifyReply> {
		const communities = await CommunityModel.find({})
		return res.send(communities)
	}

	@GET({
		url: "/:id",
		options: {
			schema: {
				params: z.object({
					id: z.string(),
				}),

				description: "Fetch community",
				tags: [ "community" ],
				response: {
					"200": {
						allOf: [
							{ nullable: true },
							{ $ref: "CommunityClass#" },
						],
					},
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
		const community = await CommunityModel.findOne({ id: id })
		return res.send(community)
	}

	@GET({
		url: "/own",
		options: {
			schema: {
				description: "Fetch your community",
				tags: [ "community" ],
				security: [
					{
						authorization: [],
					},
				],
				response: {
					"200": {
						allOf: [
							{ nullable: true },
							{ $ref: "CommunityClass#" },
						],
					},
				},
			},
		},
	})
	@Authenticate
	async fetchOwn(
		req: FastifyRequest,
		res: FastifyReply
	): Promise<FastifyReply> {
		const community = req.requestContext.get("community")
		return res.send(community)
	}

	@PATCH({
		url: "/own",
		options: {
			schema: {
				body: z.object({
					contact: z.string().optional(),
					name: z.string().optional()
				}),

				description: "Update your community",
				tags: [ "community" ],
				security: [
					{
						authorization: [],
					},
				],
				response: {
					"200": {
						allOf: [
							{ nullable: true },
							{ $ref: "CommunityClass#" },
						],
					},
				},
			},
		},
	})
	@Authenticate
	async updateOwn(
		req: FastifyRequest<{
			Body: {
				contact?: string
				name?: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { contact, name } = req.body

		const community = req.requestContext.get("community")
		if (!community)
			return res.status(400).send({
				errorCode: 400,
				error: "Not Found",
				message: "Community config was not found",
			})

		const contactUser = await validateDiscordUser(contact || "")
		if (contact && !contactUser)
			return res.status(400).send({
				errorCode: 400,
				error: "Bad Request",
				message: `contact must be Discord User snowflake, got value ${contact}, which isn't a known Discord user`,
			})

		community.name = name || community.name
		community.contact = contact || community.contact

		await CommunityModel.findOneAndReplace(
			{
				id: community.id,
			},
			community.toObject()
		)

		communityUpdatedMessage(community, {
			createdBy: <CommunityCreatedMessageExtraOpts["createdBy"]>(
				(<unknown>contactUser)
			)
		})

		return res.status(200).send(community)
	}

	@POST({
		url: "/own/apikey",
		options: {
			schema: {
				body: z.object({
					create: z.boolean().optional(),
					invalidate: z.boolean().optional(),
				}),
				description: "Manage apikey for your community",
				tags: [ "community" ],
				security: [
					{
						authorization: [],
					},
				],
				response: {
					"200": {
						properties: {
							apiKey: {
								type: "string",
							}
						}
					},
				},
			}
		}
	})
	@Authenticate
	async createApiKey(
		req: FastifyRequest<{
			Body: {
				create?: boolean,
				invalidate: boolean,
			},
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const community = req.requestContext.get("community")
		if (!community)
			return res.status(404).send({
				errorCode: 404,
				error: "Not found",
				message: "Your community was not found",
			})


		if (req.body.invalidate) {
			// invalidate all existing tokens
			await CommunityModel.findOneAndUpdate({ id: community.id }, {
				tokenInvalidBefore: Date.now(),
			}).exec()
		}

		const auth = req.body.create ? await createApikey(community, "private") : undefined
		return res.send({
			apiKey: auth
		})
	}

	@POST({
		url: "/:id/apikey",
		options: {
			schema: {
				params: z.object({
					id: z.string()
				}),
				body: z.object({
					create: z.boolean().optional(),
					type: z.enum([ "private", "master" ]).default("private"),
					invalidate: z.boolean().optional(),
				}),
				description: "Manage apikey for community",
				tags: [ "master" ],
				security: [
					{
						masterAuthorization: [],
					},
				],
				response: {
					"200": {
						properties: {
							apiKey: {
								type: "string",
							}
						}
					},
				},
			}
		}
	})
	@MasterAuthenticate
	async masterCreateApikey(
		req: FastifyRequest<{
			Params: {
				id: string
			}
			Body: {
				create?: boolean,
				type?: "private" | "master"
				invalidate: boolean,
			},
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { id } = req.params

		const community = await CommunityModel.findOne({ id: id }).exec()
		if (!community)
			return res.status(404).send({
				errorCode: 404,
				error: "Not found",
				message: `Community with the ID ${id} was not found`,
			})

		if (req.body.invalidate) {
			// invalidate all existing tokens
			await CommunityModel.findOneAndUpdate({ id: community.id }, {
				tokenInvalidBefore: Date.now(),
			}).exec()
		}

		const auth = req.body.create ? await createApikey(community, req.body.type) : undefined
		return res.send({
			apiKey: auth
		})
	}

	@POST({
		url: "/",
		options: {
			schema: {
				body: z.object({
					name: z.string(),
					contact: z.string(),
				}),

				description: "Create community",
				tags: [ "master" ],
				security: [
					{
						masterAuthorization: [],
					},
				],
				response: {
					"200": {
						type: "object",
						properties: {
							apiKey: { type: "string" },
							community: {
								$ref: "CommunityClass#",
							},
						},
					},
				},
			},
		},
	})
	@MasterAuthenticate
	async create(
		req: FastifyRequest<{
			Body: {
				name: string
				contact: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { name, contact } = req.body

		const validDiscordUser = await validateDiscordUser(contact)
		if (!validDiscordUser)
			return res.status(400).send({
				errorCode: 400,
				error: "Invalid Discord User",
				message: `${contact} is not a valid Discord user`,
			})
		if (validDiscordUser.bot) {
			return res.status(400).send({
				errorCode: 400,
				error: "Invalid Discord User",
				message: `${contact} is a bot`,
			})
		}

		const community = await CommunityModel.create({
			name: name,
			contact: contact,
			guildIds: []
		})

		const auth = await createApikey(community, "private")

		const contactUser = await client.users.fetch(contact)
		communityCreatedMessage(community, {
			createdBy: <CommunityCreatedMessageExtraOpts["createdBy"]>(
				(<unknown>contactUser)
			),
		})

		return res.send({
			community: community,
			apiKey: auth,
		})
	}

	@DELETE({
		url: "/:id",
		options: {
			schema: {
				params: z.object({
					id: z.string(),
				}),

				description: "Delete community",
				tags: [ "master" ],
				security: [
					{
						masterAuthorization: [],
					},
				],
				response: {
					"200": {
						type: "boolean",
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

		const community = await CommunityModel.findOneAndDelete({
			id: id,
		})
		if (!community)
			return res.status(404).send({
				errorCode: 404,
				error: "Not found",
				message: `Community with ID ${id} was not found`,
			})

		const guildConfigs = await GuildConfigModel.find({
			id: community.id,
		})
		await GuildConfigModel.deleteMany({
			id: community.id,
		})

		await ReportInfoModel.deleteMany({
			id: community.id,
		})

		if (guildConfigs) {
			await WebhookModel.deleteMany({
				guildId: { $in: guildConfigs.map(config => config.guildId) },
			})
		}

		// remove the community ID from any guild configs which may have it
		const affectedGuildConfigs = await GuildConfigModel.find({
			trustedCommunities: [ community.id ]
		})
		await GuildConfigModel.updateMany({
			_id: { $in: affectedGuildConfigs.map(config => config._id) }
		}, {
			$pull: { trustedCommunities: community.id }
		})
		const newGuildConfigs = await GuildConfigModel.find({
			_id: { $in: affectedGuildConfigs.map(config => config._id) }
		})

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

		const contactUser = await client.users.fetch(community.contact)
		communityRemovedMessage(community, {
			createdBy: <CommunityCreatedMessageExtraOpts["createdBy"]>(
				(<unknown>contactUser)
			),
		})

		return res.send(true)
	}

	@PATCH({
		url: "/:idReceiving/merge/:idDissolving",
		options: {
			schema: {
				params: z.object({
					idReceiving: z.string(),
					idDissolving: z.string(),
				}),

				description: "Merge community idDissolving into community idReceiving",
				tags: [ "master" ],
				security: [
					{
						masterAuthorization: [],
					},
				],
				response: {
					"200": {
						$ref: "CommunityClass#",
					},
				},
			},
		},
	})
	@MasterAuthenticate
	async mergeCommunities(
		req: FastifyRequest<{
			Params: {
				idReceiving: string
				idDissolving: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { idReceiving, idDissolving } = req.params
		const receiving = await CommunityModel.findOne({
			id: idReceiving
		})
		if (!receiving)
			return res.status(400).send({
				errorCode: 400,
				error: "Bad Request",
				message: "idOne must be a valid community ID",
			})
		const dissolving = await CommunityModel.findOne({
			id: idDissolving
		})
		if (!dissolving)
			return res.status(400).send({
				errorCode: 400,
				error: "Bad Request",
				message: "idTwo must be a valid community ID",
			})


		await CommunityModel.findOneAndDelete({
			id: idDissolving
		})
		await ReportInfoModel.updateMany({
			communityId: idDissolving
		}, {
			communityId: idReceiving
		})
		
		// remove old stuff from the config and replace with new
		await GuildConfigModel.updateMany({
			trustedCommunities: idDissolving
		}, {
			$addToSet: { trustedCommunities: idReceiving }
		})
		await GuildConfigModel.updateMany({
			trustedCommunities: idDissolving,
		}, {
			$pull: { trustedCommunities: idDissolving },
		})

		const guildConfigs = await GuildConfigModel.find({
			communityId: { $in: [ idReceiving, idDissolving ] }
		})

		// change configs + remove old auth
		await CommunityModel.updateOne({
			id: idReceiving
		}, {
			$addToSet: { guildIds:  guildConfigs.map(config => config.guildId) }
		})
		await GuildConfigModel.updateMany({
			communityId: idDissolving
		}, {
			communityId: idReceiving,
			apikey: guildConfigs.find(c => c.communityId === idReceiving)?.apikey || undefined,
		})

		const affectedConfigs = await GuildConfigModel.find({
			trustedCommunities: idReceiving
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

		const contactUser = await validateDiscordUser(receiving.contact)

		communitiesMergedMessage(receiving, dissolving, {
			createdBy: <CommunityCreatedMessageExtraOpts["createdBy"]>(
				(<unknown>contactUser)
			)
		})

		return res.send(receiving)
	}
}
