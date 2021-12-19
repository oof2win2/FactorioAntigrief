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
	| "guildConfigChanged"
	| "report"
	| "revocation"
	| "ruleCreated"
	| "ruleRemoved"
	| "ruleUpdated"
	| "communityCreated"
	| "communityRemoved"
	| "communityUpdated"
	| "announcement"
	| "reconnecting"
	| "connected"
export interface WebSocketMessage {
	messageType: WebSocketMessageType
	[key: string]: string | boolean | number
}
export declare interface WebSocketEvents {
	guildConfigChanged: (message: GuildConfig) => void
	report: (message: ReportCreatedMessage) => void
	revocation: (message: RevocationMessage) => void
	ruleCreated: (message: RuleCreatedMessage) => void
	ruleRemoved: (message: RuleRemovedMessage) => void
	ruleUpdated: (message: RuleCreatedMessage) => void
	communityCreated: (message: CommunityCreatedMessage) => void
	communityRemoved: (message: CommunityRemovedMessage) => void
	communityUpdated: (message: CommunityCreatedMessage) => void

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
	private socket!: WebSocket
	private opts: WebSockethandlerOpts

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
		const newMessage: Omit<WebSocketMessage, "messageType"> = message
		delete newMessage.messageType
		switch (messageType) {
		case "guildConfigChanged":
			this.emit(
				"guildConfigChanged",
				newMessage as unknown as GuildConfig
			)
			break
		case "report":
			this.emit("report", newMessage as unknown as ReportCreatedMessage)
			break
		case "revocation":
			this.emit("revocation", newMessage as unknown as RevocationMessage)
			break
		case "ruleCreated":
			this.emit(
				"ruleCreated",
				newMessage as unknown as RuleCreatedMessage
			)
			break
		case "ruleUpdated":
			this.emit(
				"ruleUpdated",
				newMessage as unknown as RuleCreatedMessage
			)
			break
		case "ruleRemoved":
			this.emit(
				"ruleRemoved",
				newMessage as unknown as RuleRemovedMessage
			)
			break
		case "communityCreated":
			this.emit(
				"communityCreated",
				newMessage as unknown as CommunityCreatedMessage
			)
			break
		case "communityRemoved":
			this.emit(
				"communityRemoved",
				newMessage as unknown as CommunityRemovedMessage
			)
			break
		case "communityUpdated":
			this.emit(
				"communityUpdated",
				newMessage as unknown as CommunityCreatedMessage
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
