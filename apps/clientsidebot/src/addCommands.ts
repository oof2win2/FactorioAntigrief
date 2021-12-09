import path from "node:path"
const __dirname = path.dirname(new URL(import.meta.url).pathname)
process.chdir(__dirname)

import { REST } from "@discordjs/rest"
import { Routes, RESTGetAPIUserResult, APIApplicationCommand } from "discord-api-types/v9"
import ENV from "./utils/env.js"
import fs from "fs/promises"
import { PrismaClient } from ".prisma/client/index.js"
import { Command } from "./base/Commands.js"

const commandCategories = (await fs.readdir("./commands")).filter(command => command.endsWith(".js"))
const toPushCommmands = await Promise.all(commandCategories.map(async (commandFile) => {
	const command: Command = await import(`./commands/${commandFile}`).then(r => r.default)
	return command.data.toJSON()
}))

const prisma = new PrismaClient()
const rest = new REST({ version: "9" }).setToken(ENV.DISCORD_BOTTOKEN)

await prisma.$connect()

try {
	const self = await rest.get(Routes.user()) as RESTGetAPIUserResult
	console.log("Started refreshing application (/) commands.")
	let commands: Array<APIApplicationCommand> = []

	console.log("Removing old commands")
	const existingCommands = await prisma.command.findMany()
	await Promise.all(existingCommands.map(async (command) => {
		await rest.delete(
			Routes.applicationGuildCommand(self.id, ENV.TESTGUILDID, command.id)
		)
	}))

	console.log(`Refreshing commands in guild ${ENV.TESTGUILDID}`)
	commands = await rest.put(
		Routes.applicationGuildCommands(self.id, ENV.TESTGUILDID),
		{ body: toPushCommmands }
	) as Array<APIApplicationCommand>

	console.log("Successfully reloaded application (/) commands.")
	await prisma.command.deleteMany()
	await Promise.all(commands.map(async (command) => {
		prisma.command.create({
			data: {
				id: command.id,
				name: command.name
			}
		})
	}))
	console.log("Saved new commands to DB")
} catch (error) {
	console.error(error)
}