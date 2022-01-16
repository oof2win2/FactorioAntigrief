import path from "path"
import ENV from "./utils/env"
import Fastify, { FastifyInstance } from "fastify"
import fastifyCorsPlugin from "fastify-cors"
import fastifyRateLimitPlugin from "fastify-rate-limit"
import { fastifyRequestContextPlugin } from "fastify-request-context"
import fastifyHelmetPlugin from "fastify-helmet"
import { bootstrap } from "fastify-decorators"
import fastifyWebSocket from "fastify-websocket"
import { DocumentType } from "@typegoose/typegoose"
import CommunityModel, { CommunityClass } from "./database/community"
import { BeAnObject } from "@typegoose/typegoose/lib/types"
import fastifyFormBodyPlugin from "fastify-formbody"
import { OAuth2Client } from "./utils/discord"
import removeIdMiddleware from "./utils/removeId"
import { SODIUM_SECRETBOX } from "@mgcrea/fastify-session-sodium-crypto"
import * as Sentry from "@sentry/node"
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as Tracing from "@sentry/tracing"
import fastifyCookie from "fastify-cookie"
import fastifySession from "@mgcrea/fastify-session"
import { SQLiteStore } from "fastify-session-sqlite-store"
import fastifySwagger from "fastify-swagger"
import { z } from "zod"
import { generateSchema } from "@anatine/zod-openapi"
import * as Types from "fagc-api-types"

const fastify: FastifyInstance = Fastify({
	logger: false,
})

const hasSentry = Boolean(ENV.SENTRY_LINK)
if (hasSentry) {
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
}



// swagger
fastify.register(fastifySwagger, {
	routePrefix: "/documentation",
	transform: (schema) => {
		const {
			params = undefined,
			body = undefined,
			querystring = undefined,
			...others
		} = schema
		const transformed = { ...others }
		if (params) transformed.params = generateSchema(params)
		if (body) transformed.body = generateSchema(body)
		if (querystring) transformed.querystring = generateSchema(querystring)
		return transformed
	},
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
	transformStaticCSP: (header) => {
		if (ENV.NODE_ENV == "development")
			return header.replace("upgrade-insecure-requests;", "")
		return header
	},
	exposeRoute: true,
})

fastify.addSchema({
	$id: "CommunityClass",
	...generateSchema(Types.Community)
})
fastify.addSchema({
	$id: "RuleClass",
	...generateSchema(Types.Rule)
})
fastify.addSchema({
	$id: "ReportClass",
	...generateSchema(Types.Report)
})
fastify.addSchema({
	$id: "RevocationClass",
	...generateSchema(Types.Revocation)
})
fastify.addSchema({
	$id: "GuildConfigClass",
	...generateSchema(Types.GuildConfig)
})
fastify.addSchema({
	$id: "WebhookClass",
	...generateSchema(Types.Webhook)
})

// ws
fastify.register(fastifyWebSocket)

// cors
fastify.register(fastifyCorsPlugin, {
	origin: true, // reflect the request origin
})

// rate limiting
fastify.register(fastifyRateLimitPlugin, {
	max: 50,
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
fastify.register(fastifyHelmetPlugin, {
	contentSecurityPolicy: {
		directives: {
			...(ENV.NODE_ENV === "development" ? { "upgrade-insecure-requests": null } : {}),
		},
	},
	...(ENV.NODE_ENV === "development" ? { hsts: false, } : {}),
})

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


fastify.setValidatorCompiler(({ schema }: {
	schema: z.ZodAny
}) => {
	return function(data) {
		const result = schema.safeParse(data)
		if (!result.success) return { error: result.error }
		return { value: result.data }
	}
})

fastify.register(bootstrap, {
	directory: path.resolve(__dirname, "routes"),
	mask: /\.(handler|controller)\.(js|ts)$/
})

// fastify.register(fastifyResponseValidationPlugin)

fastify.setErrorHandler(async (error, request, reply) => {
	if (error instanceof z.ZodError) {
		// is a validaiton error
		const x = error.format()
		const errorOutput = {}

		Object.keys(x).forEach((key) => {
			if (key === "_errors") return
			errorOutput[key] =  x[key]._errors
		})
		return reply.status(400).send({
			errorCode: 400,
			error: "Invalid Request",
			message: Array.isArray(x._errors) && x._errors.length ? x._errors[0] : errorOutput
		})
	}

	console.error(error)
	// Sending error to be logged in Sentry
	if (hasSentry)
		Sentry.captureException(error)
	reply.status(500).send({
		errorCode: 500,
		error: "Something went wrong",
		message: error.message,
	})
})

fastify.ready((err) => {
	if (err) throw err
	fastify.swagger()
})

export default fastify
