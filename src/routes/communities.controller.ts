import { FastifyReply, FastifyRequest } from "fastify"
import { Controller, DELETE, GET, POST } from "fastify-decorators"
import { Type } from "@sinclair/typebox"

import RuleModel from "../database/fagc/rule.js"
import { Authenticate, MasterAuthenticate } from "../utils/authentication.js"
import CommunityModel from "../database/fagc/community.js"
import CommunityConfigModel from "../database/bot/community.js"
import { communityConfigChanged, communityCreatedMessage, communityRemovedMessage } from "../utils/info.js"
import { validateDiscordGuild, validateDiscordUser } from "../utils/discord.js"
import ReportModel from "../database/fagc/report.js"
import RevocationModel from "../database/fagc/revocation.js"
import WebhookModel from "../database/fagc/webhook.js"
import AuthModel from "../database/fagc/authentication.js"
import cryptoRandomString from "crypto-random-string"

@Controller({ route: "/communities" })
export default class CommunityController {
	@GET({ url: "/" })
	async getAllCommunities(req: FastifyRequest, res: FastifyReply): Promise<FastifyReply> {
		const communities = await CommunityModel.find({})
		return res.send(communities)
	}

	@GET({
		url: "/:id", options: {
			schema: {
				params: Type.Required(Type.Object({
					id: Type.String()
				}))
			}
		}
	})
	async getCommunity(req: FastifyRequest<{
		Params: {
			id: string
		}
	}>, res: FastifyReply): Promise<FastifyReply> {
		const { id } = req.params
		const community = await CommunityModel.findOne({ id: id })
		return res.send(community)
	}

	@GET({ url: "/getown" })
	@Authenticate
	async getOwnCommunity(req: FastifyRequest, res: FastifyReply): Promise<FastifyReply> {
		const community = req.requestContext.get("community")
		return res.send(community)
	}

	@GET({
		url: "/config/:guildId", options: {
			schema: {
				params: Type.Required(Type.Object({
					guildId: Type.String()
				}))
			}
		}
	})
	async getCommunityConfig(req: FastifyRequest<{
		Params: {
			guildId: string
		}
	}>, res: FastifyReply): Promise<FastifyReply> {
		const { guildId } = req.params
		const config = await CommunityConfigModel.findOne({ guildId: guildId })
		return res.send(config)
	}

	@GET({ url: "/config" })
	@Authenticate
	async getOwnConfig(req: FastifyRequest, res: FastifyReply): Promise<FastifyReply> {
		const community = req.requestContext.get("community")
		if (!community) return res.send(null)
		const config = await CommunityConfigModel.findOne({ communityId: community._id })
		return res.send(config)
	}

