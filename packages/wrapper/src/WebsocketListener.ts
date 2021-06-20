import { EventEmitter } from "events"
import WebSocket from "ws"
import { CommunityConfig, Revocation, Rule, Report } from "./types"

// some typescript stuff so it is strictly typed
export interface WebSockethandlerOpts {
	uri: string
	disabled?: boolean
}
export type WebSocketMessageType =
	| "guildConfig"
	| "report"
	| "revocation"
	| "ruleCreated"
	| "ruleRemoved"
export interface WebSocketMessage {
	messageType: WebSocketMessageType
	[key: string]: string | boolean | number
}
export declare interface WebSocketEvents {
	"guildConfig": (message: CommunityConfig) => void
	"report": (message: Report) => void
	"revocation": (message: Revocation) => void
	"ruleCreated": (message: Rule) => void
	"ruleRemoved": (message: Rule) => void
}

declare interface WebSocketHandler {
	on<E extends keyof WebSocketEvents>(event: E, listener: WebSocketEvents[E]): this
	off<E extends keyof WebSocketEvents>(event: E, listener: WebSocketEvents[E]): this
	once<E extends keyof WebSocketEvents>(event: E, listener: WebSocketEvents[E]): this
	emit<E extends keyof WebSocketEvents>(event: E, ...args: Parameters<WebSocketEvents[E]>): boolean;
}

class WebSocketHandler extends EventEmitter {
	private socket: WebSocket
	private opts: WebSockethandlerOpts
	public guildid: string

	constructor(opts: WebSockethandlerOpts) {
		super()
		this.opts = opts

		// don't create the websocket if it has been set to be disabled
		if (opts.disabled) return

		this.socket = new WebSocket(this.opts.uri)

		// handle socket messages
		this.socket.on("message", (msg) => {
			this.handleMessage(JSON.parse(msg.toString("utf-8")))
		})

		// auto-reconnect for socket
		this.socket.on("close", () => {
			const recconect = setInterval(() => {
				if (this.socket.readyState === this.socket.OPEN) {
					console.log("connected")
					return clearInterval(recconect)
				}
				// if not connected, try connecting again
				try {
					this.socket = new WebSocket(opts.uri)
					// eslint-disable-next-line no-empty
				} catch (e) { }
				console.log("reconnection attempt")
			}, 5000)
		})
	}
	handleMessage(message: WebSocketMessage): void {
		const toEmit = message
		delete toEmit.messageType
		switch (message.messageType) {
		case "guildConfig": this.emit("guildConfig", toEmit as unknown as CommunityConfig); break
		case "report": this.emit("report", toEmit as unknown as Report); break
		case "revocation": this.emit("revocation", toEmit as unknown as Revocation); break
		case "ruleCreated": this.emit("ruleCreated", toEmit as unknown as Rule); break
		case "ruleRemoved": this.emit("ruleRemoved", toEmit as unknown as Rule); break
		}
	}
	setGuildID(guildId: string): void {
		this.socket?.send(Buffer.from(JSON.stringify({
			guildId: guildId
		})))
	}
}
export default WebSocketHandler