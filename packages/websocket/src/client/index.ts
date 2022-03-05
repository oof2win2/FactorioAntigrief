import ReconnectingWebSocket, {
	UrlProvider,
	Options,
} from "reconnecting-websocket"
import TypedEventEmmiter from "../common/TypedEventEmmiter"
import { generateId } from "../common/utils"

export interface Opts extends Options {}

export type MessageType = string | ArrayBuffer | Blob | ArrayBufferView

export type WebSocketEvents = {
	connected: () => void
	disconnected: () => void
	/**
	 * When a message is acknowledged by the server
	 */
	acknowledged: (messageId: string) => void
	/**
	 * When an error during parsing of a message occurs
	 */
	error: (error: { error: unknown; data: unknown }) => void
	/**
	 * When a message is received by the server
	 */
	message: (messageId: string, message: any) => void
	/**
	 * When a response to a message is received by the server
	 */
	response: (messageId: string, message: any) => void
	/**
	 * When a message fails to receive a response from the server.
	 * The message will however be sent at the earliest possible date
	 */
	failed: (messageId: string, data: any) => void
}

interface Message {
	/**
	 * the message's ID
	 */
	id: string
	/**
	 * the actual data that was sent
	 */
	data: MessageType
	/**
	 * a unix timestamp in ms
	 */
	sentAt: number
}
interface UnsentMessage {
	/**
	 * the message's ID
	 */
	id: string
	/**
	 * the actual data that was sent
	 */
	data: MessageType
	/**
	 * message hasnt been sent yet
	 */
	sentAt: null
}

class Client extends TypedEventEmmiter<WebSocketEvents> {
	private messageQueue = [] as UnsentMessage[]
	private expectedMessages: Map<string, Message> = new Map()
	private ws: ReconnectingWebSocket
	/**
	 * Whether the client is connected to the server
	 */
	connected: boolean = false
	/**
	 * Amount of messages that have failed to be sent in the past 5 minutes
	 */
	failedMessages = 0

	/**
	 * The ID of the client, as defined by the server
	 */
	private _clientId: string | null = null
	/**
	 * Rooms that the client is in
	 */
	private _clientRooms: string[] = []

	constructor(
		url: UrlProvider,
		protocols?: string | string[],
		options?: Opts
	) {
		super()
		this.ws = new ReconnectingWebSocket(url, protocols, options)

		this.ws.addEventListener("open", () => {
			this.connected = true
			this.emit("connected")
			if (this._clientId)
				this.send(
					JSON.stringify({
						messageType: "initialize",
						clientId: this._clientId,
						clientRooms: this._clientRooms,
					})
				)
		})
		this.ws.addEventListener("close", () => {
			this.connected = false
			this.emit("disconnected")
		})

		this.ws.addEventListener("message", (message) =>
			this.parseMessage(message)
		)

		// a failed message is counted by anything that doesn't get an acknowledgement response
		const clearFailedMessages = setInterval(() => {
			this.failedMessages = 0
		}, 10 * 60 * 1000)

		// get the messages that have so far not had an acknowledgement response from the server
		const manageFailedMessages = setInterval(
			() => this.manageFailedMessages(),
			60 * 1000
		)
		// ensure that the timeout is unreffed in node but nothing in browser, as browser doesn't need an unref
		const sendMessages = setInterval(() => this.sendMessages(), 1000)

		// unref all timers
		;[clearFailedMessages, manageFailedMessages, sendMessages].forEach(
			(timer) => {
				if (typeof timer.unref === "function") timer.unref()
			}
		)
	}

	/**
	 * Sends or queues a message to be sent to the server
	 * @param data Data to send to the WS server
	 * @returns The ID of the message
	 */
	send(data: any): string {
		const messageId = generateId(12)
		if (this.connected) {
			this.ws.send(
				JSON.stringify({
					messageType: "message",
					messageId: messageId,
					data: data,
				})
			)

			this.expectedMessages.set(messageId, {
				id: messageId,
				data,
				sentAt: Date.now(),
			})
		} else {
			this.messageQueue.push({
				id: messageId,
				data,
				sentAt: null,
			})
		}
		return messageId
	}

	/**
	 * Send messages from the queue to the server
	 */
	private sendMessages() {
		if (!this.connected) return
		// if there are no messages to send, then don't send
		if (this.messageQueue.length === 0) return
		// keep sending messages until there are 4mb queued
		while (this.ws.bufferedAmount < 4e6) {
			const message = this.messageQueue.shift()
			// no more messages to be sent, so stop
			if (!message) break
			// send the message to the server
			this.ws.send(
				JSON.stringify({
					messageType: "message",
					messageId: message.id,
					data: message.data,
				})
			)
			// add the message to the expected messages
			this.expectedMessages.set(message.id, {
				...message,
				sentAt: Date.now(),
			})
		}
	}

	/**
	 * Check through messages that were supposed receive acknowledgements and make sure that they all have received them
	 * Emits a failed event if a message has failed to receive an acknowledgement within 5 minutes of being sent
	 * The message is however still sent at the earliest possible date
	 */
	private manageFailedMessages() {
		this.expectedMessages.forEach((message) => {
			// if the message has been sent for more than 5 minutes without a response, it is considered failed
			if (Date.now() - message.sentAt > 5 * 60 * 1000) {
				this.failedMessages++
				// remove the message from the map of expected messages and rather add it to the message queue
				this.expectedMessages.delete(message.id)
				this.messageQueue.push({
					...message,
					sentAt: null,
				})
				this.emit("failed", message.id, message.data)
			}
		})
	}

	/**
	 * Parses a message from the server
	 */
	private parseMessage(raw: MessageEvent<any>): void {
		if (typeof raw.data !== "string") return
		let data
		try {
			data = JSON.parse(raw.data)
		} catch {
			this.emit("error", {
				error: "Invalid JSON",
				data: raw.data,
			})
			return
		}
		// "data" is guaranteed to be valid JSON now

		// the property "acknowledgingId" can be present to acknowledge a response to a message, but the message can have other data as well
		if (data.acknowledgingId) {
			// the server has acknowledged a message to be received, so we can remove it from handling here
			this.expectedMessages.delete(data.acknowledgingId)
			// useful for debugging. doesn't need to be listened to
			this.emit("acknowledged", data.acknowledgingId)
		}

		try {
			switch (data.messageType) {
				case "initialize":
					// an initialization message is sent by the server to the client
					// usually only on establishing a connection
					this._clientId = data.clientId
					this._clientRooms = data.clientRooms
					break
				case "acknowledgement":
					// the message was only an acknowledgement, which has been handled already
					// nothing to do here
					break
				case "message":
					// an actual message was received from the server
					this.emit("message", data.messageId, data.data)
					break
				case "response":
					// a response to a request was received
					this.emit("response", data.messageId, data.data)
					break
			}
		} catch (e) {
			this.emit("error", {
				error: e,
				data: data,
			})
		}
	}

	close() {
		this.ws.close()
	}
}

export default Client
