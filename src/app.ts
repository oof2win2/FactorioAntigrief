import path from "path"
const __dirname = path.dirname(new URL(import.meta.url).pathname)

import Fastify, { FastifyInstance } from "fastify"
import fastifyCorsPlugin from "fastify-cors"
import fastifyRateLimitPlugin from "fastify-rate-limit"
import { fastifyRequestContextPlugin } from "fastify-request-context"
import fastifyHelmetPlugin from "fastify-helmet"
import { bootstrap } from "fastify-decorators"
import ENV from "./utils/env.js"
import { DocumentType } from "@typegoose/typegoose"
import { CommunityClass } from "./database/fagc/community.js"
import { BeAnObject } from "@typegoose/typegoose/lib/types"
import fastifyFormBodyPlugin from "fastify-formbody"
import { OAuth2Client } from "./utils/discord.js"
import removeIdMiddleware from "./utils/removeId.js"
import fastifyCookie from "fastify-cookie"
import fastifySession from "@mgcrea/fastify-session"
import { SODIUM_SECRETBOX } from "@mgcrea/fastify-session-sodium-crypto"

const fastify: FastifyInstance = Fastify({})

// cors
fastify.register(fastifyCorsPlugin, {
	origin: true, // reflect the request origin
})

// rate limiting
fastify.register(fastifyRateLimitPlugin, {
	max: 100,
	timeWindow: 1000 * 60, // 100 reqs in 60s
	allowList: ["::ffff:127.0.0.1", "::1", "127.0.0.1"],
})

// context
fastify.register(fastifyRequestContextPlugin, {
	hook: "preValidation",
	defaultStoreValues: {
		oauthclient: OAuth2Client,
	},
})
// typed context
declare module "fastify-request-context" {
	interface RequestContextData {
		community?: DocumentType<CommunityClass, BeAnObject>
		oauthclient: typeof OAuth2Client
	}
}

// helmet
fastify.register(fastifyHelmetPlugin)

// form body for backwards compat with the express api
fastify.register(fastifyFormBodyPlugin)

// middlware to remove garbage from responses
fastify.addHook("onSend", removeIdMiddleware)

// yummy snackies
fastify.register(fastifyCookie)
fastify.register(fastifySession, {
	secret: ENV.SESSIONSECRET,
	cookie: {
		maxAge: 1000 * 86400 * 365, // persist cookie for 1 year
		// httpOnly: true,
		// sameSite: "none", //
		// secure: ENV.isProd, // cookie works only in https
	},
	// cookieName: ENV.COOKIENAME,
	// saveUninitialized: true,
	crypto: SODIUM_SECRETBOX,
})

// typed session
declare module "@mgcrea/fastify-session" {
	interface SessionData {
		userId?: string
	}
}

// import secureSession from "fastify-secure-session"
// fastify.register(secureSession, {
// 	cookieName: ENV.COOKIENAME,
// 	key: ENV.SESSIONSECRET,
// })

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

process.on("beforeExit", () => {
	fastify.close()
})
