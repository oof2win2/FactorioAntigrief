import { FastifyReply, FastifyRequest } from "fastify"
import { Controller, DELETE, GET, PATCH, POST, PUT } from "fastify-decorators"
import { Webhook as DiscordWebhook, WebhookClient } from "discord.js"
import {
	Authenticate,
	MasterAuthenticate,
	OptionalAuthenticate,
	forbidden,
	parseJWT,
	createApikey,
} from "../utils/authentication"
import CategoryModel from "../database/category"
import FilterModel from "../database/filterobject"
import CommunityModel from "../database/community"
import GuildConfigModel from "../database/guildconfig"
import WebhookModel from "../database/webhook"
import { guildConfigChanged } from "../utils/info"
import { client, rest } from "../utils/discord"
import { GuildConfig, Webhook } from "fagc-api-types"
import { z } from "zod"
import UserModel from "../database/user"
import ENV from "../utils/env"
import {
	Routes,
	RESTPostOAuth2AccessTokenResult,
	RESTGetAPIOAuth2CurrentAuthorizationResult,
} from "discord-api-types/v10"
import { REST } from "@discordjs/rest"

const BOT_SCOPES = [
	"bot",
	"identify",
	"applications.commands",
	"applications.commands.permissions.update",
]
const BOT_PERMS = 156766628928

