import { EventEmitter } from "events"
import WebSocket from "ws"
import { CommunityConfig, Revocation, Rule, Violation } from "./types"

// some typescript stuff so it is strictly typed
export interface WebSockethandlerOpts {
	uri: string
}
export type WebSocketMessageType = 
	| "guildConfig"
	| "violation"
	| "revocation"
	| "ruleCreated"
	| "ruleRemoved"
export interface WebSocketMessage {
	messageType: WebSocketMessageType
	[key: string]: string|boolean|number
}
export declare interface WebSocketEvents {
    "guildConfig": (message: CommunityConfig) => void
    "violation": (message: Violation) => void
    "revocation": (message: Revocation) => void
    "ruleCreated": (message: Rule) => void
    "ruleRemoved": (message: Rule) => void
}

declare interface WebSocketHandler {
    on<E extends keyof WebSocketEvents>(event: E, listener: WebSocketEvents[E]): this
    off<E extends keyof WebSocketEvents>(event: E, listener: WebSocketEvents[E]): this
    once<E extends keyof WebSocketEvents>(event: E, listener: WebSocketEvents[E]): this
    emit<E extends keyof WebSocketEvents>(event: E, ...args: Parameters<WebSocketEvents[E]>): boolean;
}

class WebSocketHandler extends EventEmitter {
    private socket: WebSocket
    private opts: WebSockethandlerOpts

    constructor(opts: WebSockethandlerOpts) {
        super()
        this.opts = opts
        this.socket = new WebSocket(opts.uri)

        // handle socket messages
        this.socket.on("message", (msg) => {
            this.handleMessage(JSON.parse(msg.toString("utf-8")))
        })

        this.socket.on("close", () => {
			const recconect = setInterval(() => {
				if (this.socket.readyState === this.socket.OPEN) {
					console.log("connected")
					return clearInterval(recconect)
				}
				// if not connected, try connecting again
				try {
					this.socket = new WebSocket(opts.uri)
				// eslint-disable-next-line no-empty
				} catch (e) {}
				console.log("reconnection attempt")
			}, 5000)
		})

        // auto-reconnect for socket
    }
    handleMessage(message: WebSocketMessage): void {
        const toEmit = message
        delete toEmit.messageType
        switch (message.messageType) {
            case "guildConfig": this.emit("guildConfig", toEmit as unknown as CommunityConfig); break;
            case "violation": this.emit("violation", toEmit as unknown as Violation); break;
            case "revocation": this.emit("revocation", toEmit as unknown as Revocation); break;
            case "ruleCreated": this.emit("ruleCreated", toEmit as unknown as Rule); break;
            case "ruleRemoved": this.emit("ruleRemoved", toEmit as unknown as Rule); break
        }
    }
}
export default WebSocketHandler