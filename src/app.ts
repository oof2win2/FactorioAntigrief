import path from "path"
const __dirname = path.dirname(new URL(import.meta.url).pathname)

import ENV from "./utils/env.js"

import mongoose from "mongoose"
import Fastify, { FastifyInstance } from "fastify"
import fastifyCorsPlugin from "fastify-cors"
import fastifyRateLimitPlugin from "fastify-rate-limit"
import { fastifyRequestContextPlugin } from "fastify-request-context"
import fastifyHelmetPlugin from "fastify-helmet"
import { bootstrap } from "fastify-decorators"
import { DocumentType } from "@typegoose/typegoose"
import CommunityModel, { CommunityClass } from "./database/fagc/community.js"
import { BeAnObject } from "@typegoose/typegoose/lib/types"
import fastifyFormBodyPlugin from "fastify-formbody"
import { OAuth2Client } from "./utils/discord.js"
import removeIdMiddleware from "./utils/removeId.js"
import { SODIUM_SECRETBOX } from "@mgcrea/fastify-session-sodium-crypto"
import * as Sentry from "@sentry/node"
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as Tracing from "@sentry/tracing"
import fastifyCookie from "fastify-cookie"
import fastifySession from "@mgcrea/fastify-session"
import { SQLiteStore } from "fastify-session-sqlite-store"
import fastifySwagger from "fastify-swagger"
import mongooseToSwagger from "mongoose-to-swagger"
import ReportModel from "./database/fagc/report.js"
import RevocationModel from "./database/fagc/revocation.js"
import RuleModel from "./database/fagc/rule.js"
import UserModel from "./database/fagc/user.js"
import WebhookModel from "./database/fagc/webhook.js"
import GuildConfigModel from "./database/fagc/communityconfig.js"

mongoose.connect(ENV.MONGOURI) // connect to db before loading other stuff

const fastify: FastifyInstance = Fastify({
	logger: false,
})

Sentry.init({
	dsn: ENV.SENTRY_LINK,

	// We recommend adjusting this value in production, or using tracesSampler
	// for finer control
	tracesSampleRate: 1.0,
	integrations: [
		new Sentry.Integrations.Http({ tracing: true }),
		new Sentry.Integrations.Console(),
	],
})

fastify.addHook("onRequest", (req, res, next) => {
	const handler = Sentry.Handlers.requestHandler()
	handler(req.raw, res.raw, next)
})

const SwaggerDefinitions = {}

const swaggerDefOpts = {
	// omitFields: ["_id"],
	props: [ "id" ],
}
const communityModelSwagger = mongooseToSwagger(CommunityModel, swaggerDefOpts)
SwaggerDefinitions[communityModelSwagger.title] = communityModelSwagger
const ReportModelSwagger = mongooseToSwagger(ReportModel, swaggerDefOpts)
SwaggerDefinitions[ReportModelSwagger.title] = ReportModelSwagger
const RevocationModelSwagger = mongooseToSwagger(
	RevocationModel,
	swaggerDefOpts
)
SwaggerDefinitions[RevocationModelSwagger.title] = RevocationModelSwagger
const RuleModelSwagger = mongooseToSwagger(RuleModel, swaggerDefOpts)
SwaggerDefinitions[RuleModelSwagger.title] = RuleModelSwagger
const UserModelSwagger = mongooseToSwagger(UserModel, swaggerDefOpts)
SwaggerDefinitions[UserModelSwagger.title] = UserModelSwagger
const WebhookModelSwagger = mongooseToSwagger(WebhookModel, swaggerDefOpts)
SwaggerDefinitions[WebhookModelSwagger.title] = WebhookModelSwagger

// add in id because of https://github.com/giddyinc/mongoose-to-swagger/pull/33
Object.keys(SwaggerDefinitions).map((key) => {
	SwaggerDefinitions[key].properties = {
		id: { type: "string" },
		...SwaggerDefinitions[key].properties,
	}
})

