import { FactorioServerType } from "./database"
import { Rcon } from "rcon-client"
import FAGCBot from "./FAGCBot.js"
import ServerOnline from "../database/ServerOnline"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import handleMissedData from "../utils/functions/handleMissedData"
import splitIntoGroups from "../utils/functions/splitIntoGroups"

dayjs.extend(relativeTime)

interface RCONResponse {
	response: string
	server: FactorioServerType
}

interface Connection {
	rcon: Rcon
	server: FactorioServerType
}

export default class RconInterface {
	private servers: FactorioServerType[]
	private client: FAGCBot
	private connections: Connection[]
	/**
	 * Intervals of checking if a server is online
	 */
	private checkIntervals: Map<string, NodeJS.Timeout> = new Map()

	constructor(client: FAGCBot, servers: FactorioServerType[]) {
		this.client = client
		this.servers = servers
		this.connections = []

		this.servers.map((_, i) => this.initServer(i))
	}

	private async initServer(serverIndex: number) {
		const server = this.servers[serverIndex]
		if (!server) return
		const rcon = new Rcon({
			host: "127.0.0.1",
			port: server.rconPort,
			password: server.rconPassword,
		})
		try {
			await rcon.connect()
			this.markAsOnline(server)
			this.connections.push({
				rcon: rcon,
				server: server,
			})

			// reconnection mechanism
			rcon.on("end", () => {
				// firstly, mark the server as offline in the database so it can get appropriate FAGC commands
				// once it reconnects
				this.markAsOffline(server)
				this.reconnectRcon(rcon, server) // start the reconnection mechanism
				this.client.sendToErrorChannel(
					`Server <#${
						server.discordChannelId
					}> has dropped connection to RCON at <t:${Math.floor(
						Date.now() / 1000
					)}>`
				)
			})
		} catch (error) {
			// mechanism to reconnect to RCON after some time

			// firstly, mark the server as offline in the database so it can get appropriate FAGC commands
			// once it reconnects
			await this.markAsOffline(server)
			this.reconnectRcon(rcon, server) // start the reconnection mechanism
			this.client.sendToErrorChannel(
				`Server <#${
					server.discordChannelId
				}> has failed to initially connect to RCON at <t:${Math.floor(
					Date.now() / 1000
				)}>`
			)
		}
	}

	/**
	 * RCON server reconnection mechanism
	 */
	private reconnectRcon(rcon: Rcon, server: FactorioServerType) {
		// amount of seconds passed = amount of attempts * 15
		const attempts = [2, 4, 20, 40, 60, 120, 240, 720, 1440, 2880, 5760]

		let connectionAttempts = 0
		const startedAt = Date.now()
		const checkOnline = async () => {
			try {
				await rcon.connect()

				// if the server is online, remove the interval
				const interval = this.checkIntervals.get(server.servername)
				if (interval) {
					clearInterval(interval)
					this.checkIntervals.delete(server.servername)
				}

				await this.markAsOnline(server)
				// if the connection was successful, it would not error
				// if it failed, it would throw and be caught in the catch block
				this.client.sendToErrorChannel(
					`Server <#${
						server.discordChannelId
					}> has reconnected to RCON at <t:${Math.floor(
						Date.now() / 1000
					)}>, after ${dayjs(startedAt).fromNow(
						true
					)}. Synchronizing banlist`
				)

				const serversOnline = await this.client.db
					.getRepository(ServerOnline)
					.find()

				if (this.client.filterObject) {
					const newBans = await handleMissedData({
						server: serversOnline.find(
							(x) => x.name === server.servername
						)!,
						allServers: serversOnline,
						database: this.client.db,
						filter: this.client.filterObject,
					})

					// unbanning first
					for (const unban of splitIntoGroups(
						newBans.playersToUnban,
						500
					)) {
						await rcon.send(
							`/c ${unban
								.map((name) => `game.unban_player("${name}")`)
								.join(";")}`
						)
					}
					const toReban = [
						...newBans.privatebansToBan.filter((x) => x.reban),
						...newBans.reportsToBan.filter((x) => x.reban),
					]
					for (const unban of splitIntoGroups(toReban, 500)) {
						await rcon.send(
							`/c ${unban
								.map(
									(record) =>
										`game.unban_player("${record.playername}")`
								)
								.join(";")}`
						)
					}

					for (const ban of splitIntoGroups(
						newBans.privatebansToBan,
						500
					)) {
						await rcon.send(
							`/c ${ban
								.map(
									(record) =>
										`game.ban_player("${record.playername}", "${record.reason}")`
								)
								.join(";")}`
						)
					}

					for (const ban of splitIntoGroups(
						newBans.reportsToBan,
						500
					)) {
						await rcon.send(
							`/c ${ban
								.map((record) =>
									this.client.createBanCommand(record)
								)
								.join(";")}`
						)
					}
				}
				return
			} catch {
				connectionAttempts++
				// if the amount of connection attempts is equal to 48h, then set it to 1d to send the message again
				if (connectionAttempts === 11520) connectionAttempts = 5760
				// dayjs is used to get the relative time since the start of the reconnection attempts
				if (attempts.includes(connectionAttempts)) {
					this.client.sendToErrorChannel(
						`Server <#${
							server.discordChannelId
						}> has been unable to connect to RCON since ${dayjs(
							startedAt
						).fromNow()}`
					)
				}
			}
		}
		const interval = setInterval(checkOnline, 15 * 1000)
		this.checkIntervals.set(server.servername, interval)
	}

	/**
	 * Mark a server as online in the database
	 */
	private async markAsOnline(server: FactorioServerType) {
		await this.client.db
			.getRepository(ServerOnline)
			.createQueryBuilder()
			.insert()
			.values([
				{
					name: server.servername,
					isOnline: true,
				},
			])
			.orUpdate(["isOnline"])
			.execute()
	}

	/**
	 * Mark a server as offline in the database
	 */
	private async markAsOffline(server: FactorioServerType) {
		await this.client.db
			.getRepository(ServerOnline)
			.createQueryBuilder()
			.insert()
			.values([
				{
					name: server.servername,
					offlineSince: new Date(),
					isOnline: false,
				},
			])
			.orUpdate(["offlineSince", "isOnline"])
			.execute()
	}

	/**
	 * Send a RCON command to a specific server
	 * @param command RCON command, automatically is prefixed with / if it is not provided
	 * @param serverIdentifier Server name or Discord channel ID to find server with
	 */
	async rconCommand(
		command: string,
		serverIdentifier: string
	): Promise<RCONResponse | false> {
		command = command.startsWith("/") ? command : `/${command}`
		const server = this.connections.find(
			(s) =>
				s.server.servername === serverIdentifier ||
				s.server.discordChannelId === serverIdentifier
		)
		if (!server) return false
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		const response = await server.rcon.send(command).catch(() => {})
		if (!response) return false
		return {
			response: response,
			server: server.server,
		}
	}

	/**
	 * Send a command to all servers
	 */
	async rconCommandAll(command: string) {
		command = command.startsWith("/") ? command : `/${command}`
		const responses = await Promise.all(
			this.servers.map((server) =>
				this.rconCommand(command, server.servername)
			)
		)
		return responses
	}

	get offlineServerCount() {
		return this.checkIntervals.size
	}
}
