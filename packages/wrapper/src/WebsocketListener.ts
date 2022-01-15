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
	BaseWebsocketMessage,
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

/**
 * @deprecated Use BaseWebsocketMessage instead
 */
export type WebSocketMessage = BaseWebsocketMessage

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
	private guildIds: string[]
	private socketurl: string

	constructor(opts: WebSockethandlerOpts) {
		super()
		this.opts = opts
		this.guildIds = []

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
				const parsed = BaseWebsocketMessage.safeParse(JSON.parse(msg.data as string))
				if (parsed.success) this.handleMessage(parsed.data)
			} catch (e) {
				console.error(e)
			}
		}
		this.socket.onerror = console.error
		this.socket.onopen = () => {
			this.guildIds.map((id) => {
				this.socket.send(
					JSON.stringify({
						type: "addGuildId",
						guildId: id,
					})
				)
			})
		}
	}

	handleMessage(message: BaseWebsocketMessage): void {
		const messageType = message.messageType
		switch (messageType) {
		case "guildConfigChanged": {
			const parsed = GuildConfigChangedMessage.safeParse(message)
			if (parsed.success)
				this.emit("guildConfigChanged", parsed.data as GuildConfigChangedMessage)
			break
		}
		case "report": {
			const parsed = ReportCreatedMessage.safeParse(message)
			if (parsed.success)
				this.emit("report", parsed.data as ReportCreatedMessage)
			break
		}
		case "revocation": {
			const parsed = RevocationMessage.safeParse(message)
			if (parsed.success)
				this.emit("revocation", parsed.data as RevocationMessage)
			break
		}
		case "ruleCreated": {
			const parsed = RuleCreatedMessage.safeParse(message)
			if (parsed.success)
				this.emit("ruleCreated", parsed.data as RuleCreatedMessage)
			break
		}
		case "ruleUpdated": {
			const parsed = RuleUpdatedMessage.safeParse(message)
			if (parsed.success)
				this.emit("ruleUpdated", parsed.data as RuleUpdatedMessage)
			break
		}
		case "ruleRemoved": {
			const parsed = RuleRemovedMessage.safeParse(message)
			if (parsed.success)
				this.emit("ruleRemoved", parsed.data as RuleRemovedMessage)
			break
		}
		case "rulesMerged": {
			const parsed = RulesMergedMessage.safeParse(message)
			if (parsed.success)
				this.emit("rulesMerged",parsed.data as RulesMergedMessage)
			break
		}
		case "communityCreated": {
			const parsed = CommunityCreatedMessage.safeParse(message)
			if (parsed.success)
				this.emit("communityCreated", parsed.data as CommunityCreatedMessage)
			break
		}
		case "communityRemoved": {
			const parsed = CommunityRemovedMessage.safeParse(message)
			if (parsed.success)
				this.emit("communityRemoved", parsed.data as CommunityRemovedMessage)
			break
		}
		case "communityUpdated": {
			const parsed = CommunityUpdatedMessage.safeParse(message)
			if (parsed.success)
				this.emit("communityUpdated", parsed.data as CommunityUpdatedMessage)
			break
		}
		case "communitiesMerged": {
			const parsed = CommunitiesMergedMessage.safeParse(message)
			if (parsed.success)
				this.emit("communitiesMerged", parsed.data as CommunitiesMergedMessage)
			break
		}
		}
	}

	addGuildId(guildId: string): void {
		if (this.guildIds.includes(guildId)) return // don't do anything if it already is set
		// save guild id to list
		this.guildIds.push(guildId)
		this.socket?.send(
			JSON.stringify({
				type: "addGuildId",
				guildId: guildId,
			})
		)
	}

	removeGuildId(guildId: string): void {
		if (!this.guildIds.includes(guildId)) return // don't do anything if it isn't there
		// remove the id from local list & then send info to backend
		this.guildIds = this.guildIds.filter(id => id !== guildId)
		this.socket?.send(
			JSON.stringify({
				type: "removeGuildId",
				guildId: guildId,
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
