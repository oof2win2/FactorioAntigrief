import {Tail} from "tail"
import { FactorioServer } from "../types/types"
import FAGCBot from "./fagcbot"
import { PlayerJoin } from "./FAGCHandler"

interface LogPlayerJoin {
	type: "join"
	playerName: string
}
interface LogPlayerLeave {
	type: "leave"
	playerName: string
	reason: string
}

export class ServerHandler {
	private servers: FactorioServer[]
	private client: FAGCBot
	constructor(servers: FactorioServer[], client: FAGCBot) {
		this.servers = servers
		this.client = client
		
		this.servers.forEach(server => {
			const joinPath = new Tail(server.joinPath)
			joinPath.on("line", (line: string) => {
				const content: LogPlayerJoin|LogPlayerLeave = JSON.parse(line)
				if (content.type == "join")
					PlayerJoin(content.playerName, this.client)
			})
			const logPath = new Tail(server.logPath)
			logPath.on("line", (line: string) => {
				// check if the line matches a player joining regex (contains IP, port and username)
				// both ipv4 and ipv6 regex because why not
				const joinv4Regex = /for address \(IP ADDR:\({(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}:\d+}\)\), username \((\w+)\)./
				const joinv6Regex = /for address \(IP ADDR:\({(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])):\d+}\)\), username \((\w+)\)./
				if (line.match(joinv4Regex) || line.match(joinv6Regex))
					PlayerJoin(line.substring(line.indexOf("username (") + "username (".length, line.indexOf("). ")), this.client)
			})
		})

	}
}
export default ServerHandler
