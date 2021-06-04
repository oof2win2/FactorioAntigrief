import Tail from "tail"
import servers from "../../servers"
import { FactorioServer } from "../types/types"
import { PlayerJoin } from "./FAGCHandler"

export class ServerHandler {
	private servers: FactorioServer[]
	constructor(servers: FactorioServer[]) {
		this.servers = servers
		
		this.servers.forEach(server => {
			const tail = new Tail(server.path)
			tail.on("line", (line: string) => {
				// check if the line matches a player joining regex (contains IP, port and username)
				const IPv4Regex = /(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}/gm
				const IPv6Regex = /(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))/gm
				const joinv4Regex = new RegExp(`for address \(IP ADDR:\({${IPv4Regex}:\d+}\)\), username \((\w+)\).`)
				const joinv6Regex = new RegExp(`for address \(IP ADDR:\({${IPv6Regex}:\d+}\)\), username \((\w+)\).`)
				if (line.match(joinv4Regex) || line.match(joinv6Regex))
					PlayerJoin(line.substring(line.indexOf("username (") + "username (".length, line.indexOf("). ")))
			})
		})

	}
}
export default (new ServerHandler(servers))