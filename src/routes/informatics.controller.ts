import { FastifyReply, FastifyRequest } from "fastify"
import { Controller, DELETE, GET, POST } from "fastify-decorators"
import { Type } from "@sinclair/typebox"

import LogModel from "../database/fagc/log.js"
import { Webhook, WebhookClient } from "discord.js"
import WebhookModel from "../database/fagc/webhook.js"
import client from "../utils/discord.js"

@Controller({ route: "/informatics" })
export default class ProfileController {
	@GET({
		url: "/logs/:count/:since",
		options: {
			schema: {
				params: Type.Required(
					Type.Object({
						count: Type.Number(),
						since: Type.Number(),
					})
				),
			},
		},
	})
	async getLogs(
		req: FastifyRequest<{
			Params: {
				count: number
				since: number
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { count, since } = req.params
		const logs = await LogModel.find(
			{
				timestamp: { $gte: new Date(since) },
			},
			null,
			{
				limit: count,
			}
		)
		return res.send(logs)
	}

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
		}
		return res.status(200).send(found)
	}
}
