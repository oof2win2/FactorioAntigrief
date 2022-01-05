import ENV from "../src/utils/env.js"
import mongoose from "mongoose"
import backend from "../src/app.js"

mongoose.connect(ENV.MONGOURI, {
	ignoreUndefined: true,
	loggerLevel: "info"
}) // connect to db before loading other stuff

const start = async () => {
	try {
		await backend.listen(ENV.API_PORT, ENV.API_HOST)

		const address = backend.server.address()
		const port = typeof address === "string" ? address : address?.port
		console.log(`Server listening on :${port}`)
	} catch (err) {
		console.error(err)
		process.exit(1)
	}
}
start()

export default backend


// afterAll(() => {
// 	backend.close()
// 	process.exit()
// })