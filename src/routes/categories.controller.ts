import { FastifyReply, FastifyRequest } from "fastify"
import { Controller, DELETE, GET, PATCH, POST } from "fastify-decorators"
import CategoryModel from "../database/category"
import GuildConfigModel from "../database/guildconfig"
import { MasterAuthenticate } from "../utils/authentication"
import { guildConfigChanged, categoryCreatedMessage, categoryRemovedMessage, categoriesMergedMessage, categoryUpdatedMessage } from "../utils/info"
import { z } from "zod"
import ReportInfoModel from "../database/reportinfo"

@Controller({ route: "/categories" })
export default class CategoryController {
	@GET({
		url: "/",
		options: {
			schema: {
				description: "Fetch all categories",
				tags: [ "categories" ],
				response: {
					"200": {
						type: "array",
						items: {
							$ref: "CategoryClass#",
						},
					},
				},
			},
		},
	})
	async getAllCategories(
		_req: FastifyRequest,
		res: FastifyReply
	): Promise<FastifyReply> {
		const categories = await CategoryModel.find({})
		return res.send(categories)
	}

	@GET({
		url: "/:id",
		options: {
			schema: {
				params: z.object({
					id: z.string(),
				}).required(),

				description: "Fetch a category by ID",
				tags: [ "categories" ],
				response: {
					"200": {
						allOf: [ { nullable: true }, { $ref: "CategoryClass#" } ],
					},
				},
			},
		},
	})
	async getCategory(
		req: FastifyRequest<{
			Params: {
				id: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { id } = req.params
		const category = await CategoryModel.findOne({ id: id })
		return res.send(category)
	}

	@POST({
		url: "/",
		options: {
			schema: {
				body: z.object({
					shortdesc: z.string(),
					longdesc: z.string()
				}).required(),

				description: "Create a category",
				tags: [ "categories" ],
				security: [
					{
						masterAuthorization: [],
					},
				],
				response: {
					"200": {
						$ref: "CategoryClass#",
					},
				},
			},
		},
	})
	@MasterAuthenticate
	async create(
		req: FastifyRequest<{
			Body: {
				shortdesc: string
				longdesc: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { shortdesc, longdesc } = req.body
		const category = await CategoryModel.create({
			shortdesc: shortdesc,
			longdesc: longdesc,
		})
		categoryCreatedMessage(category)
		return res.send(category)
	}

	@PATCH({
		url: "/:id",
		options: {
			schema: {
				params: z.object({
					id: z.string()
				}).required(),
				body: z.object({
					shortdesc: z.string().optional(),
					longdesc: z.string().optional(),
				}).optional(),

				description: "Update a category",
				tags: [ "categories" ],
				security: [
					{
						masterAuthorization: [],
					},
				],
				response: {
					"200": {
						$ref: "CategoryClass#",
					},
				},
			},
		},
	})
	@MasterAuthenticate
	async update(
		req: FastifyRequest<{
			Params: {
				id: string
			}
			Body: {
				shortdesc?: string
				longdesc?: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { shortdesc, longdesc } = req.body
		const { id } = req.params

		if (!shortdesc && !longdesc) {
			return res.send(await CategoryModel.findOne({ id: id }))
		}
		const oldCategory = await CategoryModel.findOne({ id: id })

		if (!oldCategory) return res.send(null)
		const newCategory = await CategoryModel.findOneAndUpdate({
			id: id
		}, {
			...Boolean(shortdesc) && { shortdesc: shortdesc },
			...Boolean(longdesc) && { longdesc: longdesc }
		}, { new: true })
		if (!newCategory) return res.send(null)

		categoryUpdatedMessage(oldCategory, newCategory)

		return res.send(newCategory)
	}

	@DELETE({
		url: "/:id",
		options: {
			schema: {
				params: z.object({
					id: z.string(),
				}),

				description: "Remove a category",
				tags: [ "categories" ],
				security: [
					{
						masterAuthorization: [],
					},
				],
				response: {
					"200": {
						$ref: "CategoryClass#",
					},
				},
			},
		},
	})
	@MasterAuthenticate
	async delete(
		req: FastifyRequest<{
			Params: {
				id: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { id } = req.params
		const category = await CategoryModel.findOneAndRemove({
			id: id,
		})

		if (category) {
			categoryRemovedMessage(category)
			// store the IDs of the affected guilds - ones which have the category filtered
			const affectedGuildConfigs = await GuildConfigModel.find({
				categoryFilters: [ category.id ]
			})
			
			// remove the category ID from any guild configs which may have it
			await GuildConfigModel.updateMany({
				_id: { $in: affectedGuildConfigs.map(config => config._id) }
			}, {
				$pull: { categoryFilters: category.id }
			})

			const newGuildConfigs = await GuildConfigModel.find({
				_id: { $in: affectedGuildConfigs.map(config => config._id) }
			})

			await ReportInfoModel.deleteMany({
				categoryId: category.id
			})

			// tell guilds about it after the revocations + reports have been removed
			const sendGuildConfigInfo = async () => {
				const wait = (ms: number): Promise<void> => new Promise((resolve) => {
					setTimeout(() => {
						resolve()
					}, ms)
				})
				for (const config of newGuildConfigs) {
					guildConfigChanged(config)
					// 1000 * 100 / 1000 = amount of seconds it will take for 100 communities
					// staggered so not everyone at once tries to fetch their new banlists
					await wait(100)
				}
			}
			sendGuildConfigInfo() // this will make it execute whilst letting other code still run
		}
		return res.send(category)
	}

	@PATCH({
		url: "/:idReceiving/merge/:idDissolving",
		options: {
			schema: {
				params: z.object({
					idReceiving: z.string(),
					idDissolving: z.string(),
				}),

				description: "Merge category idTwo into category idReceiving",
				tags: [ "categories" ],
				security: [
					{
						masterAuthorization: [],
					},
				],
				response: {
					"200": {
						$ref: "CategoryClass#",
					},
				},
			},
		},
	})
	@MasterAuthenticate
	async mergeCategories(
		req: FastifyRequest<{
			Params: {
				idReceiving: string
				idDissolving: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { idReceiving, idDissolving } = req.params
		const receiving = await CategoryModel.findOne({
			id: idReceiving
		})
		if (!receiving)
			return res.status(400).send({
				errorCode: 400,
				error: "Bad Request",
				message: "idOne must be a valid category ID",
			})
		const dissolving = await CategoryModel.findOne({
			id: idDissolving
		})
		if (!dissolving)
			return res.status(400).send({
				errorCode: 400,
				error: "Bad Request",
				message: "idTwo must be a valid category ID",
			})


		await CategoryModel.findOneAndDelete({
			id: idDissolving
		})
		await ReportInfoModel.updateMany({
			categoryId: idDissolving
		}, {
			categoryId: idReceiving
		})
		
		await GuildConfigModel.updateMany({
			categoryFilters: idDissolving
		}, {
			$addToSet: { categoryFilters: idReceiving }
		})
		await GuildConfigModel.updateMany({
			categoryFilters: idDissolving,
		}, {
			$pull: { categoryFilters: idDissolving },
		})

		const affectedConfigs = await GuildConfigModel.find({
			categoryFilters: idReceiving
		})

		const sendGuildConfigInfo = async () => {
			const wait = (ms: number): Promise<void> => new Promise((resolve) => {
				setTimeout(() => {
					resolve()
				}, ms)
			})
			for (const config of affectedConfigs) {
				guildConfigChanged(config)
				// 1000 * 100 / 1000 = amount of seconds it will take for 100 communities
				// staggered so not everyone at once tries to fetch their new banlists
				await wait(100)
			}
		}
		sendGuildConfigInfo() // this will make it execute whilst letting other code still run

		categoriesMergedMessage(receiving, dissolving)

		return res.send(receiving)
	}
}
