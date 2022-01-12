import ENV from "../src/utils/env"
import mongoose from "mongoose"
import backend from "../src/app"

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
