import backend from "../src/app"
import * as mockingoose from "mockingoose"

beforeAll(async () => {
	await backend.listen(0)
})

beforeEach(() => {
	mockingoose.resetAll()
})

afterAll(async () => {
	await backend.close()
})

export default backend
