/**
 * @file RCON client manager for servers
 */
import { Snowflake, TextChannel } from "discord.js"
import { Rcon } from "rcon-client"
import { FactorioServer } from "../types/types"
import FAGCBot from "./fagcbot.js"
import config from "../config.js"
const { rconport, rconpw, errorchannel } = config
import servers from "../servers.js"


interface rconConfig {
	rconport: number,
	server: FactorioServer,
}
interface rconConnection {
	rcon: Rcon,
	server: FactorioServer,
}

interface RCONOutput {
	resp: string
	server: {
		name: string,
		discordid: string,
		discordname: string
	}
}

/**
 * @typedef {Object} RCONOutput
 * @property {(string|Error)} resp - RCON output or error
 * @property {Object} server - Server
 */
class rconInterface {
	/**
	 * RCON interface for servers
	 * @param {Object[]} rconConfig - Array of RCON configs
	 * @param {number} rconConfig.rconport - Port of RCON
	 * @param {Object} rconConfig.server - Server object from {@link ../servers.js}
	 */
	private rconConfig: rconConfig[]
	private rconConnections: rconConnection[]
	public client: FAGCBot
	constructor(rconConfig) {
		this.rconConfig = rconConfig
		this.rconConnections = []
		this._init()
	}
	_init() {
		if (!this.rconConfig) return console.log("no config")
		this.rconConfig.forEach(async (server) => {
			const rcon = new Rcon({
				host: "localhost",
				port: server.rconport,
				password: rconpw
			})
			try {
				await rcon.connect()
				this.rconConnections.push({
					rcon: rcon,
					server: server.server
				})

				// reconnection mechanism
				rcon.on("end", () => {
					let i = 0
					const interval = setInterval(async () => {
						try {
							rcon.connect().then(() => {
								clearInterval(interval)
								this.client?.channels.fetch(errorchannel).then((channel?: TextChannel) => channel.send(`Server <#${server.server.discordid}> has connected to RCON`))
							}).catch()
							i++
							if (i === 60) { // 5 minutes
								// clearInterval(interval) // just keep trying to reconnect
								this.client?.channels.fetch(errorchannel).then((channel?: TextChannel) => channel.send(`Server <#${server.server.discordid}> is having RCON issues`))
							}
						// eslint-disable-next-line no-empty
						} catch (error) { }
					}, 5000)
				})
			} catch (error) {
				console.error(error)
				const errorSend = setInterval(() => {
					this.client?.channels?.fetch(errorchannel).then((channel?: TextChannel) => channel?.send(`Server <#${server.server.discordid}> is having RCON issues`))
						.then(() => clearInterval(errorSend)).catch()
				}, 1000)
				let i = 0
				const interval = setInterval(async () => {
					try {
						rcon.connect().then(() => {
							clearInterval(interval)
							this.client?.channels.fetch(errorchannel).then((channel?: TextChannel) => channel.send(`Server <#${server.server.discordid}> has connected to RCON`))
						}).catch()
						i++
						if (i === 60) { // 5 minutes
							// clearInterval(interval) // just keep trying to reconnect
							this.client?.channels.fetch(errorchannel).then((channel?: TextChannel) => channel.send(`Server <#${server.server.discordid}> is having RCON issues`))
						}
					// eslint-disable-next-line no-empty
					} catch (error) { }
				}, 5000)
			}
		})
	}
	/**
	 * Send a RCON command to a Factorio server
	 * @param {string} command - Command to send to the server. Automatically prefixed with /
	 * @param {(discord.Snowflake|string)} serverIdentifier - Identifier for server. Either server's Discord channel ID, Discord name or debug name
	 * @returns {Promise<RCONOutput>} RCON output or error. Can be "Server couldn't be found" if no server was found
	 */
	async rconCommand(command: string, serverIdentifier: Snowflake|string): Promise<RCONOutput> {
		if (!command.startsWith("/")) command = `/${command}`
		let server = undefined
		this.rconConnections.forEach(serverConnections => {
			if ([serverConnections.server.name, serverConnections.server.discordid, serverConnections.server.discordname].some((identifier) => identifier === serverIdentifier))
				server = serverConnections
		})
		if (server == undefined) {
			throw new Error("Server couldn't be found")
		}
		try {
			const resp = await server.rcon.send(command)
			if (typeof resp == "string" && resp.length) return { resp: resp, server: server }
		} catch (error) {
			return { resp: error, server: server }
		}
	}
	/**
	 * Send a RCON command to all Factorio servers
	 * @param {string} command - Command to send to the servers. Automatically prefixed with /
	 * @returns {Promise<RCONOutput[]>} RCON output of all servers
	 */
	async rconCommandAll(command: string): Promise<RCONOutput[]> {
		console.log(`rconCommandAll: "${command}"`)
		const promiseArray = this.rconConnections.map(async (server) => {
			return new Promise((resolve, reject) => {
				this.rconCommand(command, server.server.discordid)
					.then(res => resolve(res))
					.catch(e => reject(e))
			})
		})
		return (await Promise.all(promiseArray)) as RCONOutput[]
	}
	/**
	 * Send a RCON command to all Factorio servers except the one you specify
	 * @param {string} command - Command to send to the servers. Automatically prefixed with /
	 * @param {(discord.Snowflake[]|string[])} exclusionServerIdentifiers - Identifier of server to exclude
	 * @returns {Promise<RCONOutput[]>} RCON output of servers
	 */
	async rconCommandAllExclude(command, exclusionServerIdentifiers) {
		if (!command.startsWith("/")) command = `/${command}` //add a '/' if not present

		const getArrayOverlap = (array1, array2) => {
			return array1.filter(x => array2.indexOf(x) !== -1)
		}

		const overlap = []
		const nameArr = this.rconConnections.map((connection) => { return connection.server.name })
		const channelIDArr = this.rconConnections.map((connection) => { return connection.server.discordid })
		const channelNameArr = this.rconConnections.map((connection) => { return connection.server.discordname })
		overlap.push(...getArrayOverlap(exclusionServerIdentifiers, nameArr))
		overlap.push(...getArrayOverlap(exclusionServerIdentifiers, channelIDArr))
		overlap.push(...getArrayOverlap(exclusionServerIdentifiers, channelNameArr))

		const toRun = []
		this.rconConnections.forEach(connection => {
			if (overlap.includes(connection.server.name) ||
				overlap.includes(connection.server.discordid) ||
				overlap.includes(connection.server.discordname)) return
			else
				toRun.push(connection)
		})

		const promiseArray = toRun.map((connection) => {
			return new Promise((resolve, reject) => {
				const resultIdentifier = {
					name: connection.server.name,
					discordid: connection.server.discordid,
					discordname: connection.server.discordname,
				}
				this.rconCommand(command, connection.server.discordid)
					.then(res => resolve({ resp: res, server: resultIdentifier }))
					.catch(e => reject({ resp: e, server: resultIdentifier }))
			})
		})
		return await Promise.all(promiseArray)
	}
}
const rconPorts = servers.map((server) => {
	return {
		rconport: server.rconoffset + rconport,
		server: server
	}
})
const rcon = new rconInterface(rconPorts)
export default rcon