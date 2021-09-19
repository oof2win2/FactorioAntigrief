import { FastifyReply, FastifyRequest } from "fastify"
import { Controller, GET, POST } from "fastify-decorators"
import { Type } from "@sinclair/typebox"

import ReportModel, { ReportClass } from "../database/fagc/report.js"
import { Profile } from "fagc-api-types"
import { DocumentType } from "@typegoose/typegoose"
import { BeAnObject } from "@typegoose/typegoose/lib/types"
import UserModel, { UserAuthModel } from "../database/fagc/user.js"
import { Authenticate } from "../utils/authentication.js"
import { validateDiscordUser, client, OAuth2Client } from "../utils/discord.js"
import CommunityModel from "../database/fagc/community.js"
import CommunityConfigModel from "../database/bot/community.js"
import { OAUTHSCOPES } from "../consts.js"

@Controller({ route: "/users" })
export default class ProfileController {
	@GET({
		url: "/:discordUserId",
		options: {
			schema: {
				params: Type.Required(
					Type.Object({
						discordUserId: Type.String(),
					})
				),
			},
		},
	})
	async fetchUser(
		req: FastifyRequest<{
			Params: { discordUserId: string }
		}>,
		res: FastifyReply
	) {
		const { discordUserId } = req.params
		const user = await UserModel.findOne({ discordUserId: discordUserId })
		return res.send(user ?? null)
	}

	@GET({
		url: "/oauth2",
		options: {
			schema: {
				querystring: Type.Required(
					Type.Object({
						code: Type.String(),
					})
				),
			},
		},
	})
	async handleOAuth2(
		req: FastifyRequest<{
			Querystring: {
				code: string
			}
		}>,
		res: FastifyReply
	) {
		const oauth = req.requestContext.get("oauthclient")
		if (!oauth) throw "oauthclient did not exist on ctx"
		try {
			const access = await oauth.tokenRequest({
				code: req.query.code,
				scope: OAUTHSCOPES,
				grantType: "authorization_code",
			})

			const discordUser = await oauth.getUser(access.access_token)

			const userAuth = await UserAuthModel.create({
				discordUserId: discordUser.id,
				access_token: access.access_token,
				expires_at: new Date(Date.now() + access.expires_in * 1000), //expires_in is in seconds, not ms
				refresh_token: access.refresh_token,
			})

			const user = await UserModel.create({
				discordUserId: discordUser.id,
				discordUserTag: `${discordUser.username}#${discordUser.discriminator}`,
				userAuth: userAuth,
			})

			return res.send(user)
		} catch (e) {
			return res.status(500).send({
				errorCode: 500,
				error: "A Server Error occured",
				message: e,
			})
		}
	}

	@GET({ url: "/oauth2/url" })
	async Oauth2URL(req: FastifyRequest, res: FastifyReply) {
		return res.send({
			link: req.requestContext.get("oauthclient")?.generateAuthUrl({
				scope: OAUTHSCOPES.join(" "),
			}),
		})
	}
}
