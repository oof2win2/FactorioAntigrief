import EventEmitter from "events"
import { FactorioServerType } from "./database"
import { Tail } from "tail"
import path from "path"
import ENV from "../utils/env"
import { existsSync } from "fs"
import { BaseAction, ServerSyncedBan, ServerSyncedUnban } from "../types"

export declare interface ServerSyncedActionHandlerActions {
	ban: (ban: BaseAction<ServerSyncedBan>) => void
	unban: (unban: BaseAction<ServerSyncedUnban>) => void
}

declare interface ServerSyncedActionHandler {
	on<E extends keyof ServerSyncedActionHandlerActions>(
		event: E,
		listener: ServerSyncedActionHandlerActions[E]
	): this
	off<E extends keyof ServerSyncedActionHandlerActions>(
		event: E,
		listener: ServerSyncedActionHandlerActions[E]
	): this
	once<E extends keyof ServerSyncedActionHandlerActions>(
		event: E,
		listener: ServerSyncedActionHandlerActions[E]
	): this
	emit<E extends keyof ServerSyncedActionHandlerActions>(
		event: E,
		...args: Parameters<ServerSyncedActionHandlerActions[E]>
	): boolean
}

const removeStringSpeechmarks = (value: string) => {
	return value.substring(1, value.length - 1)
}

class ServerSyncedActionHandler extends EventEmitter {
	private tails: Tail[] = []

	readonly Regexes: Record<keyof ServerSyncedActionHandlerActions, RegExp> = {
		ban: /^ban,(\w+),(\w+)?,(".*")?$/,
		unban: /^unban,(\w+),(\w+)?,(".*")?$/,
	}

	constructor(private servers: FactorioServerType[]) {
		super()
		for (const server of this.servers) {
			if (!server.gatherActions) continue

			if (
				!server.absoluteServerPath &&
				(!ENV.SERVERFOLDERPATH || !server.serverFolderName)
			) {
				console.error(
					`Server ${server.servername} has no server path, but has action collection enabled`
				)
				continue
			}

			const serverDirPath =
				server.absoluteServerPath ||
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				path.join(ENV.SERVERFOLDERPATH, server.serverFolderName)

			const actionFilePath = path.join(
				serverDirPath,
				server.actionFilePath
			)

			if (!existsSync(actionFilePath)) {
				console.error(
					`Server ${server.servername} has no action file at ${actionFilePath}`
				)
				continue
			}

			const tail = new Tail(actionFilePath)
			tail.on("line", (line) => this.handleLine(server, line))
			this.tails.push(tail)
		}
	}

	/**
	 * Parse a line from the action file and emit the appropriate event
	 * @param server Information about the server
	 * @param line The line to parse
	 * @returns False if parsed unsuccessfully, otherwise a result
	 */
	handleLine(
		server: FactorioServerType,
		line: string
	): false | (BaseAction<ServerSyncedBan> | BaseAction<ServerSyncedUnban>) {
		let result: BaseAction<ServerSyncedBan> | BaseAction<ServerSyncedUnban>
		try {
			for (const [name, regex] of Object.entries(this.Regexes)) {
				const match = regex.exec(line)
				if (!match) continue

				const [, player, admin, reason] = match

				result = {
					receivedAt: new Date(),
					actionType: name as keyof ServerSyncedActionHandlerActions,
					action: {
						playername: player,
						byPlayer: admin ? admin : null,
						reason: reason ? removeStringSpeechmarks(reason) : null,
					},
					server,
				}
				this.emit(
					name as keyof ServerSyncedActionHandlerActions,
					result
				)
				return result
			}

			console.error(
				`Unknown action type ${line.split(",")[0]} for server ${
					server.servername
				}`
			)
			return false
		} catch (error) {
			console.error(
				`Error parsing action line from server ${server.servername}: ${line}`
			)
			return false
		}

		return result
	}
}

export default ServerSyncedActionHandler
