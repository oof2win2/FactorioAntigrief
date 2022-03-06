import TypedEventEmmiter from "./TypedEventEmmiter"

type MessageTypeEnum =
	| "message"
	| "heartbeat"
	| "acknowledge"
	| "request"
	| "response"

type BaseMessage = {
	messageType: MessageTypeEnum
	seq: number
	data: any
	sentAt: number
}

export type MessageType =
	| (BaseMessage & { messageType: Exclude<MessageTypeEnum, "response"> })
	| ({
			messageType: "response"
			requestId: number
	  } & BaseMessage)

export type CommonSocketClientEvents = {
	unacknowledgedMessage: (message: MessageType) => void
	message: (message: MessageType) => void
}

export default abstract class CommonSocketClient extends TypedEventEmmiter<CommonSocketClientEvents> {
	private _seq = 0
	private toReceiveResponse: MessageType[] = []
	private _lastHeartbeat: number = -1
	private intervals: NodeJS.Timeout[] = []
	private heartbeatTimer: NodeJS.Timeout | null = null
	/**
	 * the amount of delay between heartbeats
	 */
	private heartbeatInterval: number = 5e3
	/**
	 * amount of time after which the client should close the connection if no heartbeat was received from the server
	 */
	private heartbeatTimeout: number = 60e3

	constructor(private ws: WebSocket) {
		super()
		const sweepInterval = setInterval(() => {
			this.sweepUnacknowledged()
		}, 3e6) // sweep the messages every 5 minutes
		// unref if running in node
		this.intervals.push(sweepInterval)
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
			const messageHandler = (msg: MessageType) => {
				if (msg.messageType !== "response") return false
				if (msg.requestId !== message.seq) return false
				resolve(msg)
				return true
			}
			const unacknowledgedHandler = (msg: MessageType) => {
				if (msg.seq !== message.seq) return false
				reject(msg)
				return true
			}

			this.on("message", (msg) => {
				if (messageHandler(msg)) {
					this.off("message", messageHandler)
					this.off("unacknowledgedMessage", unacknowledgedHandler)
				}
			})
			this.on("unacknowledgedMessage", (msg) => {
				if (unacknowledgedHandler(msg)) {
					this.off("message", messageHandler)
					this.off("unacknowledgedMessage", unacknowledgedHandler)
				}
			})
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
	 */
	abstract handleMessage(message: MessageType): void

	/**
	 * Perform the actual heartbeat every few seconds
	 */
	private doHeartbeat() {
		// if the last received heartbeat is older than the max allowed time, emit an event and close the connection
		if (this._lastHeartbeat + this.heartbeatTimeout < Date.now()) {
			this.ws.close()
		}
	}

	/**
	 * Start sending heartbeats
	 */
	startHeartbeat() {
		this.heartbeatTimer = setInterval(() => {
			this.doHeartbeat()
		}, this.heartbeatInterval)
	}

	/**
	 * Sequence ID of the last message
	 */
	get seq() {
		return this._seq
	}

	/**
	 * The timestamp of when the last heartbeat was received
	 */
	get lastHeartbeat() {
		return this._lastHeartbeat
	}
}