	@POST({
		url: "/config", options: {
			schema: {
				body: Type.Object({
					ruleFilters: Type.Optional(Type.Array(Type.String())),
					trustedCommunities: Type.Optional(Type.Array(Type.String())),
					contact: Type.Optional(Type.String()),
					moderatorRoleId: Type.Optional(Type.String()),
					communityname: Type.Optional(Type.String()),

				})
			}
		}
	})
	@Authenticate
	async setConfig(req: FastifyRequest<{
		Body: {
			ruleFilters?: string[],
			trustedCommunities?: string[],
			contact?: string,
			moderatorRoleId?: string,
			communityname?: string,
		}
	}>, res: FastifyReply): Promise<FastifyReply> {
		const { ruleFilters, trustedCommunities, contact, moderatorRoleId, communityname } = req.body

		// query database if rules and communities actually exist
		if (ruleFilters) {
			const rulesExist = await RuleModel.find({ id: { $in: ruleFilters } })
			if (rulesExist.length !== ruleFilters.length)
				return res.status(400).send({ errorCode: 400, error: "Bad Request", message: `ruleFilters must be array of IDs of rules, got ${ruleFilters.toString()}, some of which are not real rule IDs` })
		}
		if (trustedCommunities) {
			const communitiesExist = await CommunityModel.find({ id: { $in: trustedCommunities } })
			if (communitiesExist.length !== trustedCommunities.length)
				return res.status(400).send({ errorCode: 400, error: "Bad Request", message: `trustedCommunities must be array of IDs of communities, got ${trustedCommunities.toString()}, some of which are not real community IDs` })
		}
		// check other stuff
		if (contact && !(await validateDiscordUser(contact))) return res.status(400).send({ errorCode: 400, error: "Bad Request", message: `contact must be Discord User snowflake, got value ${contact}, which isn't a Discord user` })

		const community = req.requestContext.get("community")
		if (!community) return res.status(400).send({ errorCode: 400, error: "Not Found", message: "Community config was not found" })
		
		const OldConfig = await CommunityConfigModel.findOne({ communityId: community.id })
		if (!OldConfig) return res.status(400).send({ errorCode: 400, error: "Not Found", message: "Community config was not found" })

		let toReplace = {
			...OldConfig.toObject(),
			guildId: OldConfig.guildId,
		}
		if (ruleFilters) toReplace = Object.assign(toReplace, { ruleFilters })
		if (trustedCommunities) toReplace = Object.assign(toReplace, { trustedCommunities })
		if (contact) toReplace = Object.assign(toReplace, { contact })
		if (moderatorRoleId) toReplace = Object.assign(toReplace, { moderatorRoleId })
		if (communityname) toReplace = Object.assign(toReplace, { communityname })
		const CommunityConfig = await CommunityConfigModel.findOneAndReplace({ guildId: OldConfig.guildId }, toReplace, { new: true })
		if (!CommunityConfig) return res.status(400).send({ errorCode: 404, error: "Not Found", message: "Community config with your API key was not found" })
		await CommunityModel.findOneAndUpdate({ guildId: OldConfig.guildId }, {
			guildId: OldConfig.guildId,
			name: CommunityConfig.communityname,
			contact: CommunityConfig.contact,
		})
		CommunityConfig.set("apikey", null)
		communityConfigChanged(CommunityConfig)
		return res.status(200).send(CommunityConfig)
	}

	@POST({
		url: "/", options: {
			schema: {
				body: Type.Required(Type.Object({
					name: Type.String(),
					contact: Type.String(),
					guildId: Type.String()
				}))
			}
		}
	})
	@MasterAuthenticate
	async createCommunity(req: FastifyRequest<{
		Body: {
			name: string
			contact: string
			guildId: string
		}
	}>, res: FastifyReply): Promise<FastifyReply> {
		const {name, contact, guildId} = req.body

		const validDiscordUser = await validateDiscordUser(contact)
		if (!validDiscordUser) return res.status(400).send({errorCode: 400, error: "Invalid Discord User", message: `${contact} is not a valid Discord user`})

		const validGuild = await validateDiscordGuild(guildId)
		if (!validGuild) return res.status(400).send({errorCode: 400, error: "Invalid Guild", message: `${guildId} is not a valid Discord guild`})

		const community = await CommunityModel.create({
			name: name,
			contact: contact,
			guildId: guildId
		})
		
		// update community config to have communityId
		await CommunityConfigModel.updateOne({guildId: guildId}, {
			$set: {communityId: community.id}
		})

		// TODO: fix this cryptoRandomString issue
		const auth = await AuthModel.create({
			communityId: community._id,
			api_key: cryptoRandomString({length: 64}),
		})

		communityCreatedMessage(community)

		return res.send({
			community: community,
			apiKey: auth.api_key
		})
	}

	@DELETE({
		url: "/:communityId", options: {
			schema: {
				params: Type.Required(Type.Object({
					communityId: Type.String()
				}))
			}
		}
	})
	@MasterAuthenticate
	async removeCommunity(req: FastifyRequest<{
		Params: {
			communityId: string
		}
	}>, res: FastifyReply): Promise<FastifyReply> {
		const {communityId} = req.params

		const community = await CommunityModel.findOneAndDelete({
			id: communityId
		})
		if (!community) return res.status(404).send({errorCode:404, error: "Not found", message: `Community with ID ${communityId} was not found`})

		const communityConfig = await CommunityConfigModel.findOneAndDelete({
			communityId: community.id
		})

		await ReportModel.deleteMany({
			communityId: community.id
		})
		await RevocationModel.deleteMany({
			communityId: community.id
		})
		if (communityConfig) {
			await WebhookModel.deleteMany({
				guildId: communityConfig.guildId
			})
		}
		communityRemovedMessage(community)

		return res.send(true)
	}
}