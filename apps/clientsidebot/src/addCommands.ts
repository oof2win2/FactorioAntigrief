import path from "node:path"
const __dirname = path.dirname(new URL(import.meta.url).pathname)
process.chdir(__dirname)

import { REST } from "@discordjs/rest"
import { Routes, RESTGetAPIUserResult, RESTAPIPartialCurrentUserGuild, APIApplicationCommand } from "discord-api-types/v9"
import ENV from "./utils/env.js"
import fs from "fs/promises"
import { PrismaClient } from ".prisma/client/index.js"
import { Command } from "./base/Commands.js"
import { Collection } from "discord.js"

const commandCategories = (await fs.readdir("./commands")).filter(command => command.endsWith(".js"))
const toPushCommmands = await Promise.all(commandCategories.map(async (commandFile) => {
	const command: Command = await import(`./commands/${commandFile}`).then(r => r.default)
	return command
}))

const prisma = new PrismaClient()
const rest = new REST({ version: "9" }).setToken(ENV.DISCORD_BOTTOKEN)

await prisma.$connect()

try {
	const self = await rest.get(Routes.user()) as RESTGetAPIUserResult
	const guildIDs = (await rest.get(Routes.userGuilds()) as RESTAPIPartialCurrentUserGuild[])
		.map(guild => guild.id)
	console.log("Started refreshing application (/) commands.")
	const commands: Collection<string, APIApplicationCommand[]> = new Collection()
	
	console.log("Removing old commands")
	const existingCommands = await prisma.command.findMany()
	for (const guildID in guildIDs) {
		console.log(`Removing old commands in guild ${guildID}`)
		const existingCommandsInGuild = existingCommands.filter(command => command.guildID === guildID)
		await Promise.all(
			existingCommandsInGuild.map(command => {
				rest.delete(
					Routes.applicationGuildCommand(self.id, guildID, command.id)
				)
			})
		)
	}
	// delete old commands from db
	await prisma.command.deleteMany()

	console.log("Adding new commands")
	for (const guildID in guildIDs) {
		console.log(`Adding new commands in guild ${guildID}`)
		const newCommands = await rest.put(
			Routes.applicationGuildCommands(self.id, guildID),
			{ body: toPushCommmands.map(c => c.data.toJSON()) }
		) as APIApplicationCommand[]
		commands.set(guildID, newCommands)
	}

	console.log("Saving new commands to DB")
	const toSaveCommands = commands.map(guildCommands => {
		return guildCommands.map(guildCommand => {
			return {
				id: guildCommand.id,
				guildID: guildCommand.guild_id!,
				name: guildCommand.name,
			}
		})
	}).flat()

	await Promise.all(toSaveCommands.map(async (command) => {
		prisma.command.create({
			data: {
				id: command.id,
				guildID: command.guildID,
				name: command.name
			}
		})
	}))
	console.log("Saved new commands to DB")
} catch (error) {
	console.error(error)
}