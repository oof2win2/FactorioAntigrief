import { FastifyReply, FastifyRequest } from "fastify"
import { Controller, DELETE, GET, POST } from "fastify-decorators"

import UserModel, {
	ApiAccessModel,
	UserAuthModel,
} from "../database/fagc/user"
import { OAUTHSCOPES } from "../consts"
import { Authenticate } from "../utils/authentication"
import GuildConfigModel from "../database/fagc/guildconfig"

// currently disabled.
@Controller({ route: "/users" })
export default class ProfileController {
	// @GET({
	// 	url: "/:discordUserId",
	// 	options: {
	// 		schema: {
	// 			params: Type.Required(
	// 				Type.Object({
	// 					discordUserId: Type.String(),
	// 				})
	// 			),
	// 		},
	// 	},
	// })
	// async fetchUser(
	// 	req: FastifyRequest<{
	// 		Params: { discordUserId: string }
	// 	}>,
	// 	res: FastifyReply
	// ): Promise<FastifyReply> {
	// 	const { discordUserId } = req.params
	// 	const user = await UserModel.findOne({
	// 		discordUserId: discordUserId,
	// 	}).populate("apiAccess")
	// 	return res.send(user ?? null)
	// }

	// @POST({
	// 	url: "/addUserToCommunity/:discordUserId",
	// 	options: {
	// 		schema: {
	// 			params: Type.Required(
	// 				Type.Object({
	// 					discordUserId: Type.String(),
	// 				})
	// 			),
	// 			body: Type.Object({
	// 				reports: Type.Optional(Type.Boolean()),
	// 				config: Type.Optional(Type.Boolean()),
	// 				notifications: Type.Optional(Type.Boolean()),
	// 			}),
	// 		},
	// 	},
	// })
	// @Authenticate
	// async addUserToCommunity(
	// 	req: FastifyRequest<{
	// 		Params: {
	// 			discordUserId: string
	// 		}
	// 		Body: {
	// 			reports?: boolean
	// 			config?: boolean
	// 			notifications?: boolean
	// 		}
	// 	}>,
	// 	res: FastifyReply
	// ): Promise<FastifyReply> {
	// 	const { discordUserId } = req.params

	// 	const community = req.requestContext.get("community")
	// 	if (!community)
	// 		return res.status(404).send({
	// 			errorCode: 404,
	// 			error: "Not Found",
	// 			message: "Community not found",
	// 		})
	// 	const communityConfig = await GuildConfigModel.findOne({
	// 		communityId: community.id,
	// 	})
	// 	if (!communityConfig)
	// 		return res.status(404).send({
	// 			errorCode: 404,
	// 			error: "Not Found",
	// 			message: "Community config was not found in the database",
	// 		})
	// 	const user = await UserModel.findOne({ discordUserId: discordUserId })
	// 	if (!user)
	// 		return res.status(404).send({
	// 			errorCode: 404,
	// 			error: "Not Found",
	// 			message: "Discord user was not found in the database",
	// 		})
	// 	if (user.discordGuildIds.includes(communityConfig.guildId))
	// 		return res.status(400).send({
	// 			errorCode: 400,
	// 			error: "Bad Request",
	// 			message: "User is already in the community",
	// 		})

	// 	user.discordGuildIds.push(communityConfig.guildId)
	// 	const { reports, config, notifications } = req.body
	// 	const apiAccess = await ApiAccessModel.create({
	// 		communityId: community.id,
	// 		discordUserId: discordUserId,
	// 		discordGuildId: communityConfig.guildId,
	// 		reports: reports || false,
	// 		config: config || false,
	// 		notifications: notifications || false,
	// 	})
	// 	user.apiAccess.push(apiAccess._id)
	// 	await user.save()
	// 	return res.status(200).send(await user.populate("apiAccess"))
	// }
	// @DELETE({
	// 	url: "/removeUserFromCommunity/:discordUserId",
	// 	options: {
	// 		schema: {
	// 			params: Type.Required(
	// 				Type.Object({
	// 					discordUserId: Type.String(),
	// 				})
	// 			),
	// 		},
	// 	},
	// })
	// @Authenticate
	// async removeUserFromCommunity(
	// 	req: FastifyRequest<{ Params: { discordUserId: string } }>,
	// 	res: FastifyReply
	// ): Promise<FastifyReply> {
	// 	const { discordUserId } = req.params

