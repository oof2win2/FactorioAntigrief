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

const banLineRegex = /ban;"\w+";("\w+")?;("\w+")?/
const unbanLineRegex = /unban;"\w+";("\w+")?;("\w+")?/
const removeStringSpeechmarks = (value: string) => {
	return value.substring(1, value.length - 1)
}

class ServerSyncedActionHandler extends EventEmitter {
	private tails: Tail[] = []
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
			// the line is basically csv
			const data = line.split(";")

			// the first item is the action type
			const actionType = data[0]
			switch (actionType) {
				case "ban":
					if (!banLineRegex.test(line))
						throw new Error("Invalid ban line format")
					result = {
						receivedAt: new Date(),
						actionType,
						action: {
							playername: removeStringSpeechmarks(data[1]),
							byPlayer: removeStringSpeechmarks(data[2]),
							reason: removeStringSpeechmarks(data[3]),
						},
						server,
					}
					this.emit("ban", result)
					break
				case "unban":
					if (!unbanLineRegex.test(line))
						throw new Error("Invalid unban line format")
					result = {
						receivedAt: new Date(),
						actionType,
						action: {
							playername: removeStringSpeechmarks(data[1]),
							byPlayer: removeStringSpeechmarks(data[2]),
							reason: removeStringSpeechmarks(data[3]),
						},
						server,
					}
					this.emit("unban", result)
					break
				default:
					console.error(
						`Unknown action type ${actionType} for server ${server.servername}`
					)
					return false
			}
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
