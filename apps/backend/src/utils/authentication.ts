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
	 * aud | Audience - type of API key, master, reports, or bpt
	 * master: can do CRUD operations on communities and categories
	 * reports: can do CURD operations on reports only
	 * bot: can only read, implemented for auth of clientside bots
	 */
	aud: z.enum(["master", "reports"]),
	/**
	 * sub | Subject - the community ID or discord guild ID
	 */
	sub: z.string(),

	/**
	 * act | Actor - the person that this token is issued to
	 */
	act: z.string(),

	/**
	 * iat | Issued At - the time the token was issued
	 */
	iat: z
		.union([z.number().transform((x) => new Date(x * 1000)), z.date()])
		.refine((x) => x.valueOf() < Date.now() + 1000), // must be in the past
})
export type apikey = z.infer<typeof apikey>

/**
 * Create a FAGC API key
 * @param cId Community (ID) or guild ID that this key is for
 * @param act Discord user that the API key is for. Can be community, as it maps to the contact
 * @param audience The type of API key that this is
 */
export async function createApikey(
	cId: string | Community,
	act: string | Community,
	audience: apikey["aud"]
) {
	const apikey = await new jose.SignJWT({
		act: typeof act === "string" ? act : act.contact, // actor, the discord ID of the person it is for
	})
		.setIssuedAt() // for validating when the token was issued
		.setProtectedHeader({
			// encoding method
			alg: "HS256",
		})
		.setSubject(typeof cId === "string" ? cId : cId.id) // community which it is issued to
		.setAudience(audience) // audience, what is it for
		.sign(Buffer.from(ENV.JWT_SECRET, "utf8")) // sign the token itself and get an encoded string back
	return apikey
}

export async function parseJWT(
	token: string,
	audience: string | string[]
): Promise<apikey | null> {
	try {
		const jwt = await jose.jwtVerify(
			token,
			Buffer.from(ENV.JWT_SECRET, "utf8"),
			{ audience }
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
	if (typeof realms === "string") realms = [realms]
	return res
		.header(
			"WWW-Authenticate",
			realms.map((r) => `Bearer realm="${r}"`).join(" ")
		)
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
	if (typeof realms === "string") realms = [realms]
	return res
		.header(
			"WWW-Authenticate",
			realms
				? realms.map((r) => `Bearer realm="${r}"`).join(" ")
				: "Bearer"
		)
		.status(403)
		.send({
			statusCode: 403,
			error: "Forbidden",
			message,
		})
}

type RouteDescriptor<T> = TypedPropertyDescriptor<
	(req: FastifyRequest<T>, res: FastifyReply) => Promise<FastifyReply>
>

async function authenticate(req: FastifyRequest, audience: string | string[]) {
	const authorization = req.headers["authorization"]
	// if no api key is provided then they are definitely not authed
	if (!authorization) return false
	if (!authorization.startsWith("Bearer ")) return false

	try {
		const token = authorization.slice("Bearer ".length)
		const data = await parseJWT(token, audience)
		if (!data) return false

		const community = await CommunityModel.findOne({
			contact: data.act,
			id: data.sub,
		})
		if (!community) return false

		// if the community's tokens are invalid after the token was issued, the token is invalid
		if (community.tokenInvalidBefore.valueOf() > data.iat.valueOf())
			return false

		req.requestContext.set("auth", {
			authType: data.aud,
			community,
		})
	} catch (e) {
		return false
	}

	return true
}

export function Authenticate<T extends RouteGenericInterface>(
	_target: unknown,
	_propertyKey: unknown,
	descriptor: RouteDescriptor<T>
): RouteDescriptor<T> {
	const originalRoute = descriptor.value
	assert(originalRoute)
	descriptor.value = async function (...args) {
		const [req, res] = args
		// we require the API key to be reports or master, as public has no write access to most stuff
		if (!(await authenticate(req, ["reports", "master"])))
			return unauthorized(res, ["reports", "master"])

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
	descriptor: RouteDescriptor<T>
): RouteDescriptor<T> {
	const originalRoute = descriptor.value
	assert(originalRoute)
	descriptor.value = async function (...args) {
		const [req, res] = args
		if (
			req.headers["authorization"] &&
			!(await authenticate(req, ["reports", "master"]))
		)
			return unauthorized(res, ["reports", "master"])

		return originalRoute.apply(this, args)
	}
	return descriptor
}

export function MasterAuthenticate<T extends RouteGenericInterface>(
	_target: unknown,
	_propertyKey: unknown,
	descriptor: RouteDescriptor<T>
): RouteDescriptor<T> {
	const originalRoute = descriptor.value
	assert(originalRoute)
	descriptor.value = async function (...args) {
		const [req, res] = args
		if (!(await authenticate(req, "master")))
			return unauthorized(res, "master")

		return originalRoute.apply(this, args)
	}
	return descriptor
}
