import WebSocket from "ws"
import { Duplex } from "stream"
import { IncomingMessage } from "http"
import TypedEventEmmiter from "../common/TypedEventEmmiter"
import { generateId } from "../common/utils"

class WebSocketClient {
	constructor(
		private client: WebSocket,
		private _clientId: string,
		private clientRooms: string[]
	) {}
	/**
	 * Send a new message to the client
	 */
	send(data: any) {
		const messageId = generateId(12)
		this.client.send(
			JSON.stringify({
				messageId: messageId,
				messageType: "message",
				data: JSON.stringify(data),
			})
		)
	}

	/**
	 * Respond to a message from the client by it's message ID
	 */
	respond(messageId: string, data: any) {
		this.client.send(
			JSON.stringify({
				messageId,
				messageType: "response",
				data: JSON.stringify(data),
			})
		)
	}

	/**
	 * Acknowledge a message
	 */
	acknowledge(messageId: string) {
		this.client.send(
			JSON.stringify({
				acknowledgingId: messageId,
				messageType: "acknowledgement",
			})
		)
	}

	/**
	 * Get the rooms that this client is in
	 */
	get rooms() {
		return this.clientRooms
	}

	/**
	 * Get the ID of this client
	 * @readonly
	 */
	get clientId() {
		return this._clientId
	}
}

export type WebSocketServerEvents = {
	connection: (
		this: WebSocketServer,
		socket: WebSocketClient,
		request: IncomingMessage
	) => void
	error: (this: WebSocketServer, error: Error) => void
	headers: (this: WebSocketServer, headers: { [key: string]: string }) => void
	close: (this: WebSocketServer) => void
	listening: (this: WebSocketServer) => void
	message: (
		this: WebSocketServer,
		socket: WebSocketClient,
		message: {
			messageId: string
			data: any
			messageType: "message" | "response"
		}
	) => void
}

class WebSocketServer extends TypedEventEmmiter<WebSocketServerEvents> {
	private server: WebSocket.Server
	constructor(options?: WebSocket.ServerOptions) {
		super()
		this.server = new WebSocket.Server(options)

		this.server.on("listening", () => this.emit("listening"))
		this.server.on("close", () => this.emit("close"))

		this.server.on("connection", (socket, incoming) => {
			const clientId = generateId(12)
			this.emit(
				"connection",
				new WebSocketClient(socket, clientId, []),
				incoming
			)
			socket.send(
				JSON.stringify({
					messageType: "initialize",
					clientId: clientId,
					clientRooms: [],
				})
			)
			socket.on("message", (data) => this.handleMessage(data, socket))
		})
	}
	address() {
		return this.server.address()
	}
	close(cb?: (err?: Error) => void): void {
		this.server.close(cb)
	}
	handleUpgrade(
		request: IncomingMessage,
		socket: Duplex,
		upgradeHead: Buffer,
		callback: (client: WebSocket, request: IncomingMessage) => void
	): void {
		this.server.handleUpgrade(request, socket, upgradeHead, callback)
	}
	shouldHandle(request: IncomingMessage): boolean | Promise<boolean> {
		return this.server.shouldHandle(request)
	}

	private handleMessage(message: WebSocket.RawData, client: WebSocket) {
		let data
		try {
			data = JSON.parse(message.toString("utf8"))
		} catch {
			return
		}
		const WS = new WebSocketClient(client, "data.clientId", [])

		switch (data.messageType) {
			case "message":
				// emit a message and send acknowledged
				this.emit("message", WS, data)
				WS.acknowledge(data.messageId)
				break
		}
	}
}

export default WebSocketServer
