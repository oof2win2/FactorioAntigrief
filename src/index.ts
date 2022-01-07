import ENV from "./utils/env.js"
import mongoose from "mongoose"
import fastify from "./app.js"
import { client } from "./utils/discord.js"

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
	} catch (err) {
		console.error(err)
		process.exit(1)
	}
}
start()

export default fastify