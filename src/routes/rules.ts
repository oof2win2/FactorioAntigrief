// import express from "express"
// import RuleModel from "../database/fagc/rule"
// import { validateUserString } from "../utils/functions-databaseless"

// const router = express.Router()

// /* GET home page. */
// router.get("/", function (req, res) {
// 	res.json({ message: "Rules API Homepage!" })
// })
// router.get("/getall", async (req, res) => {
// 	const result = await RuleModel.find()
// 	return res.status(200).json(result)
// })
// router.get("/getid", async (req, res) => {
// 	if (req.query.id === undefined || !validateUserString(req.query.id))
// 		return res.status(400).json({ error: "Bad Request", description: `id must be ID, got ${req.query.id}` })
// 	const rule = await RuleModel.findOne({ id: req.query.id })
// 	res.status(200).json(rule)
// })

// export default router

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Type } from "@sinclair/typebox"

import RuleModel, { RuleClass } from "../database/fagc/rule"
import { validateUserString } from "../utils/functions-databaseless"

const yupOptions = {
	strict: false,
	abortEarly: false, // return all errors
	stripUnknown: true, // remove additional properties
	recursive: true
}

export default function (fastify: FastifyInstance, opts, next) {
	fastify.get("/", async (req, res) => {
		const rules = await RuleModel.find({})
		return res.send(rules)
	})

	fastify.get<{
		Params: {
			id: string
		},
		Response: ({
			id: string
			shortdesc: string
			longdesc: string
		} | null)
	}>("/:id", {
		schema: {
			params: Type.Required(Type.Object({
				id: Type.String()
			}))
		}
	}, async (req, res) => {
		const { id } = req.params

		const rule = await RuleModel.findOne({ id: id })
		if (!rule) res.status(201).send(null)
		return res.status(200).send(rule)
	})
	next()
}