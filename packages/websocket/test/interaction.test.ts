import WebSocket from "ws"
import { Client, Server } from "../src"
import TypedEventEmmiter from "../src/common/TypedEventEmmiter"
import { WebSocketEvents } from "../src/client"
import WebSocketServer, { WebSocketServerEvents } from "../src/server"
import pEvent from "../src/common/promisifyEvent"

const promisifyEvent = <
	T extends Record<string | symbol, (...args: any[]) => any>,
	E extends keyof T
>(
	event: E,
	emmiter: TypedEventEmmiter<T>
): Promise<Parameters<T[E]>> => {
	return new Promise((resolve) => {
		// @ts-expect-error
		emmiter.prependOnceListener(event, (...args) => resolve(args))
	})
}

describe("Interaction", () => {
	let server: Server
	let client: Client
	beforeEach(async () => {
		server = new Server({ port: 0 })
		await pEvent(server, "listening")
		const address = server.address()
		client = new Client(
			typeof address == "string"
				? address
				: `ws://localhost:${address.port}`,
			undefined,
			{
				WebSocket: WebSocket,
			}
		)
		await pEvent(client, "connected")
	})
	afterEach(async () => {
		server.close()
		client.close()
		await pEvent(server, "close")
	})

	it("Server should receive the message sent by the client", async () => {
		const message = {
			hello: "world",
		}
		const messageId = client.send(message)
		const [_, serverMessage] = await promisifyEvent<
			WebSocketServerEvents,
			"message"
		>("message", server)

		// the ID of the message should be the same on the client and the server
		expect(serverMessage.messageId).toBe(messageId)
		// the received message contents should be the same as the sent contents
		expect(message).toEqual(serverMessage.data)
	})
	it("Server should send an acknowledgement message", async () => {
		const message = {
			hello: "world",
		}
		const messageId = client.send(message)
		const [_, serverMessage] = await pEvent<
			WebSocketServerEvents,
			Server,
			"message"
		>(server, "message")
		const [acknowledgeMessagedId] = await pEvent<
			WebSocketEvents,
			Client,
			"acknowledged"
		>(client, "acknowledged")

		// the ID of the message should be the same on the client and the server
		expect(serverMessage.messageId).toBe(messageId)
		// the sent message ID should be the ID of the acknowledged message
		expect(acknowledgeMessagedId).toBe(messageId)
		// the received message contents should be the same as the sent contents
		expect(message).toEqual(serverMessage.data)
	})
})
