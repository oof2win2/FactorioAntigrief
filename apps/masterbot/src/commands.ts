import path from "node:path"
const __dirname = path.dirname(new URL(import.meta.url).pathname)
process.chdir(__dirname)

import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import ENV from "./utils/env.js"
import fs from 'fs/promises';
import Command from './utils/Command.js';
import { APIApplicationCommandOption } from 'discord-api-types/v9';

const run = async () => {
	const commandCategories = await fs.readdir("./commands")
	const commands = await Promise.all(commandCategories.map(async (commandFile) => {
		const command: {default: Command} = await import(`./commands/${commandFile}`)
		return command.default.data.toJSON()
	}))

	const rest = new REST({ version: "9" }).setToken(ENV.DISCORD_BOTTOKEN)

	try {
		console.log('Started refreshing application (/) commands.');

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
			);
		}

		console.log('Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
	}
}
run()