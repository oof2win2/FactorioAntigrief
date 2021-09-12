process.chdir("dist")

import { REST } from "@discordjs/rest"
import { Routes } from "discord-api-types/v9"
import ENV from "./utils/env.js"
import fs from "fs/promises"
import {Command} from "./base/Command.js"

const commandCategories = (await fs.readdir("./commands")).filter(command => command.endsWith(".js"))
const commands = await Promise.all(commandCategories.map(async (commandFile) => {
	const command: {default: Command} = await import(`./commands/${commandFile}`)
	return command.default.data.toJSON()
}))

const rest = new REST({ version: "9" }).setToken(ENV.DISCORD_BOTTOKEN)

try {
	console.log("Started refreshing application (/) commands.")
	console.log(commands)

	if (ENV.isDev) {
		console.log(`Refreshing dev in guild ${ENV.TESTGUILDID}`)
		await rest.put(
			Routes.applicationGuildCommands(ENV.CLIENTID, ENV.TESTGUILDID),
			{ body: commands }
		)
	} else {
		console.log("Refreshing global")
		await rest.put(
			Routes.applicationCommands(ENV.CLIENTID),
			{ body: commands },
		)
	}

	console.log("Successfully reloaded application (/) commands.")
} catch (error) {
	console.error(error)
}
