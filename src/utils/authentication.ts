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

export const createApikey = async (cId: string | Community, audience: "master" | "private" = "private") => {
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

export const Authenticate = <
	T extends RouteGenericInterface = RouteGenericInterface
>(
		_target: unknown,
		_propertyKey: unknown,
		descriptor: TypedPropertyDescriptor<
		(req: FastifyRequest<T>, res: FastifyReply) => Promise<FastifyReply>
	>
	): TypedPropertyDescriptor<
	(req: FastifyRequest<T>, res: FastifyReply) => Promise<FastifyReply>
> => {
	// a bit of magic to get the request and response
	const originalRoute = descriptor.value
	if (!originalRoute) return descriptor
	descriptor.value = async (...args) => {
		const [ req, res ] = args
		const auth = req.headers["authorization"]
		// if no api key is provided then they are definitely not authed
		if (!auth)
			return res.status(401).send({
				statusCode: 401,
				error: "Unauthorized",
				message: "Your API key is invalid",
			})
		// token (JWT)
		else if (auth.startsWith("Bearer ")) {
			try {
				const token = auth.slice("Bearer ".length)
				const rawData = await jose.jwtVerify(token, Buffer.from(ENV.JWT_SECRET, "utf8"))
				const parsedData = apikey.safeParse(rawData.payload)
				if (!parsedData.success) return res.status(401).send({
					statusCode: 401,
					error: "Unauthorized",
					message: "Your API key is invalid",
				})
				const community = await CommunityModel.findOne({
					id: parsedData.data.sub,
				})
				if (!community)
					return res.status(401).send({
						statusCode: 401,
						error: "Unauthorized",
						message: "Your API key is invalid",
					})
				
				// if the community's tokens are invalid after the token was issued, the token is invalid
				if (community.tokenInvalidBefore.valueOf() > parsedData.data.iat.valueOf())
					return res.status(401).send({
						statusCode: 401,
						error: "Unauthorized",
						message: "Your API key is invalid",
					})

				req.requestContext.set("community", community)
				req.requestContext.set("authType", parsedData.data.aud)

				// run the rest of the route handler
				return originalRoute.apply(this, args)
			} catch (e) {
				return res.status(401).send({
					statusCode: 401,
					error: "Unauthorized",
					message: "Your API key is invalid",
				})
			}
		}
		// if it is something else then it's invalid
		return res.status(401).send({
			statusCode: 401,
			error: "Unauthorized",
			message: "Your API key is invalid",
		})
	}
	return descriptor
}

/**
 * If no authentication is provided, it will continue executing response. If a wrong one is provided, it will return a 401
 */
export const OptionalAuthenticate = <
T extends RouteGenericInterface = RouteGenericInterface
>(
		_target: unknown,
		_propertyKey: unknown,
		descriptor: TypedPropertyDescriptor<
	(req: FastifyRequest<T>, res: FastifyReply) => Promise<FastifyReply>
>
	): TypedPropertyDescriptor<
(req: FastifyRequest<T>, res: FastifyReply) => Promise<FastifyReply>
> => {
// a bit of magic to get the request and response
	const originalRoute = descriptor.value
	if (!originalRoute) return descriptor
	descriptor.value = async (...args) => {
		const [ req, res ] = args
		const auth = req.headers["authorization"]
		// if no api key is provided then they are definitely not authed
		if (!auth)
			return originalRoute.apply(this, args)
		// token (JWT)
		else if (auth.startsWith("Bearer ")) {
			try {
				const token = auth.slice("Bearer ".length)
				const rawData = await jose.jwtVerify(token, Buffer.from(ENV.JWT_SECRET, "utf8"))
				const parsedData = apikey.safeParse(rawData.payload)
				if (!parsedData.success) return res.status(401).send({
					statusCode: 401,
					error: "Unauthorized",
					message: "Your API key is invalid",
				})
				const community = await CommunityModel.findOne({
					id: parsedData.data.sub,
				})
				if (!community)
					return res.status(401).send({
						statusCode: 401,
						error: "Unauthorized",
						message: "Your API key is invalid",
					})
			
				// if the community's tokens are invalid after the token was issued, the token is invalid
				if (community.tokenInvalidBefore.valueOf() > parsedData.data.iat.valueOf())
					return res.status(401).send({
						statusCode: 401,
						error: "Unauthorized",
						message: "Your API key is invalid",
					})

				req.requestContext.set("community", community)
				req.requestContext.set("authType", parsedData.data.aud)

				// run the rest of the route handler
				return originalRoute.apply(this, args)
			} catch (e) {
				return res.status(401).send({
					statusCode: 401,
					error: "Unauthorized",
					message: "Your API key is invalid",
				})
			}
		}
		return originalRoute.apply(this, args)
	}
	return descriptor
}

export const MasterAuthenticate = <
	T extends RouteGenericInterface = RouteGenericInterface
>(
		_target: unknown,
		_propertyKey: unknown,
		descriptor: TypedPropertyDescriptor<
		(req: FastifyRequest<T>, res: FastifyReply) => Promise<FastifyReply>
	>
	): TypedPropertyDescriptor<
	(req: FastifyRequest<T>, res: FastifyReply) => Promise<FastifyReply>
> => {
	const originalRoute = descriptor.value
	if (!originalRoute) return descriptor
	descriptor.value = async (...args) => {
		const [ req, res ] = args
		// return originalRoute.apply(this, args)
		const auth = req.headers["authorization"]
		if (!auth)
			return res.status(401).send({
				statusCode: 401,
				error: "Unauthorized",
				message: "Your Master API key is invalid",
			})
		// token (JWT)
		else if (auth.startsWith("Bearer ")) {
			try {
				const token = auth.slice("Bearer ".length)
				const rawData = await jose.jwtVerify(token, Buffer.from(ENV.JWT_SECRET, "utf8"))
				const parsedData = apikey.safeParse(rawData.payload)
				if (!parsedData.success) return res.status(401).send({
					statusCode: 401,
					error: "Unauthorized",
					message: "Your API key is invalid",
				})
				if (parsedData.data.aud !== "master")
					return res.status(401).send({
						statusCode: 401,
						error: "Unauthorized",
						message: "Your API key is invalid",
					})

				const community = await CommunityModel.findOne({
					id: parsedData.data.sub,
				})
				if (!community)
					return res.status(401).send({
						statusCode: 401,
						error: "Unauthorized",
						message: "Your API key is invalid",
					})
			
				// if the community's tokens are invalid after the token was issued, the token is invalid
				if (community.tokenInvalidBefore.valueOf() > parsedData.data.iat.valueOf())
					return res.status(401).send({
						statusCode: 401,
						error: "Unauthorized",
						message: "Your API key is invalid",
					})

				req.requestContext.set("community", community)
				req.requestContext.set("authType", parsedData.data.aud)

				// run the rest of the route handler
				return originalRoute.apply(this, args)
			} catch (e) {
				return res.status(401).send({
					statusCode: 401,
					error: "Unauthorized",
					message: "Your API key is invalid",
				})
			}
		}
		// if it is something else then it's invalid
		return res.status(401).send({
			statusCode: 401,
			error: "Unauthorized",
			message: "Your Master API key is invalid",
		})
	}
	return descriptor
}
