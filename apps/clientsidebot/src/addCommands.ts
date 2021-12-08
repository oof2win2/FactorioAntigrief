import path from "node:path"
const __dirname = path.dirname(new URL(import.meta.url).pathname)
process.chdir(__dirname)

import { REST } from "@discordjs/rest"
import { Routes, RESTGetAPIUserResult, APIApplicationCommand } from "discord-api-types/v9"
import ENV from "./utils/env.js"
import fs from "fs/promises"
import { Command } from "./base/Commands.js"

const commandCategories = (await fs.readdir("./commands")).filter(command => command.endsWith(".js"))
const toPushCommmands = await Promise.all(commandCategories.map(async (commandFile) => {
	const command: Command = await import(`./commands/${commandFile}`).then(r => r.default)
	return command.data.toJSON()
}))

const rest = new REST({ version: "9" }).setToken(ENV.DISCORD_BOTTOKEN)

try {
	const self = await rest.get(Routes.user()) as RESTGetAPIUserResult
	console.log("Started refreshing application (/) commands.")
	let commands: Array<APIApplicationCommand> = []

	if (ENV.isDevelopment) {
		console.log(`Refreshing development in guild ${ENV.TESTGUILDID}`)
		commands = await rest.put(
			Routes.applicationGuildCommands(self.id, ENV.TESTGUILDID),
			{ body: toPushCommmands }
		) as Array<APIApplicationCommand>
	}
	else {
		console.log(`Refreshing production in guild ${ENV.GUILDID}`)
		commands = await rest.put(
			Routes.applicationCommands(self.id),
			{ body: toPushCommmands }
		) as Array<APIApplicationCommand>
	}

	

	console.log("Successfully reloaded application (/) commands.")
} catch (error) {
	console.error(error)
}