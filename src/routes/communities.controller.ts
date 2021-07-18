import { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, GET, POST } from 'fastify-decorators';
import { Type } from "@sinclair/typebox"

import RuleModel from "../database/fagc/rule"
import Authenticate from '../utils/authentication';
import CommunityModel from '../database/fagc/community';
import CommunityConfigModel from '../database/bot/community';
import { checkUser } from '../utils/functions';
import { communityConfigChanged } from '../utils/info';

@Controller({ route: "/communities" })
export default class CommunityControler {
	@GET({ url: "/" })
	async getAllCommunities(req: FastifyRequest, res: FastifyReply) {
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
	async getCommunity(req: FastifyRequest, res: FastifyReply) {
		const { id }: { id: string } = <any>req.params
		const community = await CommunityModel.findOne({ id: id })
		return res.send(community)
	}

	@GET({ url: "/getown" })
	@Authenticate
	async getOwnCommunity(req: FastifyRequest, res: FastifyReply) {
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
	async getCommunityConfig(req: FastifyRequest, res: FastifyReply) {
		const { guildId }: { guildId: string } = <any>req.params
		const config = await CommunityConfigModel.findOne({ guildId: guildId })
		return res.send(config)
	}

	@GET({ url: "/config" })
	@Authenticate
	async getOwnConfig(req: FastifyRequest, res: FastifyReply) {
		const community = req.requestContext.get("community")!
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
	async setConfig(req: FastifyRequest, res: FastifyReply) {
		const { ruleFilters, trustedCommunities, contact, moderatorRoleId, communityname }: {
			ruleFilters?: string[],
			trustedCommunities?: string[],
			contact?: string,
			moderatorRoleId?: string,
			communityname?: string,
		} = <any>req.body

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
		if (contact && !(await checkUser(contact))) return res.status(400).send({ errorCode: 400, error: "Bad Request", message: `contact must be Discord User snowflake, got value ${contact}, which isn't a Discord user` })

		const community = req.requestContext.get("community")!
		let OldConfig = await CommunityConfigModel.findOne({communityId: community.id})
		if (!OldConfig) return res.status(400).send({ errorCode: 404, error: "Not Found", message: "Community config was not found" })

		let toReplace = {
			...OldConfig.toObject(),
			guildId: OldConfig.guildId,
		}
		if (ruleFilters) toReplace = Object.assign(toReplace, { ruleFilters })
		if (trustedCommunities) toReplace = Object.assign(toReplace, { trustedCommunities })
		if (contact) toReplace = Object.assign(toReplace, { contact })
		if (moderatorRoleId) toReplace = Object.assign(toReplace, { moderatorRoleId })
		if (communityname) toReplace = Object.assign(toReplace, { communityname })
		let CommunityConfig = await CommunityConfigModel.findOneAndReplace({ guildId: OldConfig.guildId }, toReplace, { new: true })
		if (!CommunityConfig) return res.status(400).send({ errorCode: 404, error: "Not Found", message: "Community config with your API key was not found" })
		await CommunityModel.findOneAndUpdate({ guildId: OldConfig.guildId }, {
			guildId: OldConfig.guildId,
			name: CommunityConfig.communityname,
			contact: CommunityConfig.contact,
		})
		CommunityConfig.set("apikey", null)
		communityConfigChanged(CommunityConfig)
		res.status(200).send(CommunityConfig)
	}
}