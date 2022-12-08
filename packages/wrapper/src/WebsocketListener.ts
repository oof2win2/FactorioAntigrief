import { EventEmitter } from "events"
import WebSocket from "isomorphic-ws"
import ReconnectingWebSocket from "reconnecting-websocket"
import {
	CommunityCreatedMessage,
	ReportCreatedMessage,
	RevocationMessage,
	CategoryCreatedMessage,
	CategoryRemovedMessage,
	CommunityRemovedMessage,
	CommunityUpdatedMessage,
	CommunitiesMergedMessage,
	CategoryUpdatedMessage,
	CategoriesMergedMessage,
	GuildConfigChangedMessage,
	FilterObjectChangedMessage,
	BaseWebsocketMessage,
} from "@fdgl/types"

// some typescript stuff so it is strictly typed
export interface WebSockethandlerOpts {
	uri: string
	enabled?: boolean
}
export type WebSocketMessageType =
	| "guildConfigChanged"
	| "report"
	| "revocation"
	| "categoryCreated"
	| "categoryRemoved"
	| "categoryUpdated"
	| "categoriesMerged"
	| "communityCreated"
	| "communityRemoved"
	| "communityUpdated"
	| "communitiesMerged"
	| "filterObjectChanged"
	| "announcement"
	| "disconnected"
	| "connected"

/**
 * @deprecated Use BaseWebsocketMessage instead
 */
export type WebSocketMessage = BaseWebsocketMessage

export declare interface WebSocketEvents {
	guildConfigChanged: (message: GuildConfigChangedMessage) => void
	report: (message: ReportCreatedMessage) => void
	revocation: (message: RevocationMessage) => void
	categoryCreated: (message: CategoryCreatedMessage) => void
	categoryRemoved: (message: CategoryRemovedMessage) => void
	categoryUpdated: (message: CategoryUpdatedMessage) => void
	categoriesMerged: (message: CategoriesMergedMessage) => void
	communityCreated: (message: CommunityCreatedMessage) => void
	communityRemoved: (message: CommunityRemovedMessage) => void
	communityUpdated: (message: CommunityUpdatedMessage) => void
	communitiesMerged: (message: CommunitiesMergedMessage) => void
	filterObjectChanged: (message: FilterObjectChangedMessage) => void

	connected: (message: void) => void
	disconnected: (message: void) => void
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
	private _guildIds: string[] = []
	private _filterObjectIds: string[] = []
	private socketurl: string

	constructor(opts: WebSockethandlerOpts) {
		super()
		this.opts = opts

		// don't create the websocket if it has not been enabled

		this.socketurl = this.opts.uri

		this.socket = new ReconnectingWebSocket(
			() => this.socketurl,
			undefined,
			{
				WebSocket: WebSocket,
				startClosed: true,
			}
		)

		if (this.opts.enabled) this.socket.reconnect()

		// handle socket messages
		this.socket.onmessage = (msg) => {
			try {
				const parsed = BaseWebsocketMessage.safeParse(
					JSON.parse(msg.data as string)
				)
				if (parsed.success) this.handleMessage(parsed.data)
			} catch (e) {
				console.error(e)
			}
		}
		this.socket.onerror = console.error
		this.socket.onclose = () => {
			this.emit("disconnected")
		}
		this.socket.onopen = () => {
			this.emit("connected")
			this._guildIds.map((id) => {
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
					this.emit(
						"guildConfigChanged",
						parsed.data as GuildConfigChangedMessage
					)
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
			case "categoryCreated": {
				const parsed = CategoryCreatedMessage.safeParse(message)
				if (parsed.success)
					this.emit(
						"categoryCreated",
						parsed.data as CategoryCreatedMessage
					)
				break
			}
			case "categoryUpdated": {
				const parsed = CategoryUpdatedMessage.safeParse(message)
				if (parsed.success)
					this.emit(
						"categoryUpdated",
						parsed.data as CategoryUpdatedMessage
					)
				break
			}
			case "categoryRemoved": {
				const parsed = CategoryRemovedMessage.safeParse(message)
				if (parsed.success)
					this.emit(
						"categoryRemoved",
						parsed.data as CategoryRemovedMessage
					)
				break
			}
			case "categoriesMerged": {
				const parsed = CategoriesMergedMessage.safeParse(message)
				if (parsed.success)
					this.emit(
						"categoriesMerged",
						parsed.data as CategoriesMergedMessage
					)
				break
			}
			case "communityCreated": {
				const parsed = CommunityCreatedMessage.safeParse(message)
				if (parsed.success)
					this.emit(
						"communityCreated",
						parsed.data as CommunityCreatedMessage
					)
				break
			}
			case "communityRemoved": {
				const parsed = CommunityRemovedMessage.safeParse(message)
				if (parsed.success)
					this.emit(
						"communityRemoved",
						parsed.data as CommunityRemovedMessage
					)
				break
			}
			case "communityUpdated": {
				const parsed = CommunityUpdatedMessage.safeParse(message)
				if (parsed.success)
					this.emit(
						"communityUpdated",
						parsed.data as CommunityUpdatedMessage
					)
				break
			}
			case "communitiesMerged": {
				const parsed = CommunitiesMergedMessage.safeParse(message)
				if (parsed.success)
					this.emit(
						"communitiesMerged",
						parsed.data as CommunitiesMergedMessage
					)
				break
			}
			case "filterObjectChanged": {
				const parsed = FilterObjectChangedMessage.safeParse(message)
				if (parsed.success)
					this.emit(
						"filterObjectChanged",
						parsed.data as FilterObjectChangedMessage
					)
				break
			}
		}
	}

	get guildIds() {
		return this._guildIds
	}

	addGuildId(guildId: string): void {
		if (this._guildIds.includes(guildId)) return // don't do anything if it already is set
		// save guild id to list
		this._guildIds.push(guildId)
		this.socket?.send(
			JSON.stringify({
				type: "addGuildId",
				guildId: guildId,
			})
		)
	}

	removeGuildId(guildId: string): void {
		if (!this._guildIds.includes(guildId)) return // don't do anything if it isn't there
		// remove the id from local list & then send info to backend
		this._guildIds = this._guildIds.filter((id) => id !== guildId)
		this.socket?.send(
			JSON.stringify({
				type: "removeGuildId",
				guildId: guildId,
			})
		)
	}

	addFilterObjectId(filterObjectId: string): void {
		if (this._filterObjectIds.includes(filterObjectId)) return // don't do anything if it already is set
		// save filter object id to list
		this._filterObjectIds.push(filterObjectId)
		this.socket?.send(
			JSON.stringify({
				type: "addFilterObjectId",
				filterObjectId: filterObjectId,
			})
		)
	}

	removeFilterObjectId(filterObjectId: string): void {
		if (!this._filterObjectIds.includes(filterObjectId)) return // don't do anything if it isn't there
		// remove the id from local list & then send info to backend
		this._filterObjectIds = this._filterObjectIds.filter(
			(id) => id !== filterObjectId
		)
		this.socket?.send(
			JSON.stringify({
				type: "removeFilterObjectId",
				filterObjectId: filterObjectId,
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
