import path from "node:path"
const __dirname = path.dirname(new URL(import.meta.url).pathname)
process.chdir(__dirname)

import { REST } from '@discordjs/rest';
import { APIApplicationCommand, RESTGetAPIUserResult, Routes } from 'discord-api-types/v9';
import ENV from "./utils/env.js"
import fs from 'fs/promises';
import {Command} from './utils/Command.js';
import pkg from "@prisma/client";
import { Constants } from "discord.js";
const { ApplicationCommandPermissionTypes } = Constants
const { PrismaClient } = pkg

const commandCategories = (await fs.readdir("./commands")).filter(command => command.endsWith(".js"))
const commands = await Promise.all(commandCategories.map(async (commandFile) => {
	const command: {default: Command} = await import(`./commands/${commandFile}`)
	return command.default
}))

const prisma = new PrismaClient()
await prisma.$connect()

const rest = new REST({ version: "9" }).setToken(ENV.DISCORD_BOTTOKEN)
const self = await rest.get(Routes.user()) as RESTGetAPIUserResult

try {
	console.log('Started refreshing application (/) commands.');

	console.log("Removing old commands from DB")
	// delete old commands from db
	await prisma.command.deleteMany()

	console.log(`Refreshing in guild ${ENV.TESTGUILDID}`)
	const APICommands = await rest.put(
		Routes.applicationGuildCommands(self.id, ENV.TESTGUILDID),
		{ body: commands.map(c => c.data.toJSON() ) }
	)  as APIApplicationCommand[]

	console.log("Adding role permissions to commands")
	const perms = APICommands.map((command) => {
		return {
			id: command.id,
			permissions: [{
				type: ApplicationCommandPermissionTypes.ROLE,
				id: ENV.ACCESSROLEID,
				permission: true
			}]
		}
	})
	await rest.put(
		Routes.guildApplicationCommandsPermissions(self.id, ENV.TESTGUILDID),
		{ body: perms }
	)

	const createCommandQueryValues = APICommands
		.map(command => `('${command.id}', '${command.name}')`)
		.join(",\n\t")
		.concat(";")
	console.log(`INSERT INTO \`main\`.\`Command\` (id, name) VALUES \n\t${createCommandQueryValues}`)
	await prisma.$executeRawUnsafe(`INSERT INTO \`main\`.\`Command\` (id, name) VALUES \n\t${createCommandQueryValues}`)
	console.log("Saved new commands to DB")

	console.log('Successfully reloaded application (/) commands.');
} catch (error) {
	console.error(error);
}
