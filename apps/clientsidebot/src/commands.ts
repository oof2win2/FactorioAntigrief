process.chdir("dist")

import { REST } from "@discordjs/rest"
import { Routes, APIApplicationCommand } from "discord-api-types/v9"
import ENV from "./utils/env.js"
import fs from "fs/promises"
import { Command } from "./base/Command.js"
import { PrismaClient } from ".prisma/client/index.js"

const commandCategories = (await fs.readdir("./commands")).filter(command => command.endsWith(".js"))
const commands = await Promise.all(commandCategories.map(async (commandFile) => {
	const command: { default: Command } = await import(`./commands/${commandFile}`)
	return {
		command: command.default.data.toJSON(),
		permissions: command.default.permission_overrides
	}
}))

const prisma = new PrismaClient()

const rest = new REST({ version: "9" }).setToken(ENV.DISCORD_BOTTOKEN)

try {
	console.log("Started refreshing application (/) commands.")

	console.log("Removing old commands")
	const prismaCommands = await prisma.commands.findMany()
	await Promise.all(prismaCommands.map(c => {
		const command = commands.find(command => command.command.name === c.name)
		if (!command) return rest.delete(
			Routes.applicationGuildCommand(ENV.CLIENTID, ENV.TESTGUILDID, c.id),
		)
	}))

	console.log(`Refreshing dev guild ${ENV.TESTGUILDID}`)
	const apicommands = await rest.put(
		Routes.applicationGuildCommands(ENV.CLIENTID, ENV.TESTGUILDID),
		{ body: commands.map(c => c.command) }
	) as Array<APIApplicationCommand>

	const commandData: Map<string, string> = new Map()

	await Promise.all(apicommands.map(async (apicommand) => {
		const command = commands.find(c => c.command.name === apicommand.name)!
		commandData.set(apicommand.id, apicommand.name)
		if (!command.permissions || !command.permissions.length) return
		return await rest.put(
			Routes.applicationCommandPermissions(ENV.CLIENTID, ENV.TESTGUILDID, apicommand.id),
			{ body: {permissions: command.permissions} }
		)
	}))
	await prisma.commands.deleteMany()
	await Promise.all(Array.from(commandData.keys()).map(id => prisma.commands.create({
		data: {
			id: id,
			name: commandData.get(id)
		}
	})))
	prisma.$disconnect()

	console.log("Successfully reloaded application (/) commands.")
} catch (error) {
	console.error(error)
}
