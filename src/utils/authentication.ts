import { FastifyPluginCallback, FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import fastifyPlugin from "fastify-plugin";
import AuthModel from "../database/fagc/authentication";
import CommunityModel from "../database/fagc/community";

// const Authenticate = async (
// 	req: FastifyRequest,
// 	res: FastifyReply,
// ) => {
// console.log({req})
// console.log(req.headers, "Headers")
// }
const Authenticate = (
	target: Object,
	propertyKey: string,
	descriptor: TypedPropertyDescriptor<(
		req: FastifyRequest,
		res: FastifyReply,
	) => any>,
) => {
	const originalRoute = descriptor.value
	if (!originalRoute) return
	descriptor.value = async (...args: [FastifyRequest, FastifyReply]) => {
		const [req, res] = args
		// return originalRoute.apply(this, args)
		const auth = req.headers["authorization"]
		if (!auth) return res.status(401).send({
			statusCode: 401,
			error: "Unauthorized",
			message: "Your API key was invalid"
		})
		if (auth.startsWith("Token ")) {
			const token = auth.slice("Token ".length)
			const authData = await AuthModel.findOne({ api_key: token })
			const community = await CommunityModel.findOne({ _id: authData?.communityId })
			if (!community) return res.status(401).send({
				statusCode: 401,
				error: "Unauthorized",
				message: "Your API key was invalid"
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
			message: "Your API key was invalid"
		})
	}
	return descriptor
}
export default Authenticate