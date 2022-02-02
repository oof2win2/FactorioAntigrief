import assert from "assert"
import { FastifyRequest, FastifyReply } from "fastify"
import { RouteGenericInterface } from "fastify/types/route"
import CommunityModel from "../database/community"
import { z } from "zod"
import * as jose from "jose"
import ENV from "./env"
import { Community } from "fagc-api-types"

export const apikey = z.object({
	/**
	 * aud | Audience - type of API key, master or private
	 * @enum {string} "master" | "private"
	 */
	aud: z.enum([ "master", "private" ]), // the type of API key, master api or only private
	/**
	 * sub | Subject - the community ID
	 */
	sub: z.string(),
	/**
	 * iat | Issued At - the time the token was issued
	 */
	iat: z.union([
		z.number().transform((x) => new Date(x * 1000)),
		z.date(),
	])
		.refine((x) => x.valueOf() < Date.now() + 1000) // must be in the past
	,
})
export type apikey = z.infer<typeof apikey>

export async function createApikey(cId: string | Community, audience: "master" | "private" = "private") {
	const community = typeof cId === "string" ? await CommunityModel.findById(cId) : cId
	if (!community) throw new Error("Community not found")
	const apikey = await new jose.SignJWT({})
		.setIssuedAt() // for validating when the token was issued
		.setProtectedHeader({ // encoding method
			alg: "HS256"
		})
		.setSubject(community.id) // subject, who is it issued to
		.setAudience(audience) // audience, what is it for
		.sign(Buffer.from(ENV.JWT_SECRET, "utf8")) // sign the token itself and get an encoded string back
	return apikey
}

export async function parseJWT(token: string, audience: string | string[]): Promise<apikey | null> {
	try {
		const jwt = await jose.jwtVerify(
			token, Buffer.from(ENV.JWT_SECRET, "utf8"), { audience }
		)
		const parsed = apikey.parse(jwt.payload)
		return parsed
	} catch {
		return null
	}
}

// Credentials are missing or invalid
export function unauthorized(
	res: FastifyReply,
	realms: string | [string, ...string[]],
	message = "Missing or invalid credentials"
) {
	if (typeof realms === "string")
		realms = [ realms ]
	return res
		.header("WWW-Authenticate", realms.map(r => `Bearer realm="${r}"`).join(" "))
		.status(401)
		.send({
			statusCode: 401,
			error: "Unauthorized",
			message,
		})
}

// Credentials are valid but does not grant access to the requested resource
export function forbidden(
	res: FastifyReply,
	realms?: string | string[],
	message = "Agent is not authorized to access this resource"
) {
	if (typeof realms === "string")
		realms = [ realms ]
	return res
		.header("WWW-Authenticate", realms ? realms.map(r => `Bearer realm="${r}"`).join(" ") : "Bearer")
		.status(403)
		.send({
			statusCode: 403,
			error: "Forbidden",
			message,
		})
}

type RouteDescriptor<T> = TypedPropertyDescriptor<
	(req: FastifyRequest<T>, res: FastifyReply) => Promise<FastifyReply>
>;

async function authenticate(req: FastifyRequest, audience: string | string[]) {
	const authorization = req.headers["authorization"]
	// if no api key is provided then they are definitely not authed
	if (!authorization)
		return false
	if (!authorization.startsWith("Bearer "))
		return false

	try {
		const token = authorization.slice("Bearer ".length)
		const data = await parseJWT(token, audience)
		if (!data)
			return false
		const community = await CommunityModel.findOne({
			id: data.sub,
		})
		if (!community)
			return false

		// if the community's tokens are invalid after the token was issued, the token is invalid
		if (community.tokenInvalidBefore.valueOf() > data.iat.valueOf())
			return false

		req.requestContext.set("community", community)
		req.requestContext.set("authType", data.aud)

	} catch (e) {
		return false
	}

	return true
}

export function Authenticate<T extends RouteGenericInterface>(
	_target: unknown,
	_propertyKey: unknown,
	descriptor: RouteDescriptor<T>,
): RouteDescriptor<T> {
	const originalRoute = descriptor.value
	assert(originalRoute)
	descriptor.value = async function(...args) {
		const [ req, res ] = args
		if (!await authenticate(req, [ "private", "master" ]))
			return unauthorized(res, [ "private", "master" ])

		return originalRoute.apply(this, args)
	}
	return descriptor
}

/**
 * If no authentication is provided, it will continue executing response. If a wrong one is provided, it will return a 401
 */
export function OptionalAuthenticate<T extends RouteGenericInterface>(
	_target: unknown,
	_propertyKey: unknown,
	descriptor: RouteDescriptor<T>,
): RouteDescriptor<T> {
	const originalRoute = descriptor.value
	assert(originalRoute)
	descriptor.value = async function(...args) {
		const [ req, res ] = args
		if (req.headers["authorization"] && !await authenticate(req, [ "private", "master" ]))
			return unauthorized(res, [ "private", "master" ])

		return originalRoute.apply(this, args)
	}
	return descriptor
}

export function MasterAuthenticate<T extends RouteGenericInterface>(
	_target: unknown,
	_propertyKey: unknown,
	descriptor: RouteDescriptor<T>,
): RouteDescriptor<T> {
	const originalRoute = descriptor.value
	assert(originalRoute)
	descriptor.value = async function(...args) {
		const [ req, res ] = args
		if (!await authenticate(req, "master"))
			return unauthorized(res, "master")

		return originalRoute.apply(this, args)
	}
	return descriptor
}
