import WebSocket, { RawData } from "ws"
import { TypedEventEmitter } from "@oof2win2/promisify-event"
import MessageType, { RequestMessage, Message, ResponseMessage } from "./types"

export type CommonSocketClientEvents = {
	unacknowledgedMessage: (message: MessageType) => void
	message: (message: Message) => void
	/**
	 * Heartbeat message, containing the last sequence that was received
	 */
	heartbeat: (lastSeq: number) => void
	/**
	 * A request has been received from the other end of the connection
	 */
	request: (message: RequestMessage) => void
	response: (message: ResponseMessage) => void
	connected: () => void
	disconnected: () => void

	/**
	 * The peer has requested to start a heartbeat
	 */
	peerStartHeartbeat: () => void
	/**
	 * The peer has requested to stop a heartbeat
	 */
	peerStopHeartbeat: () => void
}

export default class CommonSocketClient extends TypedEventEmitter<CommonSocketClientEvents> {
	/**
	 * Sequence number of the last sent message. -1 if no message has been sent yet
	 * @default -1
	 */
	private _seq = -1
	/**
	 * Messages that have not yet been responded to
	 */
	private toReceiveResponse: MessageType[] = []
	/**
	 * Timestamp of the last received heartbeat
	 */
	private _lastHeartbeat = NaN
	/**
	 * Timestamp of the connection opening
	 */
	private openedTime = NaN
	private sweepInterval: NodeJS.Timeout
	private heartbeatTimer: NodeJS.Timeout
	/**
	 * the amount of delay between heartbeats
	 */
	private heartbeatInterval = 5e3
	/**
	 * amount of time after which the client should close the connection if no heartbeat was received from the server
	 */
	private heartbeatTimeout = 60e3

	constructor(private ws: WebSocket) {
		super()
		this.sweepInterval = setInterval(() => {
			this.sweepUnacknowledged()
		}, 3e6) // sweep the messages every 5 minutes

		this.ws.on("message", (message) => this.handleMessage(message))
		this.ws.on("open", () => {
			this.openedTime = Date.now()
			this.emit("connected")
		})
		this.ws.on("close", () => {
			// reset the opened time to NaN
			this.openedTime = NaN
			this.emit("disconnected")
		})

		this.heartbeatTimer = setInterval(() => {
			this.doHeartbeat()
		}, this.heartbeatInterval)

		if (typeof this.sweepInterval !== "number") {
			this.sweepInterval.unref()
			this.heartbeatTimer.unref()
		}
	}

	/**
	 * Send a message to the connection
	 * @param data Data to send. Must be serializable with JSON.stringify
	 */
	message(data: any) {
		const message: MessageType = {
			messageType: "message",
			seq: this._seq++,
			data: data,
			sentAt: Date.now(),
		}
		this.ws.send(JSON.stringify(message))
		this.toReceiveResponse.push(message)
	}

	/**
	 * Send a request to the server
	 * @param data Data to request with
	 */
	request(data: any): Promise<MessageType> {
		const message: MessageType = {
			messageType: "message",
			seq: this._seq++,
			data: data,
			sentAt: Date.now(),
		}
		this.ws.send(JSON.stringify(message))
		this.toReceiveResponse.push(message)

		return new Promise((resolve, reject) => {
			// this handler magic is used to remove the event listener when the promise is resolved or rejected
			const combinedHandler = (msg: MessageType) => {
				if (msg.messageType === "response") {
					if (msg.requestId !== message.seq) return
					this.removeListener("response", combinedHandler)
					this.removeListener(
						"unacknowledgedMessage",
						combinedHandler
					)
					resolve(msg)
				} else {
					// handler for
					if (msg.seq !== message.seq) return
					this.removeListener("response", combinedHandler)
					this.removeListener(
						"unacknowledgedMessage",
						combinedHandler
					)
					reject(msg)
				}
			}

			this.on("response", combinedHandler)
			this.on("unacknowledgedMessage", combinedHandler)
		})
	}

	/**
	 * Handle an acknowledgement message
	 * @param seq Sequence number of the message that has been acknowledged
	 */
	private handleAcknowledge(seq: number) {
		const index = this.toReceiveResponse.findIndex(
			(message) => message.seq === seq
		)
		if (index > -1) {
			this.toReceiveResponse.splice(index, 1)
		}
	}

	private sweepUnacknowledged() {
		this.toReceiveResponse = this.toReceiveResponse.filter((message) => {
			// 5 minutes have not yet passed since the message was sent
			if (message.sentAt + 3e6 > Date.now()) return true
			this.emit("unacknowledgedMessage", message)
			return false
		})
	}

	/**
	 * Handle a message received from the connection, such as requests, responses, closures etc.
	 * Should be extended to handle client-specific messages
	 */
	protected handleMessage(msg: RawData | string) {
		let message: MessageType
		try {
			message = JSON.parse(
				typeof msg == "string" ? msg : msg.toString("utf8")
			)
			// TODO: use zod to validate the message later
		} catch {
			// errors will be ignored
			return
		}
		switch (message.messageType) {
			case "message":
				this.emit("message", message)
				break
			case "heartbeat":
				this._lastHeartbeat = Date.now()
				this.emit("heartbeat", message.seq)
				break
			case "acknowledge":
				this.handleAcknowledge(message.seq)
				break
			case "request":
				this.emit("request", message)
				break
			case "response":
				this.emit("response", message)
				break
		}
	}

	/**
	 * Perform the actual heartbeat every few seconds
	 */
	private doHeartbeat() {
		// if the connection is not open, we can't send a heartbeat
		if (this.ws.readyState !== WebSocket.OPEN || isNaN(this.openedTime))
			return
		// if the last received heartbeat is older than the max allowed time, emit an event and close the connection
		if (this._lastHeartbeat + this.heartbeatTimeout < Date.now()) {
			this.ws.close()
			return
		}

		this.ws.send(
			JSON.stringify({
				messageType: "heartbeat",
				sentAt: Date.now(),
				seq: this._seq,
				data: null,
			})
		)
	}

	/**
	 * Sequence ID of the last sent message. -1 if no message has been sent yet
	 * @default -1
	 */
	get seq() {
		return this._seq
	}

	/**
	 * The timestamp of when the last heartbeat was received. NaN if no heartbeat has been received
	 * @default NaN
	 */
	get lastHeartbeat() {
		return this._lastHeartbeat
	}

	destroy() {
		clearInterval(this.heartbeatInterval)
		clearInterval(this.sweepInterval)
		this.ws.close()
	}
}
