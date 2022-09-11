type ServerSyncedBan = {
	playername: string
	reason: string | null
	byPlayer: string | null
}

type ServerSyncedUnban = {
	playername: string
	reason: string | null
	byPlayer: string | null
}

type BaseAction<T> = {
	receivedAt: Date
	actionType: string
	action: T
}

type ServerSyncedAction =
	| BaseAction<ServerSyncedBan>
	| BaseAction<ServerSyncedUnban>
