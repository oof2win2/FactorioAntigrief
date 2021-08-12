// so stuff works properly
process.chdir(__dirname)

import Fastify, { FastifyInstance } from "fastify"

import fastifyCorsPlugin from "fastify-cors"
import fastifyRateLimitPlugin from "fastify-rate-limit"
import { fastifyRequestContextPlugin } from "fastify-request-context"
import fastifyHelmetPlugin from "fastify-helmet"
import { bootstrap } from "fastify-decorators"
import path from "node:path"

import ENV from "./utils/env"
import { DocumentType } from "@typegoose/typegoose"
import { CommunityClass } from "./database/fagc/community"
import { BeAnObject } from "@typegoose/typegoose/lib/types"
import fastifyFormBodyPlugin from "fastify-formbody"


const fastify: FastifyInstance = Fastify({})

// // cors
fastify.register(fastifyCorsPlugin, {
	origin: true // reflect the request origin
})

// rate limiting
fastify.register(fastifyRateLimitPlugin, {
	max: 100,
	timeWindow: 1000 * 60, // 100 reqs in 60s
	allowList: [
		"::ffff:127.0.0.1",
		"::1"
	],

})

// context
fastify.register(fastifyRequestContextPlugin, {
	hook: "preValidation",
	defaultStoreValues: {
	}
})
// typed context
declare module "fastify-request-context" {
	interface RequestContextData {
		community?: DocumentType<CommunityClass, BeAnObject>
	}
}

// helmet
fastify.register(fastifyHelmetPlugin)

// form body for backwards compat with the express api
fastify.register(fastifyFormBodyPlugin)

// middlware to remove garbage from responses
import removeIdMiddleware from "./utils/removeId"
fastify.addHook("onSend", removeIdMiddleware)


fastify.register(bootstrap, {
	directory: path.resolve(__dirname, "routes"),
})


// fastify.register(fastifyResponseValidationPlugin)

const start = async () => {
	try {
		await fastify.listen(ENV.API_PORT)

		const address = fastify.server.address()
		const port = typeof address === "string" ? address : address?.port
		console.log(`Server listening on :${port}`)

	} catch (err) {
		console.error(err)
		process.exit(1)
	}
}
start()