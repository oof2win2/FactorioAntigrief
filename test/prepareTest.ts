import ENV from "../src/utils/env.js"
import mongoose from "mongoose"
import backend from "../src/app.js"

mongoose.connect(ENV.MONGOURI, {
	ignoreUndefined: true,
	loggerLevel: "info"
}) // connect to db before loading other stuff

export default backend

// afterAll(() => {
// 	backend.close()
// 	process.exit()
// })
