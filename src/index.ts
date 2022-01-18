import ENV from "./utils/env"
import mongoose from "mongoose"
import fastify from "./app"
import { client } from "./utils/discord"
import CommunityModel from "./database/community"
import { createApikey } from "./utils/authentication"

mongoose.connect(ENV.MONGOURI, {
	ignoreUndefined: true,
	loggerLevel: "info"
}) // connect to db before loading other stuff

const start = async () => {
	try {
		await fastify.listen(ENV.API_PORT, ENV.API_HOST)

		const address = fastify.server.address()
		const port = typeof address === "string" ? address : address?.port
		console.log(`Server listening on :${port}`)

		client.login(ENV.DISCORD_BOTTOKEN)

		const communityCount = await CommunityModel.countDocuments()
		if (communityCount == 0) {
			// need to create the first community as none exist, so that the api can be used
			const community = await CommunityModel.create({
				name: "FAGC Master Community",
				contact: client.user?.id
			})
			const apikey = await createApikey(community, "master")
			console.log(`Created first community ${community.id} with apikey ${apikey}, which has master API access. Be careful with sharing it.`)
		}
	} catch (err) {
		console.error(err)
		process.exit(1)
	}
}
start()

export default fastify