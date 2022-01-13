import { EventEmitter } from "events"
import WebSocket from "isomorphic-ws"
import ReconnectingWebSocket from "reconnecting-websocket"
import {
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
	GuildConfigChangedMessage,
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
	guildConfigChanged: (message: GuildConfigChangedMessage) => void
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
	private socket: ReconnectingWebSocket
	private opts: WebSockethandlerOpts
	private guildIDs: string[]
	private socketurl: string

	constructor(opts: WebSockethandlerOpts) {
		super()
		this.opts = opts
		this.guildIDs = []

		// don't create the websocket if it has not been enabled

		this.socketurl = this.opts.uri

		this.socket = new ReconnectingWebSocket(() => this.socketurl, undefined, {
			WebSocket: WebSocket,
			startClosed: true
		})

		if (this.opts.enabled) this.socket.reconnect()
		
		// handle socket messages
		this.socket.onmessage = (msg) => {
			try {
				this.handleMessage(JSON.parse(msg.data as string))
			} catch (e) {
				console.error(e)
			}
		}
		this.socket.onerror = console.error
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
		switch (messageType) {
		case "guildConfigChanged":
			this.emit(
				"guildConfigChanged",
				message as unknown as GuildConfigChangedMessage
			)
			break
		case "report": {
			const toSendMessage = message as unknown as ReportCreatedMessage
			toSendMessage.report.reportedTime = new Date(toSendMessage.report.reportedTime)
			this.emit("report", toSendMessage as ReportCreatedMessage)
			break
		}
		case "revocation": {
			const toSendMessage = message as unknown as RevocationMessage
			toSendMessage.revocation.reportedTime = new Date(toSendMessage.revocation.reportedTime)
			toSendMessage.revocation.revokedTime = new Date(toSendMessage.revocation.revokedTime)
			this.emit("revocation", toSendMessage)
			break
		}
		case "ruleCreated":
			this.emit(
				"ruleCreated",
				message as unknown as RuleCreatedMessage
			)
			break
		case "ruleUpdated":
			this.emit(
				"ruleUpdated",
				message as unknown as RuleUpdatedMessage
			)
			break
		case "ruleRemoved":
			this.emit(
				"ruleRemoved",
				message as unknown as RuleRemovedMessage
			)
			break
		case "rulesMerged":
			this.emit(
				"rulesMerged",
				message as unknown as RulesMergedMessage
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
		case "communityUpdated":
			this.emit(
				"communityUpdated",
				message as unknown as CommunityUpdatedMessage
			)
			break
		case "communitiesMerged":
			this.emit(
				"communitiesMerged",
				message as unknown as CommunitiesMergedMessage
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

	close(): void {
		this.socket.close()
	}

	open(): void {
		this.socket.reconnect()
	}

	setUrl(url: string): void {
		this.socket.close()
		this.socketurl = url
		this.socket.reconnect()
	}

	destroy(): void {
		this.socket.close()
	}
}
export default WebSocketHandler
