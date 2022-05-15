import { FastifyReply, FastifyRequest } from "fastify"
import { Controller, DELETE, GET, PATCH, POST } from "fastify-decorators"
import {
	Authenticate,
	createApikey,
	MasterAuthenticate,
} from "../utils/authentication"
import CommunityModel from "../database/community"
import GuildConfigModel from "../database/guildconfig"
import {
	guildConfigChanged,
	communityCreatedMessage,
	communityRemovedMessage,
	communityUpdatedMessage,
	communitiesMergedMessage,
	filterObjectChanged,
} from "../utils/info"
import { validateDiscordUser } from "../utils/discord"
import ReportInfoModel from "../database/reportinfo"
import WebhookModel from "../database/webhook"
import {
	Community,
	CommunityCreatedMessageExtraOpts,
	FilterObject,
	SetFilterObject,
} from "fagc-api-types"
import { z } from "zod"
import FilterModel from "../database/filterobject"

@Controller({ route: "/communities" })
export default class CommunityController {
	@GET({
		url: "/",
		options: {
			schema: {
				description: "Fetch all communities",
				tags: ["community"],
				response: {
					"200": z.array(Community),
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
				tags: ["community"],
				response: {
					"200": Community.nullable(),
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
				tags: ["community"],
				security: [
					{
						authorization: [],
					},
				],
				response: {
					"200": Community.nullable(),
				},
			},
		},
	})
	@Authenticate
	async fetchOwn(
		req: FastifyRequest,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { community } = req.requestContext.get("auth")
		return res.send(community)
	}

	@PATCH({
		url: "/own",
		options: {
			schema: {
				body: z.object({
					contact: z.string().optional(),
					name: z.string().optional(),
				}),

				description: "Update your community",
				tags: ["community"],
				security: [
					{
						authorization: [],
					},
				],
				response: {
					"200": Community.nullable(),
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

		const { community } = req.requestContext.get("auth")
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
		await community.save()

		communityUpdatedMessage(community, {
			createdBy: <CommunityCreatedMessageExtraOpts["createdBy"]>(
				(<unknown>contactUser)
			),
		})

		return res.status(200).send(community)
	}

	@GET({
		url: "/filters",
		options: {
			schema: {
				querystring: z
					.object({
						id: z.string(),
						guildId: z.string(),
						communityId: z.string(),
					})
					.partial()
					.refine(
						(data) =>
							!(!data.id && !data.guildId && !data.communityId),
						"You must have at least one of id, guildId, or communityId present in your query"
					),

				description: "Get filters",
				tags: ["community"],
				security: [],
				response: {
					"200": FilterObject.nullable(),
				},
			},
		},
	})
	async getFilters(
		req: FastifyRequest<{
			Querystring: {
				id?: string
				guildId?: string
				communityId?: string
			}
		}>,
		res: FastifyReply
	) {
		const { id, guildId, communityId } = req.query
		if (id !== undefined) {
			const filter = await FilterModel.findOne({
				id,
			})
			return res.send(filter)
		} else if (guildId !== undefined) {
			const guild = await GuildConfigModel.findOne({
				guildId,
			})
			if (!guild)
				return res.status(404).send({
					errorCode: 404,
					error: "Not found",
					message: "The provided guild was not found",
				})
			const filter = await FilterModel.findOne({
				id: guild.filterObjectId,
			})
			return res.send(filter)
		} else {
			const community = await CommunityModel.findOne({
				id: communityId,
			})
			if (!community)
				return res.status(404).send({
					errorCode: 404,
					error: "Not found",
					message: "The provided community was not found",
				})
			const filter = await FilterModel.findOne({
				id: community.filterObjectId,
			})
			return res.send(filter)
		}
	}

	@GET({
		url: "/filters/own",
		options: {
			schema: {
				description: "Get your own filters",
				tags: ["community"],
				security: [
					{
						authorization: [],
					},
				],
				response: {
					"200": FilterObject.nullable(),
				},
			},
		},
	})
	@Authenticate
	async getOwnFilters(
		req: FastifyRequest,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { community } = req.requestContext.get("auth")
		if (!community)
			return res.status(404).send({
				errorCode: 404,
				error: "Not found",
				message: "Your community was not found",
			})
		const filter = await FilterModel.findOne({
			id: community.filterObjectId,
		})
		return res.send(filter)
	}

	@PATCH({
		url: "/filters",
		options: {
			schema: {
				description: "Set your filters",
				tags: ["community"],
				security: [
					{
						authorization: [],
					},
				],
				body: SetFilterObject.omit({ id: true }),
			},
		},
	})
	@Authenticate
	async setFilters(
		req: FastifyRequest<{
			Body: {
				categoryFilters?: string[]
				communityFilters?: string[]
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { community } = req.requestContext.get("auth")
		if (!community)
			return res.status(404).send({
				errorCode: 404,
				error: "Not found",
				message: "Your community was not found",
			})

		const { communityFilters, categoryFilters } = req.body
		const toSetCommunityIds = new Set<string>([
			...(communityFilters || []),
			community.id,
		])
		const toSetCategoryIds = new Set<string>(categoryFilters || [])
		const filter = await FilterModel.findOneAndUpdate(
			{
				id: community.filterObjectId,
			},
			{
				...(communityFilters && {
					communityFilters: [...toSetCommunityIds],
				}),
				...(categoryFilters && {
					categoryFilters: [...toSetCategoryIds],
				}),
			},
			{
				new: true,
			}
		)
		return res.send(filter)
	}

	@PATCH({
		url: "/filters/:id",
		options: {
			schema: {
				params: z.object({
					id: z.string(),
				}),
				body: SetFilterObject.omit({ id: true }).extend({
					communityId: z.string().nullable(),
				}),
				description: "Set a filter object by ID",
				tags: ["master"],
				security: [
					{
						authorization: [],
					},
				],
			},
		},
	})
	@MasterAuthenticate
	async setMasterFilters(
		req: FastifyRequest<{
			Params: {
				id: string
			}
			Body: {
				categoryFilters?: string[]
				communityFilters?: string[]
				communityId: string | null
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { id } = req.params

		const { categoryFilters, communityFilters, communityId } = req.body
		const toSetCommunityIds = new Set<string>(communityFilters || [])
		const toSetCategoryIds = new Set<string>(categoryFilters || [])

		if (communityId) toSetCommunityIds.add(communityId)

		const filter = await FilterModel.findOneAndUpdate(
			{
				id: id,
			},
			{
				...(communityFilters && {
					communityFilters: [...toSetCommunityIds],
				}),
				...(categoryFilters && {
					categoryFilters: [...toSetCategoryIds],
				}),
			},
			{
				new: true,
			}
		)
		console.log(filter)

		if (!filter) {
			return res.status(404).send({
				statusCode: 404,
				error: "Not found",
				message: "The provided filter was not found",
			})
		}
		return res.send(filter)
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
				tags: ["community"],
				security: [
					{
						authorization: [],
					},
				],
				response: {
					"200": z.object({
						apikey: z.string().optional(),
					}),
				},
			},
		},
	})
	@Authenticate
	async createApiKey(
		req: FastifyRequest<{
			Body: {
				create?: boolean
				invalidate: boolean
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { community } = req.requestContext.get("auth")
		if (!community)
			return res.status(404).send({
				errorCode: 404,
				error: "Not found",
				message: "Your community was not found",
			})

		if (req.body.invalidate) {
			// invalidate all existing tokens
			community.tokenInvalidBefore = new Date()
			await community.save()
		}

		const auth = req.body.create
			? await createApikey(community, community, "reports")
			: undefined
		return res.send({
			apikey: auth,
		})
	}

	@POST({
		url: "/:id/apikey",
		options: {
			schema: {
				params: z.object({
					id: z.string(),
				}),
				body: z.object({
					create: z.boolean().optional(),
					type: z.enum(["reports", "master"]).default("reports"),
					invalidate: z.boolean().optional(),
				}),
				description: "Manage apikey for community",
				tags: ["master"],
				security: [
					{
						masterAuthorization: [],
					},
				],
				response: {
					"200": z.object({
						apikey: z.string().optional(),
					}),
				},
			},
		},
	})
	@MasterAuthenticate
	async masterCreateApikey(
		req: FastifyRequest<{
			Params: {
				id: string
			}
			Body: {
				create?: boolean
				type?: "reports" | "master"
				invalidate: boolean
			}
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
			community.tokenInvalidBefore = new Date()
			await community.save()
		}

		const auth = req.body.create
			? await createApikey(
					community,
					community,
					req.body.type ?? "reports"
			  )
			: undefined
		return res.send({
			apikey: auth,
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
				tags: ["master"],
				security: [
					{
						masterAuthorization: [],
					},
				],
				response: {
					"200": z.object({
						community: Community,
						apikey: z.string(),
					}),
				},
			},
		},
	})
	@MasterAuthenticate
	async createCommunity(
		req: FastifyRequest<{
			Body: {
				name: string
				contact: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { name, contact } = req.body

		const contactUser = await validateDiscordUser(contact)
		if (!contactUser)
			return res.status(400).send({
				errorCode: 400,
				error: "Invalid Discord User",
				message: `${contact} is not a valid Discord user`,
			})
		if (contactUser.bot) {
			return res.status(400).send({
				errorCode: 400,
				error: "Invalid Discord User",
				message: `${contact} is a bot`,
			})
		}

		const filter = await FilterModel.create({})
		const community = await CommunityModel.create({
			name: name,
			contact: contact,
			guildIds: [],
			filterObjectId: filter.id,
		})

		const auth = await createApikey(community, community, "reports")

		communityCreatedMessage(community, {
			createdBy: <CommunityCreatedMessageExtraOpts["createdBy"]>(
				(<unknown>contactUser)
			),
		})

		return res.send({
			community: community,
			apikey: auth,
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
				tags: ["master"],
				security: [
					{
						masterAuthorization: [],
					},
				],
				response: {
					"200": z.boolean(),
				},
			},
		},
	})
	@MasterAuthenticate
	async deleteCommunity(
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
			communityId: community.id,
		})
		await GuildConfigModel.deleteMany({
			communityId: community.id,
		})

		await ReportInfoModel.deleteMany({
			communityId: community.id,
		})

		if (guildConfigs) {
			await WebhookModel.deleteMany({
				guildId: { $in: guildConfigs.map((config) => config.guildId) },
			})
		}

		// remove the community ID from any filter objects which may have it
		const affectedFilters = await FilterModel.find({
			communityFilters: [community.id],
		})
		await FilterModel.updateMany(
			{
				_id: { $in: affectedFilters.map((config) => config._id) },
			},
			{
				$pull: { communityFilters: community.id },
			}
		)
		const newFilters = await FilterModel.find({
			_id: { $in: affectedFilters.map((config) => config._id) },
		})

		const sendGuildConfigInfo = async () => {
			const wait = (ms: number): Promise<void> =>
				new Promise((resolve) => {
					setTimeout(() => {
						resolve()
					}, ms)
				})
			for (const config of newFilters) {
				filterObjectChanged(config)
				// 1000 * 100 / 1000 = amount of seconds it will take for 100 communities
				// staggered so not everyone at once tries to fetch their new banlists
				await wait(100)
			}
		}
		sendGuildConfigInfo() // this will make it execute whilst letting other code still run

		const contactUser = await validateDiscordUser(community.contact)
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

				description:
					"Merge community idDissolving into community idReceiving",
				tags: ["master"],
				security: [
					{
						masterAuthorization: [],
					},
				],
				response: {
					"200": Community,
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
			id: idReceiving,
		})
		if (!receiving)
			return res.status(400).send({
				errorCode: 400,
				error: "Bad Request",
				message: "idOne must be a valid community ID",
			})
		const dissolving = await CommunityModel.findOne({
			id: idDissolving,
		})
		if (!dissolving)
			return res.status(400).send({
				errorCode: 400,
				error: "Bad Request",
				message: "idTwo must be a valid community ID",
			})

		await CommunityModel.findOneAndDelete({
			id: idDissolving,
		})
		await FilterModel.findOneAndDelete({
			id: dissolving.filterObjectId,
		})
		await ReportInfoModel.updateMany(
			{
				communityId: idDissolving,
			},
			{
				communityId: idReceiving,
			}
		)

		// remove old stuff from the config and replace with new
		await FilterModel.updateMany(
			{
				communityFilters: idDissolving,
			},
			{
				$addToSet: { communityFilters: idReceiving },
			}
		)
		await FilterModel.updateMany(
			{
				communityFilters: idDissolving,
			},
			{
				$pull: { communityFilters: idDissolving },
			}
		)

		const guildConfigs = await GuildConfigModel.find({
			communityId: { $in: [idReceiving, idDissolving] },
		})

		// change configs + remove old auth
		await CommunityModel.updateOne(
			{
				id: idReceiving,
			},
			{
				$addToSet: {
					guildIds: guildConfigs.map((config) => config.guildId),
				},
			}
		)
		await GuildConfigModel.updateMany(
			{
				communityId: idDissolving,
			},
			{
				communityId: idReceiving,
				apikey:
					guildConfigs.find((c) => c.communityId === idReceiving)
						?.apikey || undefined,
			}
		)

		const affectedFilters = await FilterModel.find({
			trustedCommunities: idReceiving,
		})

		const sendGuildConfigInfo = async () => {
			const wait = (ms: number): Promise<void> =>
				new Promise((resolve) => {
					setTimeout(() => {
						resolve()
					}, ms)
				})
			for (const config of affectedFilters) {
				filterObjectChanged(config)
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
			),
		})

		return res.send(receiving)
	}
}
