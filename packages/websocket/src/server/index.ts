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
		this.client.send({
			messageId: messageId,
			messageType: "message",
			data: JSON.stringify(data),
		})
	}

	/**
	 * Respond to a message from the client by it's message ID
	 */
	respond(messageId: string, data: any) {
		this.client.send({
			messageId,
			messageType: "response",
			data: JSON.stringify(data),
		})
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

type WebSocketServerTypes = {
	connection: (
		this: WebSocketServer,
		socket: WebSocketClient,
		request: IncomingMessage
	) => void
	error: (this: WebSocketServer, error: Error) => void
	headers: (this: WebSocketServer, headers: { [key: string]: string }) => void
	close: (this: WebSocketServer) => void
	listening: (this: WebSocketServer) => void
	message: (this: WebSocketServer, socket: WebSocketClient) => void
}

class WebSocketServer extends TypedEventEmmiter<WebSocketServerTypes> {
	private server: WebSocket.Server
	constructor(options?: WebSocket.ServerOptions) {
		super()
		this.server = new WebSocket.Server(options)
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
}

export default WebSocketServer