const GuildConfigModelSwagger = mongooseToSwagger(
	GuildConfigModel,
	swaggerDefOpts
)
SwaggerDefinitions[GuildConfigModelSwagger.title] = GuildConfigModelSwagger

// swagger
fastify.register(fastifySwagger, {
	routePrefix: "/documentation",
	openapi: {
		info: {
			title: "FAGC Backend",
			description: "FAGC Backend",
			version: "0.1.0",
		},
		externalDocs: {
			url: "https://github.com/FactorioAntigrief/fagc-backend",
			description: "Find the repo here",
		},
		// consumes: ["application/json", "x-www-form-urlencoded"],
		// produces: ["application/json"],
		tags: [
			{ name: "community", description: "Community related end-points" },
			{ name: "rules", description: "Rule related end-points" },
			{ name: "reports", description: "Report related end-points" },
			{ name: "profiles", description: "Profile related end-points" },
			{
				name: "revocations",
				description: "Revocation related end-points",
			},
			{
				name: "informatics",
				description: "Informatics related end-points",
			},
			{ name: "master", description: "Master API" },
		],
		components: {
			securitySchemes: {
				authorization: {
					type: "apiKey",
					name: "authorization",
					in: "header",
				},
				masterAuthorization: {
					type: "apiKey",
					name: "authorization",
					in: "header",
				},
			},
		},
	},
	uiConfig: {
		docExpansion: "full",
		deepLinking: false,
	},
	uiHooks: {
		onRequest: function (request, reply, next) {
			next()
		},
		preHandler: function (request, reply, next) {
			next()
		},
	},
	staticCSP: true,
	transformStaticCSP: (header) => header,
	exposeRoute: true,
})

Object.keys(SwaggerDefinitions).map((key) => {
	fastify.addSchema({
		...SwaggerDefinitions[key],
		type: "object",
		$id: SwaggerDefinitions[key].title,
	})
})
fastify.addSchema({
	type: "object",
	$id: "Profile",
	properties: {
		communityId: { type: "string" },
		playername: { type: "string" },
		reports: {
			type: "array",
			items: {
				$ref: "ReportClass#",
			},
		},
	},
})

// cors
fastify.register(fastifyCorsPlugin, {
	origin: true, // reflect the request origin
})

// rate limiting
fastify.register(fastifyRateLimitPlugin, {
	max: 100,
	timeWindow: 1000 * 60, // 100 reqs in 60s
	allowList: [ "::ffff:127.0.0.1", "::1", "127.0.0.1" ],
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
	store: new SQLiteStore({
		ttl: ENV.SESSION_TTL,
		filename: ENV.SESSION_DBPATH.endsWith(".sqlite")
			? ENV.SESSION_DBPATH
			: ENV.SESSION_DBPATH + ".sqlite",
	}),
	crypto: SODIUM_SECRETBOX,
	secret: ENV.SESSIONSECRET,
	cookie: { maxAge: ENV.SESSION_TTL },
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

fastify.setErrorHandler(async (error, request, reply) => {
	if (!error.validation) {
		// Logging locally
		console.log(error, error.validation)
		// Sending error to be logged in Sentry
		Sentry.captureException(error)
		reply.status(500).send({
			errorCode: 500,
			error: "Something went wrong",
			message: error.message,
		})
	} else {
		reply.status(400).send({
			errorCode: 400,
			error: "Invalid request",
			message: error.message,
		})
	}
})

const start = async () => {
	try {
		await fastify.listen(ENV.API_PORT, ENV.API_HOST)

		const address = fastify.server.address()
		const port = typeof address === "string" ? address : address?.port
		console.log(`Server listening on :${port}`)
	} catch (err) {
		console.error(err)
		process.exit(1)
	}
}
start()

fastify.ready((err) => {
	if (err) throw err
	fastify.swagger()
})

process.on("beforeExit", () => {
	fastify.close()
})
