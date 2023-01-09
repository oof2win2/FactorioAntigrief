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

// The bit indexes of different actions. Used to store the actions in a single number, for ease of adding more actions later
export enum FDGLCategoryAction {
	FactorioMessage = 0,
	DiscordMessage = 1,
	FactorioBan = 2,
	CustomCommand = 3,
}
export type FDGLCategoryHandler = {
	createAction: FDGLCategoryAction[]
	revokeAction: FDGLCategoryAction[]
	createCustomCommand: string | null
	revokeCustomCommand: string | null
	clearCustomCommand: string | null
}
