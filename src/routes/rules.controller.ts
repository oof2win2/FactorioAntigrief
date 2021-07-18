import { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, GET } from 'fastify-decorators';
import { Type } from "@sinclair/typebox"

import RuleModel from "../database/fagc/rule"
import Authenticate from '../utils/authentication';

@Controller({ route: "/rules" })
export default class RuleController {

	@GET({ url: "/" })
	async getAllRules(req: FastifyRequest, res: FastifyReply) {
		const rules = await RuleModel.find({})
		return res.send(rules)
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
	async getRule(req: FastifyRequest, res: FastifyReply) {
		console.log("get rule")
		const { id }: { id: string } = <any>req.params
		const rule = await RuleModel.findOne({id: id})
		return res.send(rule)
	}
}