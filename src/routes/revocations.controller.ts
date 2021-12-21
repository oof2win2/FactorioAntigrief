import { FastifyReply, FastifyRequest } from "fastify"
import { Controller, GET } from "fastify-decorators"
import RevocationModel from "../database/fagc/revocation.js"
import { z } from "zod"

@Controller({ route: "/revocations" })
export default class ProfileController {
	@GET({
		url: "/community/:playername/:communityId",
		options: {
			schema: {
				params: z.object({
					playername: z.string(),
					communityId: z.string(),
				}),

				description: "Fetch all revocations of a player in a community",
				tags: [ "revocation" ],
				response: {
					"200": {
						type: "array",
						items: {
							$ref: "RevocationClass#",
						},
					},
				},
			},
		},
	})
	async fetchCommunity(
		req: FastifyRequest<{
			Params: {
				playername: string
				communityId: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { playername, communityId } = req.params

		const revocations = await RevocationModel.find({
			playername: playername,
			communityId: communityId,
		})
		return res.send(revocations)
	}

	@GET({
		url: "/player/:playername",
		options: {
			schema: {
				params: z.object({
					playername: z.string(),
				}),

				description: "Fetch all revocations of a player",
				tags: [ "revocation" ],
				response: {
					"200": {
						type: "array",
						items: {
							$ref: "RevocationClass#",
						},
					},
				},
			},
		},
	})
	async fetchPlayer(
		req: FastifyRequest<{
			Params: {
				playername: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { playername } = req.params

		const revocations = await RevocationModel.find({
			playername: playername,
		})
		return res.send(revocations)
	}

	@GET({
		url: "/modifiedSince/:timestamp",
		options: {
			schema: {
				params: z.object({
					timestamp: z.string(), // TODO: better time validation
				}),

				description:
					"Fetch all revocations of a player modified since a timestamp",
				tags: [ "revocation" ],
				response: {
					"200": {
						type: "array",
						items: {
							$ref: "RevocationClass#",
						},
					},
				},
			},
		},
	})
	async getModifiedSince(
		req: FastifyRequest<{
			Params: {
				timestamp: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { timestamp } = req.params

		const date = new Date(timestamp)

		const revocations = await RevocationModel.find({
			createdAt: { $gt: date },
		})
		return res.send(revocations)
	}
}
