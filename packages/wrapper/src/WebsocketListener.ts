import { EventEmitter } from "events"
// TODO: use reconnecting-websocket
import WebSocket from "isomorphic-ws"
import ReconnectingWebSocket from "reconnecting-websocket"
import {
	GuildConfig,
	CommunityCreatedMessage,
	ReportCreatedMessage,
	RevocationMessage,
	RuleCreatedMessage,
	RuleRemovedMessage,
	CommunityRemovedMessage,
	CommunityUpdatedMessage,
	CommunitiesMergedMessage,
	RuleUpdatedMessage,
	RulesMergedMessage,
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
	| "rulesMerged"
	| "communityCreated"
	| "communityRemoved"
	| "communityUpdated"
	| "communitiesMerged"
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
	ruleUpdated: (message: RuleUpdatedMessage) => void
	rulesMerged: (message: RulesMergedMessage) => void
	communityCreated: (message: CommunityCreatedMessage) => void
	communityRemoved: (message: CommunityRemovedMessage) => void
	communityUpdated: (message: CommunityUpdatedMessage) => void
	communitiesMerged: (message: CommunitiesMergedMessage) => void

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
	private socket!: ReconnectingWebSocket
	private opts: WebSockethandlerOpts
	private guildIDs: string[]

	constructor(opts: WebSockethandlerOpts) {
		super()
		this.opts = opts
		this.guildIDs = []

		if (!opts.enabled) return

		// don't create the websocket if it has not been enabled

		this.socket = new ReconnectingWebSocket(this.opts.uri, undefined, {
			WebSocket: WebSocket,
		})
		
		// handle socket messages
		this.socket.onmessage = (msg) => {
			this.handleMessage(JSON.parse(msg.data as string))
		}
		this.socket.onopen = () => {
			this.guildIDs.map((id) => {
				this.socket.send(
					JSON.stringify({
						type: "addGuildID",
						guildID: id,
					})
				)
			})
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
				newMessage as unknown as RuleUpdatedMessage
			)
			break
		case "ruleRemoved":
			this.emit(
				"ruleRemoved",
				newMessage as unknown as RuleRemovedMessage
			)
			break
		case "rulesMerged":
			this.emit(
				"rulesMerged",
				newMessage as unknown as RulesMergedMessage
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
				newMessage as unknown as CommunityUpdatedMessage
			)
			break
		case "communitiesMerged":
			this.emit(
				"communitiesMerged",
				newMessage as unknown as CommunitiesMergedMessage
			)
		}
	}
	addGuildID(guildID: string): void {
		if (this.guildIDs.includes(guildID)) return // don't do anything if it already is set
		// save guild id to list
		this.guildIDs.push(guildID)
		this.socket?.send(
			JSON.stringify({
				type: "addGuildID",
				guildID: guildID,
			})
		)
	}
	removeGuildID(guildID: string): void {
		if (!this.guildIDs.includes(guildID)) return // don't do anything if it isn't there
		// remove the id from local list & then send info to backend
		this.guildIDs = this.guildIDs.filter(id => id !== guildID)
		this.socket?.send(
			JSON.stringify({
				type: "removeGuildID",
				guildID: guildID,
			})
		)
	}
	destroy(): void {
		if (!this.opts.enabled) return

		this.socket.close()
	}
}
export default WebSocketHandler
