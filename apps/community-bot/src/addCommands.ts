process.chdir(__dirname)

import { REST } from "@discordjs/rest"
import {
	Routes,
	APIApplicationCommand,
	APIUser,
	APIPartialGuild,
} from "discord-api-types/v9"
import ENV from "./utils/env.js"
import fs from "fs"
import { Collection } from "discord.js"
import { FAGCWrapper } from "fagc-api-wrapper"
import { GuildConfig } from "fagc-api-types"
import { Command } from "./base/Command.js"

const commandCategories = fs
	.readdirSync("./commands")
	.filter((command) => command.endsWith(".js"))
const toPushCommmands = commandCategories.map((commandFile) => {
	const command: Command<boolean, boolean> =
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		require(`./commands/${commandFile}`).default
	return command
})

const rest = new REST({ version: "9" }).setToken(ENV.DISCORD_BOTTOKEN)

const FAGC = new FAGCWrapper({
	apiurl: ENV.APIURL,
	socketurl: "",
	enableWebSocket: false,
})

const run = async () => {
	try {
		const self = (await rest.get(Routes.user())) as APIUser
		const guildIds = (
			(await rest.get(Routes.userGuilds())) as APIPartialGuild[]
		).map((guild) => guild.id)
		const guildConfigs = new Map<string, GuildConfig>()
		console.log(guildIds)
		await Promise.all(
			guildIds.map(async (guildId) => {
				const config = await FAGC.communities.fetchGuildConfig({
					guildId: guildId,
				})
				if (config) guildConfigs.set(guildId, config)
			})
		)
		console.log("Started refreshing application (/) commands.")
		const commands: Collection<string, APIApplicationCommand[]> =
			new Collection()

		console.log("Replacing commands")
		for (const guildId of guildIds) {
			console.log(`Replacing commands in guild ${guildId}`)
			const newCommands = (await rest.put(
				Routes.applicationGuildCommands(self.id, guildId),
				{ body: toPushCommmands.map((c) => c.data.toJSON()) }
			)) as APIApplicationCommand[]
			commands.set(guildId, newCommands)
		}
		console.log("Replaced all commands in all guilds")
	} catch (error) {
		console.error(error)
	}
	FAGC.destroy()
}
run()
