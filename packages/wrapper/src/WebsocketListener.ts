import { EventEmitter } from "events"
import WebSocket from "isomorphic-ws"
import {
	GuildConfig,
	CommunityCreatedMessage,
	ReportCreatedMessage,
	RevocationMessage,
	RuleCreatedMessage,
	RuleRemovedMessage,
	CommunityRemovedMessage,
} from "fagc-api-types"

// some typescript stuff so it is strictly typed
export interface WebSockethandlerOpts {
	uri: string
	enabled?: boolean
}
export type WebSocketMessageType =
	| "communityConfigChanged"
	| "report"
	| "revocation"
	| "ruleCreated"
	| "ruleRemoved"
	| "communityCreated"
	| "communityRemoved"
	| "announcement"
	| "reconnecting"
	| "connected"
export interface WebSocketMessage {
	messageType: WebSocketMessageType
	[key: string]: string | boolean | number
}
export declare interface WebSocketEvents {
	communityConfigChanged: (message: GuildConfig) => void
	report: (message: ReportCreatedMessage) => void
	revocation: (message: RevocationMessage) => void
	ruleCreated: (message: RuleCreatedMessage) => void
	ruleRemoved: (message: RuleRemovedMessage) => void
	communityCreated: (message: CommunityCreatedMessage) => void
	communityRemoved: (message: CommunityRemovedMessage) => void

	reconnecting: (message: void) => void
	connected: (message: void) => void
}

declare interface WebSocketHandler {
	on<E extends keyof WebSocketEvents>(
		event: E,
		listener: WebSocketEvents[E]
	): this
	off<E extends keyof WebSocketEvents>(
		event: E,
		listener: WebSocketEvents[E]
	): this
	once<E extends keyof WebSocketEvents>(
		event: E,
		listener: WebSocketEvents[E]
	): this
	emit<E extends keyof WebSocketEvents>(
		event: E,
		...args: Parameters<WebSocketEvents[E]>
	): boolean
}

class WebSocketHandler extends EventEmitter {
	private socket: WebSocket
	private opts: WebSockethandlerOpts
	public guildid: string

	constructor(opts: WebSockethandlerOpts) {
		super()
		this.opts = opts

		if (!opts.enabled) return

		// don't create the websocket if it has not been enabled

		this.socket = new WebSocket(this.opts.uri)

		// handle socket messages
		this.socket.onmessage = (msg) => {
			this.handleMessage(JSON.parse(msg.data as string))
		}

		// auto-reconnect for socket
		this.socket.onclose = () => {
			const recconect = setInterval(() => {
				if (this.socket.readyState === this.socket.OPEN) {
					this.emit("connected")
					return clearInterval(recconect)
				}
				// if not connected, try connecting again
				try {
					this.socket = new WebSocket(opts.uri)
					// eslint-disable-next-line no-empty
				} catch (e) {}
				this.emit("reconnecting")
			}, 5000)
		}
	}
	handleMessage(message: WebSocketMessage): void {
		const messageType = message.messageType
		delete message.messageType
		switch (messageType) {
			case "communityConfigChanged":
				this.emit(
					"communityConfigChanged",
					message as unknown as GuildConfig
				)
				break
			case "report":
				this.emit("report", message as unknown as ReportCreatedMessage)
				break
			case "revocation":
				this.emit("revocation", message as unknown as RevocationMessage)
				break
			case "ruleCreated":
				this.emit(
					"ruleCreated",
					message as unknown as RuleCreatedMessage
				)
				break
			case "ruleRemoved":
				this.emit(
					"ruleRemoved",
					message as unknown as RuleRemovedMessage
				)
				break
			case "communityCreated":
				this.emit(
					"communityCreated",
					message as unknown as CommunityCreatedMessage
				)
				break
			case "communityRemoved":
				this.emit(
					"communityRemoved",
					message as unknown as CommunityRemovedMessage
				)
				break
		}
	}
	setGuildID(guildId: string): void {
		this.socket?.send(
			Buffer.from(
				JSON.stringify({
					guildId: guildId,
				})
			)
		)
	}
	destroy(): void {
		if (!this.opts.enabled) return

		this.socket.removeAllListeners()
		this.socket.terminate()
	}
}
export default WebSocketHandler
