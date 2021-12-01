import { FastifyReply, FastifyRequest } from "fastify"
import { Controller, DELETE, POST } from "fastify-decorators"
import { Type } from "@sinclair/typebox"

import { MessageEmbed, Webhook, WebhookClient } from "discord.js"
import WebhookModel from "../database/fagc/webhook.js"
import { client } from "../utils/discord.js"
import { MasterAuthenticate } from "../utils/authentication.js"

@Controller({ route: "/informatics" })
export default class ProfileController {
	// @GET({
	// 	url: "/logs/:count/:since",
	// 	options: {
	// 		schema: {
	// 			params: Type.Required(
	// 				Type.Object({
	// 					count: Type.Number(),
	// 					since: Type.Number(),
	// 				})
	// 			),

	// 			description: "Get logs",
	// 			tags: ["informatics"],
	// 			security: [
	// 				{
	// 					masterAuthorization: [],
	// 				},
	// 			],
	// 		},
	// 	},
	// })
	// async getLogs(
	// 	req: FastifyRequest<{
	// 		Params: {
	// 			count: number
	// 			since: number
	// 		}
	// 	}>,
	// 	res: FastifyReply
	// ): Promise<FastifyReply> {
	// 	const { count, since } = req.params
	// 	const logs = await LogModel.find(
	// 		{
	// 			timestamp: { $gte: new Date(since) },
	// 		},
	// 		null,
	// 		{
	// 			limit: count,
	// 		}
	// 	)
	// 	return res.send(logs)
	// }

	@POST({
		url: "/webhook",
		options: {
			schema: {
				body: Type.Required(
					Type.Object({
						id: Type.String(),
						token: Type.String(),
					})
				),

				description: "Add a webhook to FAGC notifications",
				tags: [ "informatics" ],
				response: {
					"200": {
						$ref: "WebhookClass#",
					},
				},
			},
		},
	})
	async addWebhook(
		req: FastifyRequest<{
			Body: {
				id: string
				token: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { id, token } = req.body
		let webhook: Webhook
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
				.status(403)
				.send({ errorCode: 403, error: "Forbidden", message: msg })
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
		url: "/webhook",
		options: {
			schema: {
				body: Type.Required(
					Type.Object({
						id: Type.String(),
						token: Type.String(),
					})
				),

				description: "Remove a webhook from FAGC notifications",
				tags: [ "informatics" ],
				response: {
					"200": {
						$ref: "WebhookClass#",
					},
				},
			},
		},
	})
	async removeWebhook(
		req: FastifyRequest<{
			Body: {
				id: string
				token: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { id, token } = req.body
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

	@POST({
		url: "/notify/:guildId",
		options: {
			schema: {
				params: Type.Object({
					guildId: Type.String(),
				}),
				body: Type.Object({
					data: Type.String(),
				}),

				description:
					"Notify a guild with a text message sent with [Message](https://discord.js.org/#/docs/main/stable/class/Message)",
				tags: [ "informatics" ],
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
				data: string
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
				webhook.send(req.body.data)
			}
		}

		return res.send({ status: "ok" })
	}

	@POST({
		url: "/notify/:guildId/embed",
		options: {
			schema: {
				params: Type.Object({
					guildId: Type.String(),
				}),
				body: Type.Object(
					{},
					{
						additionalProperties: true,
					}
				),

				description:
					"Notify a guild with a [MessageEmbed](https://discord.js.org/#/docs/main/stable/class/MessageEmbed)",
				tags: [ "informatics" ],
				security: [
					{
						masterAuthorization: [],
					},
				],
			},
		},
	})
	@MasterAuthenticate
	async notifyGuildEmbed(
		req: FastifyRequest<{
			Params: {
				guildId: string
			}
			Body: Record<string, unknown>
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
				webhook.send({ embeds: [ new MessageEmbed(req.body) ] })
			}
		}

		return res.send({ status: "ok" })
	}
}
