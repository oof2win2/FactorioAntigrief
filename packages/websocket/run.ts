import CommonClient, { MessageType } from "./src/common/CommonClient"
import { promisifyEvent } from "@oof2win2/promisify-event"
import WebSocket from "ws"

const run = async () => {
	const server = new WebSocket.Server({
		port: 0,
	})

	const address = server.address()

	let ws: WebSocket
	if (typeof address == "string") {
		ws = new WebSocket(address)
	} else {
		ws = new WebSocket(`ws://localhost:${address.port}`)
	}

	const client = new CommonClient(ws)

	await promisifyEvent(server, "connection")
	const message = {
		messageType: "message",
		data: "hello world!",
	}
	const event = promisifyEvent(client, "message")
	;[...server.clients][0].send(JSON.stringify(message))
	console.log(await event, [message])
}
run()
