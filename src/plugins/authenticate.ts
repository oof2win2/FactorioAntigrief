import { FastifyPluginCallback, FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import fastifyPlugin from "fastify-plugin";
import AuthModel from "../database/fagc/authentication";
import CommunityModel from "../database/fagc/community";

const authentication = async (
	req: FastifyRequest,
	res: FastifyReply,
) => {
	console.log(req.headers, "Headers")
	const auth = req.headers["authorization"]
	if (!auth) return
	if (auth.startsWith("Token ")) {
		const token = auth.slice("Token ".length)
		const community = await AuthModel.findOne({ api_key: token })
		if (!community) return
		req.requestContext.set("community", community)
	}
	if (auth.startsWith("Bearer ")) {
		// Bearer auth from users or something
	}
}
export default authentication