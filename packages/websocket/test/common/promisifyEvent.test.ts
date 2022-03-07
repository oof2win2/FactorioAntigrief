import TypedEventEmitter from "../../src/common/TypedEventEmmiter"
import promisifyEvent from "../../src/common/promisifyEvent"

type EmitterTypes = {
	event: (data: string) => void
}
class Emitter extends TypedEventEmitter<EmitterTypes> {
	constructor() {
		super()
	}
}

describe("promisifyEvent", () => {
	let emitter: Emitter
	beforeEach(() => {
		emitter = new Emitter()
	})
	it("Should await an event if it is emmited", async () => {
		const preEmit = "foo"

		setTimeout(() => {
			emitter.emit("event", preEmit)
		}, 10)

		const [data] = await promisifyEvent(emitter, "event")
		// the emitted data should be the same as the data that should have been emitted
		expect(data).toEqual(preEmit)
	})
})
