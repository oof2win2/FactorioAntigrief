import { FactorioServerType } from "./base/database"

export type ServerSyncedBan = {
	playername: string
	reason: string | null
	byPlayer: string | null
}

export type ServerSyncedUnban = {
	playername: string
	reason: string | null
	byPlayer: string | null
}

export type BaseAction<T> = {
	receivedAt: Date
	actionType: string
	action: T
	server: FactorioServerType
}

export type ServerSyncedAction =
	| BaseAction<ServerSyncedBan>
	| BaseAction<ServerSyncedUnban>
