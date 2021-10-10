import { FastifyReply, FastifyRequest } from "fastify"
import { Controller, DELETE, GET, POST } from "fastify-decorators"
import { Type } from "@sinclair/typebox"

import RuleModel from "../database/fagc/rule.js"
import { Authenticate, MasterAuthenticate } from "../utils/authentication.js"
import CommunityModel from "../database/fagc/community.js"
import GuildConfigModel from "../database/bot/community.js"
import {
	communityConfigChanged,
	communityCreatedMessage,
	communityRemovedMessage,
} from "../utils/info.js"
import {
	client,
	validateDiscordGuild,
	validateDiscordUser,
} from "../utils/discord.js"
import ReportModel from "../database/fagc/report.js"
import RevocationModel from "../database/fagc/revocation.js"
import WebhookModel from "../database/fagc/webhook.js"
import AuthModel from "../database/fagc/authentication.js"
import cryptoRandomString from "crypto-random-string"

@Controller({ route: "/communities" })
export default class CommunityController {
	@GET({ url: "/" })
	async getAllCommunities(
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
				params: Type.Required(
					Type.Object({
						id: Type.String(),
					})
				),
			},
		},
	})
	async getCommunity(
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

	@GET({ url: "/getown" })
	@Authenticate
	async getOwnCommunity(
		req: FastifyRequest,
		res: FastifyReply
	): Promise<FastifyReply> {
		const community = req.requestContext.get("community")
		return res.send(community)
	}

	@GET({
		url: "/guildconfig/:guildId",
		options: {
			schema: {
				params: Type.Required(
					Type.Object({
						guildId: Type.String(),
					})
				),
			},
		},
	})
	async getCommunityConfig(
		req: FastifyRequest<{
			Params: {
				guildId: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { guildId } = req.params
		const config = await GuildConfigModel.findOne({ guildId: guildId })
		return res.send(config)
	}

	@GET({ url: "/guildconfig" })
	@Authenticate
	async getOwnConfig(
		req: FastifyRequest,
		res: FastifyReply
	): Promise<FastifyReply> {
		const community = req.requestContext.get("community")
		if (!community) return res.send(null)
		const config = await GuildConfigModel.findOne({
			communityId: community._id,
		})
		return res.send(config)
	}

	@POST({
		url: "/guildconfig",
		options: {
			schema: {
				body: Type.Object({
					ruleFilters: Type.Optional(Type.Array(Type.String())),
					trustedCommunities: Type.Optional(
						Type.Array(Type.String())
					),
					roles: Type.Optional(
						Type.Object({
							reports: Type.Optional(Type.String()),
							webhooks: Type.Optional(Type.String()),
							setConfig: Type.Optional(Type.String()),
							setRules: Type.Optional(Type.String()),
							setCommunities: Type.Optional(Type.String()),
						})
					),
				}),
			},
		},
	})
	@Authenticate
	async setGuildConfig(
		req: FastifyRequest<{
			Body: {
				ruleFilters?: string[]
				trustedCommunities?: string[]
				roles: {
					reports?: string
					webhooks?: string
					setConfig?: string
					setRules?: string
					setCommunities?: string
				}
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { ruleFilters, trustedCommunities, roles } = req.body

		// query database if rules and communities actually exist
		if (ruleFilters) {
			const rulesExist = await RuleModel.find({
				id: { $in: ruleFilters },
			})
			if (rulesExist.length !== ruleFilters.length)
				return res.status(400).send({
					errorCode: 400,
					error: "Bad Request",
					message: `ruleFilters must be array of IDs of rules, got ${ruleFilters.toString()}, some of which are not real rule IDs`,
				})
		}
		if (trustedCommunities) {
			const communitiesExist = await CommunityModel.find({
				id: { $in: trustedCommunities },
			})
			if (communitiesExist.length !== trustedCommunities.length)
				return res.status(400).send({
					errorCode: 400,
					error: "Bad Request",
					message: `trustedCommunities must be array of IDs of communities, got ${trustedCommunities.toString()}, some of which are not real community IDs`,
				})
		}

		// check other stuff

		const community = req.requestContext.get("community")
		if (!community)
			return res.status(400).send({
				errorCode: 400,
				error: "Not Found",
				message: "Community config was not found",
			})

		const guildConfig = await GuildConfigModel.findOne({
			communityId: community.id,
		})
		if (!guildConfig)
			return res.status(400).send({
				errorCode: 400,
				error: "Not Found",
				message: "Community config was not found",
			})

		if (ruleFilters) guildConfig.ruleFilters = ruleFilters
		if (trustedCommunities)
			guildConfig.trustedCommunities = trustedCommunities

		const findRole = (id: string) => {
			const guildRoles = client.guilds.cache
				.map((guild) => guild.roles.resolve(id))
				.filter((r) => r && r.id)
			return guildRoles[0]
		}

		if (!guildConfig.roles)
			guildConfig.roles = {
				reports: "",
				webhooks: "",
				setConfig: "",
				setRules: "",
				setCommunities: "",
			}
		Object.keys(roles).map((roleType) => {
			const role = findRole(roles[roleType])
			if (role) guildConfig.roles[roleType] = role.id
		})

		await GuildConfigModel.findOneAndReplace(
			{
				guildId: guildConfig.guildId,
			},
			guildConfig.toObject()
		)

		guildConfig.set("apikey", null)
		communityConfigChanged(guildConfig)
		return res.status(200).send(guildConfig)
	}

	@POST({
		url: "/communityconfig",
		options: {
			schema: {
				body: Type.Optional(
					Type.Object({
						contact: Type.Optional(Type.String()),
						name: Type.Optional(Type.String()),
					})
				),
			},
		},
	})
	@Authenticate
	async setCommunityConfig(
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

		if (contact && !(await validateDiscordUser(contact)))
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

		return res.status(200).send(community)
	}

	@POST({
		url: "/notifyGuildConfigChanged/:guildId",
		options: {
			schema: {
				params: Type.Required(
					Type.Object({
						guildId: Type.String(),
					})
				),
			},
		},
	})
	@MasterAuthenticate
	async notifyGuildConfigChanged(
		req: FastifyRequest<{
			Params: {
				guildId: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { guildId } = req.params
		const guildConfig = await GuildConfigModel.findOne({
			guildId: guildId,
		})

		if (!guildConfig)
			return res.status(404).send({
				errorCode: 404,
				error: "Guild config not found",
				message: `Guild config for guild ${guildId} was not found`,
			})

		guildConfig.set("apikey", null)
		communityConfigChanged(guildConfig)

		return res.send({ status: "ok" })
	}

	@POST({
		url: "/",
		options: {
			schema: {
				body: Type.Required(
					Type.Object({
						name: Type.String(),
						contact: Type.String(),
						guildId: Type.String(),
					})
				),
			},
		},
	})
	@MasterAuthenticate
	async createCommunity(
		req: FastifyRequest<{
			Body: {
				name: string
				contact: string
				guildId: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { name, contact, guildId } = req.body

		const validDiscordUser = await validateDiscordUser(contact)
		if (!validDiscordUser)
			return res.status(400).send({
				errorCode: 400,
				error: "Invalid Discord User",
				message: `${contact} is not a valid Discord user`,
			})

		const validGuild = await validateDiscordGuild(guildId)
		if (!validGuild)
			return res.status(400).send({
				errorCode: 400,
				error: "Invalid Guild",
				message: `${guildId} is not a valid Discord guild`,
			})

		const community = await CommunityModel.create({
			name: name,
			contact: contact,
			guildIds: [guildId],
		})

		// update community config to have communityId
		await GuildConfigModel.updateMany(
			{ guildId: guildId },
			{
				$set: { communityId: community.id },
			}
		)

		const auth = await AuthModel.create({
			communityId: community.id,
			api_key: cryptoRandomString({ length: 64 }),
		})

		const contactUser = await client.users.fetch(contact)

		communityCreatedMessage(community, {
			contact: <any>contactUser,
		})

		return res.send({
			community: community,
			apiKey: auth.api_key,
		})
	}

	@DELETE({
		url: "/:communityId",
		options: {
			schema: {
				params: Type.Required(
					Type.Object({
						communityId: Type.String(),
					})
				),
			},
		},
	})
	@MasterAuthenticate
	async removeCommunity(
		req: FastifyRequest<{
			Params: {
				communityId: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { communityId } = req.params

		const community = await CommunityModel.findOneAndDelete({
			id: communityId,
		})
		if (!community)
			return res.status(404).send({
				errorCode: 404,
				error: "Not found",
				message: `Community with ID ${communityId} was not found`,
			})

		const communityConfig = await GuildConfigModel.findOneAndDelete({
			communityId: community.id,
		})

		await ReportModel.deleteMany({
			communityId: community.id,
		})
		await RevocationModel.deleteMany({
			communityId: community.id,
		})
		await AuthModel.findOneAndDelete({
			communityId: community.id,
		})
		if (communityConfig) {
			await WebhookModel.deleteMany({
				guildId: communityConfig.guildId,
			})
		}

		const contactUser = await client.users.fetch(community.contact)
		communityRemovedMessage(community, {
			contact: <any>contactUser,
		})

		return res.send(true)
	}

	@POST({
		url: "/guildLeave/:guildId",
		options: {
			schema: {
				params: Type.Required(
					Type.Object({
						guildId: Type.String(),
					})
				),
			},
		},
	})
	@MasterAuthenticate
	async guildLeave(
		req: FastifyRequest<{
			Params: {
				guildId: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { guildId } = req.params

		await WebhookModel.deleteMany({
			guildId: guildId,
		})
		await GuildConfigModel.deleteMany({
			guildId: guildId,
		})
		const communityConfig = await CommunityModel.findOne({
			guildIDs: [guildId],
		})
		if (communityConfig) {
			communityConfig.guildIds = communityConfig.guildIds.filter(
				(id) => id !== guildId
			)
			await communityConfig.save()
		}

		return res.status(200).send({ status: "ok" })
	}
}
