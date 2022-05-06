import path from "path"
import util from "util"
import ENV from "./utils/env"
import Fastify, { FastifyInstance, FastifyServerOptions } from "fastify"
import fastifyCorsPlugin from "fastify-cors"
import fastifyRateLimitPlugin from "fastify-rate-limit"
import { fastifyRequestContextPlugin } from "fastify-request-context"
import fastifyHelmetPlugin from "fastify-helmet"
import { bootstrap } from "fastify-decorators"
import fastifyWebSocket from "fastify-websocket"
import { DocumentType } from "@typegoose/typegoose"
import { CommunityClass } from "./database/community"
import { BeAnObject } from "@typegoose/typegoose/lib/types"
import fastifyFormBodyPlugin from "fastify-formbody"
import * as Sentry from "@sentry/node"
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as Tracing from "@sentry/tracing"
import fastifySwagger from "fastify-swagger"
import { z } from "zod"
import { generateSchema } from "@anatine/zod-openapi"
import * as Types from "fagc-api-types"

const fastify: FastifyInstance = Fastify({
	jsonShorthand: false,
	logger: false,
	// jsonShorthand is missing in the type definition for fastify :|
} as unknown as FastifyServerOptions)

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
	transform: (schema: any) => {
		const {
			params = undefined,
			body = undefined,
			querystring = undefined,
			response = undefined,
			...others
		} = schema
		const transformed = { ...others }
		if (params) transformed.params = generateSchema(params)
		if (body) transformed.body = generateSchema(body)
		if (querystring) transformed.querystring = generateSchema(querystring)
		if (response) {
			transformed.response = Object.fromEntries(
				Object.entries(response).map(([status, zodSchema]) => [
					status,
					relinkSchema(generateSchema(zodSchema as z.ZodTypeAny)),
				])
			)
		}
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
			{ name: "categories", description: "Category related end-points" },
			{
				name: "discord",
				description: "Discord integration related end-points",
			},
			{ name: "reports", description: "Report related end-points" },
			{
				name: "revocations",
				description: "Revocation related end-points",
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
	...generateSchema(Types.Community),
})
fastify.addSchema({
	$id: "CategoryClass",
	...generateSchema(Types.Category),
})
fastify.addSchema({
	$id: "ReportClass",
	...generateSchema(Types.Report),
})
fastify.addSchema({
	$id: "RevocationClass",
	...generateSchema(Types.Revocation),
})
fastify.addSchema({
	$id: "GuildConfigClass",
	...generateSchema(Types.GuildConfig),
})
fastify.addSchema({
	$id: "WebhookClass",
	...generateSchema(Types.Webhook),
})

const builtinSchemas: Map<string, any> = new Map()
for (const [id, schema] of Object.entries(fastify.getSchemas())) {
	const clone = { ...(schema as object) } as any
	for (const prop of [
		"$id",
		"title",
		...Object.getOwnPropertySymbols(clone),
	]) {
		delete clone[prop]
	}
	builtinSchemas.set(id, clone)
}

/**
 * Transform an OpenAPI 3.0 schema by replacing sub-schemas in it with refs
 * to known schemas on the server.
 */
function relinkSchema(schema: any) {
	for (const [id, builtinSchema] of builtinSchemas) {
		if (util.isDeepStrictEqual(schema, builtinSchema)) {
			return { $ref: id }
		}
		if (
			schema.nullable &&
			!builtinSchema.nullable &&
			util.isDeepStrictEqual(schema, {
				...builtinSchema,
				nullable: schema.nullable,
			})
		) {
			return { allOf: [{ type: "object", nullable: true }, { $ref: id }] }
		}
	}

	if (typeof schema !== "object" || schema === null) {
		return schema
	}
	const clone = { ...schema }
	if (clone.items) clone.items = relinkSchema(clone.items)
	if (clone.properties)
		clone.properties = Object.fromEntries(
			Object.entries(clone.properties).map(([k, v]) => [
				k,
				relinkSchema(v),
			])
		)
	return clone
}

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
	allowList: ["::ffff:127.0.0.1", "::1", "127.0.0.1"],
})

// context
fastify.register(fastifyRequestContextPlugin, {
	hook: "preValidation",
	defaultStoreValues: {},
})
// typed context
declare module "fastify-request-context" {
	interface RequestContextData {
		community?: DocumentType<CommunityClass, BeAnObject>
		authType?: "master" | "private" | "public"
	}
}

// helmet
fastify.register(fastifyHelmetPlugin, {
	contentSecurityPolicy: {
		directives: {
			...(ENV.NODE_ENV === "development"
				? { "upgrade-insecure-requests": null }
				: {}),
		},
	},
	...(ENV.NODE_ENV === "development" ? { hsts: false } : {}),
})

// form body for backwards compat with the express api
fastify.register(fastifyFormBodyPlugin)

fastify.setValidatorCompiler(({ schema }) => {
	return function (data) {
		const result = (schema as z.ZodTypeAny).safeParse(data)
		if (!result.success) return { error: result.error }
		return { value: result.data }
	}
})

class ResponseValidationError extends Error {
	constructor(public original: z.ZodError) {
		super()
	}
}

fastify.setSerializerCompiler(({ schema }) => {
	return function (data) {
		try {
			return JSON.stringify((schema as z.ZodTypeAny).parse(data))
		} catch (error) {
			if (error instanceof z.ZodError)
				throw new ResponseValidationError(error)
			throw error
		}
	}
})

fastify.register(bootstrap, {
	directory: path.resolve(__dirname, "routes"),
	mask: /\.(handler|controller)\.(js|ts)$/,
})

// fastify.register(fastifyResponseValidationPlugin)

function formatZodError(error: z.ZodError) {
	const fieldErrors: { [path: string]: string[] } = {}
	const formErrors: string[] = []
	for (const issue of error.issues) {
		if (issue.path.length > 0) {
			const path = issue.path.map(String).reduce((a, b) => `${a}.${b}`)
			fieldErrors[path] = fieldErrors[path] || []
			fieldErrors[path].push(issue.message)
		} else {
			formErrors.push(issue.message)
		}
	}

	const formMessages = formErrors.map((m) => `${m}\n`).join()
	const fieldMessages = Object.entries(fieldErrors)
		.flatMap(([name, messages]) =>
			messages.map((message) => `${name}: ${message}\n`)
		)
		.join()
	return [formMessages, fieldMessages].join("")
}

fastify.setErrorHandler(async (error, request, reply) => {
	if (error instanceof ResponseValidationError) {
		// is a validaiton error
		return reply.status(500).send({
			errorCode: 500,
			error: "Internal Eerver Error",
			message: `Validation of response data failed\n${formatZodError(
				error.original
			)}`,
		})
	}
	if (error instanceof z.ZodError) {
		// is a validaiton error
		return reply.status(400).send({
			errorCode: 400,
			error: "Invalid Request",
			message: `Invalid request data\n${formatZodError(error)}`,
		})
	}

	console.error(error)
	// Sending error to be logged in Sentry
	if (hasSentry) Sentry.captureException(error)
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
