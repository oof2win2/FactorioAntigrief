import { FastifyRequest, FastifyReply } from "fastify"
import { RouteGenericInterface } from "fastify/types/route"
import AuthModel from "../database/authentication"
import CommunityModel from "../database/community"
import { z } from "zod"
import * as jose from "jose"
import ENV from "./env"

export const apikey = z.object({
	cType: z.enum([ "master", "private" ]), // the type of API key, master api or only private
	cId: z.string(),
	iat: z.union([
		z.number().transform((x) => new Date(x * 1000)),
		z.date(),
	])
		.refine((x) => x.valueOf() < Date.now() + 1000) // must be in the past
	,
})
export type apikey = z.infer<typeof apikey>

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
				message: "Your API key was invalid",
			})
		// token (JWT)
		else if (auth.startsWith("Token ")) {
			const token = auth.slice("Token ".length)
			const rawData = await jose.jwtVerify(token, Buffer.from(ENV.JWT_SECRET, "utf8"))
			const parsedData = apikey.safeParse(rawData.payload)
			if (!parsedData.success) return res.status(401).send({
				statusCode: 401,
				error: "Unauthorized",
				message: "Your API key was invalid",
			})
			const community = await CommunityModel.findOne({
				id: parsedData.data.cId,
			})
			if (!community)
				return res.status(401).send({
					statusCode: 401,
					error: "Unauthorized",
					message: "Your API key was invalid",
				})
			
			// if the community's tokens are invalid after the token was issued, the token is invalid
			if (community.tokenInvalidBefore.valueOf() > parsedData.data.iat.valueOf())
				return res.status(401).send({
					statusCode: 401,
					error: "Unauthorized",
					message: "Your API key was invalid",
				})

			req.requestContext.set("community", community)

			// run the rest of the route handler
			return originalRoute.apply(this, args)
		}
		// if it is something else then it's invalid
		return res.status(401).send({
			statusCode: 401,
			error: "Unauthorized",
			message: "Your API key was invalid",
		})
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
				message: "Your Master API key was invalid",
			})
		if (auth.startsWith("Token ")) {
			const token = auth.slice("Token ".length)
			const authData = await AuthModel.findOne({
				api_key: token,
				api_key_type: "master",
			})
			if (!authData)
				return res.status(401).send({
					statusCode: 401,
					error: "Unauthorized",
					message: "Your API key was invalid",
				})
			const community = await CommunityModel.findOne({
				id: authData?.communityId,
			})
			if (!community)
				return res.status(401).send({
					statusCode: 401,
					error: "Unauthorized",
					message: "Your Master API key was invalid",
				})
			req.requestContext.set("community", community)
			return originalRoute.apply(this, args)
		}
		// else if (auth.startsWith("Bearer ")) {
		// 	// Bearer auth from users or something
		// }
		return res.status(401).send({
			statusCode: 401,
			error: "Unauthorized",
			message: "Your Master API key was invalid",
		})
	}
	return descriptor
}
