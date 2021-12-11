import { FactorioServerType } from "./database"
import { Rcon } from "rcon-client"
import FAGCBot from "./FAGCBot"
import ENV from "../utils/env"

interface RCONResponse {
	response: string
	server: FactorioServerType
}

interface Connection {
	rcon: Rcon
	server: FactorioServerType
}

export default class RCONInterface {
	private servers: FactorioServerType[]
	private client: FAGCBot
	private connections: Connection[]
	constructor(client: FAGCBot, servers: FactorioServerType[]) {
		this.client = client
		this.servers = servers
		this.servers.map((_, i) => this.initServer(i))
		this.connections = []
	}
	private initServer(index: number) {
		const server = this.servers[index]
		const connection = new Rcon({
			host: "127.0.0.1",
			port: server.rconPort,
			password: server.rconPassword,
		})
		connection.connect()
		this.connections.push({
			server: server,
			rcon: connection
		})
		// reconnection utility
		connection.on("end", () => {
			let i = 0
			const interval = setInterval(async () => {
				try {
					await connection.connect()
					clearInterval(interval)
					const channel = this.client.channels.resolve(ENV.ERRORCHANNELID)
					if (!channel || !channel.isNotDMChannel()) return
					channel.send(
						`Server <#${server.discordChannelID}> has reconnected to RCON`
					)
				} catch {
					i++
					if (i === 5) {
						const channel = this.client.channels.resolve(ENV.ERRORCHANNELID)
						if (!channel || !channel.isNotDMChannel()) return
						channel.send(
							`Server <#${server.discordChannelID}> is having RCON issues`
						)
					}
					if (i === 60) {
						// 60 attempts = 15 minutes since 1 every 15s, 15*60 = 900s
						// most likely failed
						clearInterval(interval)
						const channel = this.client.channels.resolve(ENV.ERRORCHANNELID)
						if (!channel || !channel.isNotDMChannel()) return
						channel.send(
							`Server <#${server.discordChannelID}> has been unable to connect to RCON`
						)
					}
				}
			}, 15*1000)
		})
	}
	/**
	 * 
	 * @param command RCON command, automatically is prefixed with / if it is not provided
	 * @param serverIdentifier Server name or Discord channel ID to find server with
	 */
	async rconCommand(command: string, serverIdentifier: string): Promise<RCONResponse|false> {
		command = command.startsWith("/") ? command : `/${command}`
		const server = this.connections.find((s) => s.server.servername === serverIdentifier || s.server.discordChannelID === serverIdentifier)
		if (!server) return false
		const response = await server.rcon.send(command).catch(() => {})
		if (!response) return false
		return {
			response: response,
			server: server.server
		}
	}

	async rconCommandGuild(command: string, guildID: string) {
		command = command.startsWith("/") ? command : `/${command}`
		const servers = this.servers
			.map(s => s.discordGuildID === guildID ? s : undefined)
			.filter(r=>r !== undefined) as FactorioServerType[]
		const responses = await Promise.all(
			servers.map(server => this.rconCommand(command, server.servername))
		)
		return responses
	}

	async rconCommandAll(command: string) {
		command = command.startsWith("/") ? command : `/${command}`
		const responses = await Promise.all(
			this.servers.map(server => this.rconCommand(command, server.servername))
		)
		return responses
	}
}