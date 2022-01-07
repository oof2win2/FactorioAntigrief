import ENV from "../src/utils/env.js"
import mongoose from "mongoose"
import backend from "../src/app.js"

jest.setTimeout(10000)
beforeAll(async () => {
	await mongoose.connect(ENV.MONGOURI, {
		ignoreUndefined: true,
		loggerLevel: "info"
	})

	await backend.listen(0);
})

afterAll(async () => {
	await backend.close()
	await mongoose.disconnect()

})

export default backend
