// import WebSocket, { EventEmitter } from "ws"

declare module "ws" {
	interface WebSocket {
		guildId: string
	}
}

// WebSocket.prototype.guildId = string