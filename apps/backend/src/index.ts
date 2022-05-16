import ENV from "./utils/env"
import mongoose from "mongoose"
import fastify from "./app"
import { client } from "./utils/discord"
import CommunityModel from "./database/community"
import { createApikey } from "./utils/authentication"
import fs from "fs/promises"
import FilterModel from "./database/filterobject"

mongoose.connect(ENV.MONGOURI, {
	ignoreUndefined: true,
	loggerLevel: "info",
}) // connect to db before loading other stuff

const start = async () => {
	try {
		await fastify.listen(ENV.API_PORT, ENV.API_HOST)

		const address = fastify.server.address()
		const port = typeof address === "string" ? address : address?.port
		console.log(`Server listening on :${port}`)

		await client.login(ENV.DISCORD_BOTTOKEN)

		const communityCount = await CommunityModel.countDocuments()
		if (communityCount == 0) {
			// need to create the first community as none exist, so that the api can be used
			const filterObject = await FilterModel.create({
				categoryFilters: [],
				communityFilters: [],
			})
			const community = await CommunityModel.create({
				name: "FAGC Master Community",
				contact: client.user?.id,
				filterObjectId: filterObject.id,
			})
			const apikey = await createApikey(community, community, "master")
			try {
				await fs.writeFile("./masterapikey.txt", apikey, {
					flag: "w",
					mode: process.platform === "win32" ? undefined : 0o600,
				})
				console.log(
					`Created first community ${community.id} with apikey written to ./masterapikey.txt, which has master API access. Be careful with sharing it.`
				)
			} catch (e) {
				console.log(
					`Failed to write master apikey for community ${community.id} to ./masterapikey.txt. It is: ||${apikey}|| (remove ||). Be careful with sharing it.`
				)
			}
		}
	} catch (err) {
		console.error(err)
		process.exit(1)
	}
}
start()

export default fastify
