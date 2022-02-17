import { FastifyReply, FastifyRequest } from "fastify"
import { GET, RequestHandler } from "fastify-decorators"
import type { WebSocket } from "ws"
import { WsClient } from "../utils/info"

@GET({
	url: "/ws",
	options: {
		websocket: true,
		schema: {
			hide: true,
		},
	},
})
export default class WsHandler extends RequestHandler {
	constructor(first: FastifyRequest, second: FastifyReply) {
		super(first, second)
		// fastify-websocket changes the arguments received by the handler
		const ws = first.socket as unknown as WebSocket
		const request = second as unknown as FastifyRequest
		void request

		void new WsClient(ws)
	}

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	async handle() {}
}
