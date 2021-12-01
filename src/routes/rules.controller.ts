import { FastifyReply, FastifyRequest } from "fastify"
import { Controller, DELETE, GET, POST } from "fastify-decorators"
import { Type } from "@sinclair/typebox"

import RuleModel from "../database/fagc/rule.js"
import { MasterAuthenticate } from "../utils/authentication.js"
import { ruleCreatedMessage, ruleRemovedMessage } from "../utils/info.js"

@Controller({ route: "/rules" })
export default class RuleController {
	@GET({
		url: "/",
		options: {
			schema: {
				description: "Fetch all rules",
				tags: [ "rules" ],
				response: {
					"200": {
						type: "array",
						items: {
							$ref: "RuleClass#",
						},
					},
				},
			},
		},
	})
	async getAllRules(
		_req: FastifyRequest,
		res: FastifyReply
	): Promise<FastifyReply> {
		const rules = await RuleModel.find({})
		return res.send(rules)
	}

	@GET({
		url: "/:id",
		options: {
			schema: {
				params: Type.Required(
					Type.Object({
						id: Type.String(),
					})
				),

				description: "Fetch a rule by ID",
				tags: [ "rules" ],
				response: {
					"200": {
						allOf: [ { nullable: true }, { $ref: "RuleClass#" } ],
					},
				},
			},
		},
	})
	async getRule(
		req: FastifyRequest<{
			Params: {
				id: string
			}
		}>,
		res: FastifyReply
	): Promise<FastifyReply> {
		const { id } = req.params
		const rule = await RuleModel.findOne({ id: id })
		return res.send(rule)
	}

	@POST({
		url: "/",
		options: {
			schema: {
				body: Type.Required(
					Type.Object({
						shortdesc: Type.String(),
						longdesc: Type.String(),
					})
				),

				description: "Create a rule",
				tags: [ "rules" ],
				security: [
					{
						masterAuthorization: [],
					},
				],
				response: {
					"200": {
						$ref: "RuleClass#",
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
		const rule = await RuleModel.create({
			shortdesc: shortdesc,
			longdesc: longdesc,
		})
		ruleCreatedMessage(rule)
		return res.send(rule)
	}

	@DELETE({
		url: "/:id",
		options: {
			schema: {
				params: Type.Required(
					Type.Object({
						id: Type.String(),
					})
				),

				description: "Remove a rule",
				tags: [ "rules" ],
				security: [
					{
						masterAuthorization: [],
					},
				],
				response: {
					"200": {
						$ref: "RuleClass#",
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
		const rule = await RuleModel.findOneAndRemove({
			id: id,
		})
		if (rule) ruleRemovedMessage(rule)
		return res.send(rule)
	}
}
