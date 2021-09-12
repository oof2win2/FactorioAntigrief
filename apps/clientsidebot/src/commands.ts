process.chdir("dist")

import { REST } from "@discordjs/rest"
import { Routes, APIApplicationCommand } from "discord-api-types/v9"
import ENV from "./utils/env.js"
import fs from "fs/promises"
import { Command } from "./base/Command.js"

const commandCategories = (await fs.readdir("./commands")).filter(command => command.endsWith(".js"))
const commands = await Promise.all(commandCategories.map(async (commandFile) => {
	const command: { default: Command } = await import(`./commands/${commandFile}`)
	return {
		command: command.default.data.toJSON(),
		permissions: command.default.permission_overrides
	}
}))

const rest = new REST({ version: "9" }).setToken(ENV.DISCORD_BOTTOKEN)

try {
	console.log("Started refreshing application (/) commands.")

	if (ENV.isDev) {
		console.log(`Refreshing dev in guild ${ENV.TESTGUILDID}`)
		const apicommands = await rest.put(
			Routes.applicationGuildCommands(ENV.CLIENTID, ENV.TESTGUILDID),
			{ body: commands.map(c => c.command) }
		) as Array<APIApplicationCommand>

		await Promise.all(apicommands.map(async (apicommand) => {
			const command = commands.find(c => c.command.name === apicommand.name)!
			if (!command.permissions || !command.permissions.length) return
			return await rest.put(
				Routes.applicationCommandPermissions(ENV.CLIENTID, ENV.TESTGUILDID, apicommand.id),
				{ body: {permissions: command.permissions} }
			)
		}))
	} else {
		console.log("Refreshing global")
		await rest.put(
			Routes.applicationCommands(ENV.CLIENTID),
			{ body: commands.map(c => c.command) }
		)
	}

	console.log("Successfully reloaded application (/) commands.")
} catch (error) {
	console.error(error)
}