@Controller({ route: "/discord" })
export default class DiscordController {
	@POST({
		url: "/guilds",
		options: {
			schema: {
				body: z.object({
					guildId: z.string(),
				}),

				description: "Create guild config",
				tags: ["master"],
				security: [
					{
						masterAuthorization: [],
					},
				],
				response: {
					"200": GuildConfig,
				},
			},
		},
	})
	@MasterAuthenticate
	async createGuildConfig(
		req: FastifyRequest<{
			Body: {
				guildId: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { guildId } = req.body

		const existing = await GuildConfigModel.findOne({ guildId: guildId })

		if (existing)
			// return an error that the guild already has a config
			return res.status(400).send({
				errorCode: 400,
				error: "Bad Request",
				message: `Guild ${guildId} already has a config`,
			})

		const filter = await FilterModel.create({})

		const guildConfig = await GuildConfigModel.create({
			guildId: guildId,
			filterObjectId: filter.id,
		})

		return res.status(200).send(guildConfig)
	}

	@PATCH({
		url: "/guilds/:guildId",
		options: {
			schema: {
				params: z.object({
					guildId: z.string(),
				}),
				body: z.object({
					roles: z
						.object({
							reports: z.string().optional(),
							webhooks: z.string().optional(),
							setConfig: z.string().optional(),
							setCategories: z.string().optional(),
							setCommunities: z.string().optional(),
						})
						.optional(),
					apikey: z.string().optional(),
				}),

				description: "Update guild config",
				tags: ["discord"],
				security: [
					{
						authorization: [],
					},
				],
				response: {
					"200": GuildConfig.nullable(),
				},
			},
		},
	})
	@Authenticate
	async updateGuildConfig(
		req: FastifyRequest<{
			Params: {
				guildId: string
			}
			Body: {
				roles?: {
					reports?: string
					webhooks?: string
					setConfig?: string
					setCategories?: string
					setCommunities?: string
				}
				apikey?: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { roles, apikey } = req.body
		const { guildId } = req.params

		// check if the community exists
		const { community, authType } = req.requestContext.get("auth")
		if (!community)
			return res.status(400).send({
				errorCode: 400,
				error: "Not Found",
				message: "Community config was not found",
			})
		// check if guild exists
		if (!client.guilds.resolve(guildId)) {
			return res.status(400).send({
				errorCode: 400,
				error: "Not Found",
				message: "Guild was not found",
			})
		}

		// check if the api key is accessing a community it doesn't have access to
		const guildConfig = await GuildConfigModel.findOne({
			guildId: guildId,
		})
		if (!guildConfig)
			return res.status(400).send({
				errorCode: 400,
				error: "Not Found",
				message: "Community config was not found",
			})
		// if it's not the master api key and the community IDs are not the same, then return an error
		if (authType !== "master" && guildConfig.communityId !== community.id)
			return forbidden(
				res,
				"master",
				"Agent is not authorized to edit this guild's config"
			)

		// query database if categories and communities actually exist

		// check other stuff
		if (apikey) {
			const parsed = await parseJWT(apikey, ["reports", "master"])
			if (parsed) {
				const community = await CommunityModel.findOne({
					id: parsed.sub,
				})
				if (community) {
					guildConfig.apikey = apikey
					guildConfig.communityId = community.id
				}
			}
		}

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
				setCategories: "",
				setCommunities: "",
			}
		if (roles) {
			for (const [roleType, roleId] of Object.entries(roles)) {
				const role = findRole(roleId)
				if (role) (guildConfig.roles as any)[roleType] = role.id
			}
		}

		await guildConfig.save()
		guildConfigChanged(guildConfig)
		const includeApikey = authType === "master"
		return res
			.status(200)
			.send(guildConfig.toObject({ includeApikey } as any))
	}

	@GET({
		url: "/guilds/:guildId",
		options: {
			schema: {
				params: z.object({
					guildId: z.string(),
				}),

				description: "Fetch guild config",
				tags: ["discord"],
				response: {
					"200": GuildConfig.nullable(),
				},
			},
		},
	})
	@OptionalAuthenticate
	async fetchGuildConfig(
		req: FastifyRequest<{
			Params: {
				guildId: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { guildId } = req.params
		const config = await GuildConfigModel.findOne({ guildId: guildId })
		if (!config) return res.send(null)

		const { authType } = req.requestContext.get("auth")
		const includeApikey = authType === "master"
		return res.send(config.toObject({ includeApikey } as any))
	}

	@DELETE({
		url: "/guilds/:guildId",
		options: {
			schema: {
				params: z.object({
					guildId: z.string(),
				}),

				description: "Delete guild config",
				tags: ["master"],
				security: [
					{
						masterAuthorization: [],
					},
				],
			},
		},
	})
	@MasterAuthenticate
	async deleteGuild(
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
			guildIds: [guildId],
		})
		if (communityConfig) {
			communityConfig.guildIds = communityConfig.guildIds.filter(
				(id) => id !== guildId
			)
			await communityConfig.save()
		}

		return res.status(200).send({ status: "ok" })
	}

	@POST({
		url: "/guilds/:guildId/notifyChanged",
		options: {
			schema: {
				params: z.object({
					guildId: z.string(),
				}),

				description: "Notify guild config changed",
				tags: ["master"],
				security: [
					{
						masterAuthorization: [],
					},
				],
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
		guildConfigChanged(guildConfig)

		return res.send({ status: "ok" })
	}

	@POST({
		url: "/guilds/:guildId/message",
		options: {
			schema: {
				params: z.object({
					guildId: z.string(),
				}),
				body: z.object({
					content: z.string().optional(),
					embeds: z.array(z.object({}).passthrough()).optional(),
				}),

				description:
					"Notify a guild with a message, see [Embed Object]" +
					"(https://discord.com/developers/docs/resources/channel#embed-object) for the format of embeds.",
				tags: ["master"],
				security: [
					{
						masterAuthorization: [],
					},
				],
			},
		},
	})
	@MasterAuthenticate
	async notifyGuildText(
		req: FastifyRequest<{
			Params: {
				guildId: string
			}
			Body: {
				content?: string
				embeds?: object[]
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const savedWebhook = await WebhookModel.findOne({
			guildId: req.params.guildId,
		})
		if (savedWebhook) {
			const webhook = await client
				.fetchWebhook(savedWebhook.id, savedWebhook.token)
				.catch()
			if (webhook) {
				webhook.send({
					content: req.body.content,
					embeds: req.body.embeds,
				})
			}
		}

		return res.send({ status: "ok" })
	}

	@PUT({
		url: "/webhook/:id/:token",
		options: {
			schema: {
				params: z.object({
					id: z.string(),
					token: z.string(),
				}),

				description: "Add Discord webhook to FAGC notifications",
				tags: ["discord"],
				response: {
					"200": Webhook,
				},
			},
		},
	})
	async createWebhook(
		req: FastifyRequest<{
			Params: {
				id: string
				token: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { id, token } = req.params
		let webhook: DiscordWebhook
		try {
			webhook = await client.fetchWebhook(id, token)
		} catch {
			return res.status(404).send({
				errorCode: 404,
				error: "Not Found",
				message: "Provided webhook could not be found",
			})
		}
		const webhooksInSameGuild = await WebhookModel.find({
			guildId: webhook.guildId,
		})
		if (webhooksInSameGuild.length) {
			const msg = `This guild already has another webhook in the FAGC database with the ID of ${webhooksInSameGuild[0].id}, therefore another webhook was not added`
			webhook.send(msg)
			return res
				.status(409)
				.send({ errorCode: 409, error: "Conflict", message: msg })
		}
		webhook.send("Success in adding this webhook to FAGC")
		const dbRes = await WebhookModel.create({
			id: id,
			token: token,
			guildId: webhook.guildId,
		})
		return res.status(200).send(dbRes)
	}

	@DELETE({
		url: "/webhook/:id/:token",
		options: {
			schema: {
				params: z.object({
					id: z.string(),
					token: z.string(),
				}),

				description: "Remove a webhook from FAGC notifications",
				tags: ["discord"],
				response: {
					"200": Webhook,
				},
			},
		},
	})
	async deleteWebhook(
		req: FastifyRequest<{
			Params: {
				id: string
				token: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { id, token } = req.params
		const found = await WebhookModel.findOneAndRemove({
			id: id,
			token: token,
		})

		if (found) {
			const webhook = new WebhookClient({
				id: found.id,
				token: found.token,
			})
			webhook
				.send("This webhook will no longer recieve FAGC notifications")
				.then(() => webhook.destroy())
			return res.status(200).send(found)
		}
		return res.status(404).send({
			errorCode: 404,
			error: "Not Found",
			message: "Provided webhook could not be found",
		})
	}

	// OAuth for users

	@GET({
		url: "/oauth/url",
		options: {
			schema: {
				description: "Get the Discord OAuth URL",
				tags: ["discord"],
				response: {
					"200": z.string(),
				},
			},
		},
	})
	async getOauthURL(
		req: FastifyRequest,
		res: FastifyReply
	): Promise<FastifyReply> {
		const params = new URLSearchParams()
		params.append("client_id", ENV.CLIENTID)
		params.append("scope", BOT_SCOPES.join(" "))
		params.append("response_type", "code")
		params.append("redirect_uri", `${ENV.BASE_URL}/discord/oauth/callback`)
		params.append("permisions", BOT_PERMS.toString())

		const url = `https://discord.com/api/oauth2/authorize?${params}`

		return res.send(url)
	}

	@GET({
		url: "/oauth/callback",
		options: {
			schema: {
				querystring: z.object({
					code: z.string(),
				}),

				description: "Callback for the Discord OAuth flow",
				tags: ["discord"],
				response: {
					"200": z.string(),
				},
			},
		},
	})
	async getOauthCallback(
		req: FastifyRequest<{
			Querystring: {
				code: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		let exchangedData: RESTPostOAuth2AccessTokenResult
		try {
			exchangedData = (await rest.post(Routes.oauth2TokenExchange(), {
				body: new URLSearchParams({
					client_id: ENV.CLIENTID,
					client_secret: ENV.DISCORD_SECRET,
					grant_type: "authorization_code",
					code: req.query.code,
					redirect_uri: `${ENV.BASE_URL}/discord/oauth/callback`,
				}),
				passThroughBody: true,
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					Accept: "application/json",
				},
			})) as RESTPostOAuth2AccessTokenResult
		} catch (e) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-expect-error
			if (e.message === `Invalid "code" in request.`)
				return res.status(400).send("Invalid code")
			throw e
		}

		// we need to create a new instance of the REST class for this user specifically, since we can't set a token for individual requests
		const userRest = new REST({ version: "10" }).setToken(
			exchangedData.access_token
		)
		const userData = (await userRest.get(
			Routes.oauth2CurrentAuthorization(),
			{
				authPrefix: "Bearer",
			}
		)) as RESTGetAPIOAuth2CurrentAuthorizationResult
		const apiUser = userData.user!

		// save the user to the database for future use
		await UserModel.findOneAndUpdate(
			{
				id: apiUser.id,
			},
			{
				id: apiUser.id,
				tag: `${apiUser.username}#${apiUser.discriminator}`,
				accessToken: exchangedData.access_token,
				// get date of expiry of the access token
				expiresAt: new Date(
					Date.now() + exchangedData.expires_in * 1000
				),
				refreshToken: exchangedData.refresh_token,
			},
			{
				upsert: true,
			}
		)

		return res.send(`Success authenticating`)
	}
}
