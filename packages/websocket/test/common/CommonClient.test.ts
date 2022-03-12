import CommonClient from "../../src/common/CommonClient"
import { promisifyEvent } from "@oof2win2/promisify-event"
import WebSocket from "ws"
import {
	HeartbeatMessage,
	RequestMessage,
	ResponseMessage,
} from "../../src/common/types"

describe("CommonClient", () => {
	let client: CommonClient
	let ws: WebSocket
	let server: WebSocket.Server
	beforeEach(async () => {
		server = new WebSocket.Server({
			port: 0,
		})

		const address = server.address()

		if (typeof address == "string") {
			ws = new WebSocket(address)
		} else {
			ws = new WebSocket(`ws://localhost:${address.port}`)
		}

		client = new CommonClient(ws)
		await promisifyEvent(server, "connection")
	})
	afterEach((done) => {
		ws.close()
		server.close()
		server.once("close", () => done())
	})
	it("Should emit a message event if a message is received from the server", async () => {
		const message = {
			messageType: "message",
			data: "hello world!",
		}
		const event = promisifyEvent(client, "message")
		;[...server.clients][0].send(JSON.stringify(message))
		expect(await event).toEqual([message])
	})
	it("Should change last heartbeat once a heartbeat message is received from the server", async () => {
		const lastSeq = 1
		const message: HeartbeatMessage = {
			messageType: "heartbeat",
			seq: lastSeq,
			sentAt: Date.now(),
			data: null,
		}
		const event = promisifyEvent(client, "heartbeat")
		;[...server.clients][0].send(JSON.stringify(message))
		expect(await event).toEqual([lastSeq])
		expect(client.lastHeartbeat).not.toBe(-1)
		// the heartbeat should be set to the time it was received
		expect(client.lastHeartbeat).toBeGreaterThan(Date.now() - 1000)
	})
	it("Should emit a request event if a request is received", async () => {
		const message: RequestMessage = {
			messageType: "request",
			seq: 1,
			data: "getClientCount",
			sentAt: Date.now() - 1000,
		}

		const event = promisifyEvent(client, "request")
		;[...server.clients][0].send(JSON.stringify(message))
		expect(await event).toEqual([message])
	})
	it("Should emit a response event if a response is received", async () => {
		const message: ResponseMessage = {
			messageType: "response",
			seq: 2,
			data: "hello world!",
			sentAt: Date.now(),
			requestId: 1,
		}
		const event = promisifyEvent(client, "response")
		;[...server.clients][0].send(JSON.stringify(message))
		expect(await event).toEqual([message])
	})
	it("Should be able to request data", async () => {
		await promisifyEvent(client, "connected")
		const serverClient = [...server.clients][0]
		serverClient.on("message", (msg) => {
			const message = JSON.parse(msg.toString())
			expect(message.data).toBe("getClientCount")
			const response: ResponseMessage = {
				messageType: "response",
				seq: 1,
				data: 1,
				requestId: message.seq,
				sentAt: Date.now(),
			}
			serverClient.send(JSON.stringify(response))
		})

		const response = await client.request("getClientCount")
		expect(response.data).toBe(1)
	})
})