	// 	const community = req.requestContext.get("community")
	// 	if (!community)
	// 		return res.status(404).send({
	// 			errorCode: 404,
	// 			error: "Not Found",
	// 			message: "Community not found",
	// 		})
	// 	const communityConfig = await GuildConfigModel.findOne({
	// 		communityId: community.id,
	// 	})
	// 	if (!communityConfig)
	// 		return res.status(404).send({
	// 			errorCode: 404,
	// 			error: "Not Found",
	// 			message: "Community config was not found in the database",
	// 		})
	// 	const user = await UserModel.findOne({ discordUserId: discordUserId })
	// 	if (!user)
	// 		return res.status(404).send({
	// 			errorCode: 404,
	// 			error: "Not Found",
	// 			message: "Discord user was not found in the database",
	// 		})
	// 	if (!user.discordGuildIds.includes(communityConfig.guildId))
	// 		return res.status(400).send({
	// 			errorCode: 400,
	// 			error: "Bad Request",
	// 			message: "User is not in the community",
	// 		})

	// 	const apiAccess = await ApiAccessModel.findOneAndDelete({
	// 		communityId: community.id,
	// 		discordUserId: discordUserId,
	// 	})

	// 	if (!apiAccess)
	// 		return res.status(400).send({
	// 			errorCode: 400,
	// 			error: "Bad Request",
	// 			message: "User does not have API access",
	// 		})

	// 	user.discordGuildIds = user.discordGuildIds.filter(
	// 		(guildid) => guildid != communityConfig.guildId
	// 	)
	// 	user.apiAccess = user.apiAccess.filter(
	// 		(access) => access !== apiAccess._id
	// 	)
	// 	await user.save()
	// 	return res.status(200).send(await user.populate("apiAccess"))
	// }

	// // this is a GET because it doesnt need to be a POST
	// @GET({ url: "/login" })
	// async loginUser(
	// 	req: FastifyRequest,
	// 	res: FastifyReply
	// ): Promise<FastifyReply> {
	// 	const userId = req.session.get("userId")
	// 	if (userId) {
	// 		const user = await UserModel.findOne({ _id: userId })
	// 		return res.send(user)
	// 	}
	// 	return res.send(null)
	// }

	// @GET({ url: "/signupurl" })
	// async Oauth2URL(
	// 	req: FastifyRequest,
	// 	res: FastifyReply
	// ): Promise<FastifyReply> {
	// 	// const state = cryptoRandomString({ length: 8 })
	// 	// req.session.set("state", state)
	// 	return res.send({
	// 		url: req.requestContext.get("oauthclient")?.generateAuthUrl({
	// 			scope: OAUTHSCOPES.join(" "),
	// 			// state: state,
	// 			state: "1234",
	// 		}),
	// 	})
	// }

	// // this is a GET because it doesnt need to be a POST
	// @GET({
	// 	url: "/signup",
	// 	options: {
	// 		schema: {
	// 			querystring: Type.Required(
	// 				Type.Object({
	// 					code: Type.String(),
	// 					state: Type.String(),
	// 				})
	// 			),
	// 		},
	// 	},
	// })
	// async signupUser(
	// 	req: FastifyRequest<{
	// 		Querystring: {
	// 			code: string
	// 			state: string
	// 		}
	// 	}>,
	// 	res: FastifyReply
	// ): Promise<FastifyReply> {
	// 	if (req.session.get("userId")) {
	// 		const user = await UserModel.findOne({
	// 			_id: req.session.get("userId"),
	// 		})
	// 		return res.send(user)
	// 	}

	// 	const { code } = req.query
	// 	// if (state !== req.session.get("state"))
	// 	// 	return res.status(400).send({
	// 	// 		errorCode: 400,
	// 	// 		error: "Invalid Request",
	// 	// 		message: "State does not match set state",
	// 	// 	})

	// 	const oauth = req.requestContext.get("oauthclient")
	// 	if (!oauth) throw "oauthclient did not exist on ctx"

	// 	const access = await oauth.tokenRequest({
	// 		code: code,
	// 		scope: OAUTHSCOPES,
	// 		grantType: "authorization_code",
	// 	})

	// 	const discordUser = await oauth.getUser(access.access_token)

	// 	const existingUser = await UserModel.findOne({
	// 		discordUserId: discordUser.id,
	// 	})
	// 	if (existingUser) {
	// 		req.session.set("userId", existingUser._id)
	// 		return res.send(existingUser)
	// 	}

	// 	const userAuth = await UserAuthModel.create({
	// 		discordUserId: discordUser.id,
	// 		access_token: access.access_token,
	// 		expires_at: new Date(Date.now() + access.expires_in * 1000), //expires_in is in seconds, not ms
	// 		refresh_token: access.refresh_token,
	// 	})

	// 	const user = await UserModel.create({
	// 		discordUserId: discordUser.id,
	// 		discordUserTag: `${discordUser.username}#${discordUser.discriminator}`,
	// 		userAuth: userAuth,
	// 	})

	// 	req.session.set("userId", user._id)
	// 	return res.send(user)
	// }
}
