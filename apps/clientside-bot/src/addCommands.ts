process.chdir(__dirname)

import { REST } from "@discordjs/rest"
import { Routes, RESTGetAPIUserResult, RESTAPIPartialCurrentUserGuild, APIApplicationCommand } from "discord-api-types/v9"
import ENV from "./utils/env.js"
import fs from "fs"
import { PrismaClient } from ".prisma/client/index.js"
import { Command } from "./base/Commands.js"
import { Collection } from "discord.js"
import { Required } from "utility-types"
import { FAGCWrapper } from "fagc-api-wrapper"
import { GuildConfig } from "fagc-api-types"
import { ApplicationCommandPermissionTypes } from "discord.js/typings/enums"

const commandCategories = (fs.readdirSync("./commands")).filter(command => command.endsWith(".js"))
const toPushCommmands = commandCategories.map((commandFile) => {
	const command: Command = require(`./commands/${commandFile}`).default
	return command
})

const prisma = new PrismaClient()
const rest = new REST({ version: "9" }).setToken(ENV.DISCORD_BOTTOKEN)

const FAGC = new FAGCWrapper({
	apiurl: ENV.APIURL,
	socketurl: ENV.WSURL,
	enableWebSocket: false
})



const run = async () => {
	await prisma.$connect()
	try {
		const self = await rest.get(Routes.user()) as RESTGetAPIUserResult
		const guildIds = (await rest.get(Routes.userGuilds()) as RESTAPIPartialCurrentUserGuild[])
			.map(guild => guild.id)
		const guildConfigs = new Map<string, GuildConfig>()
		await Promise.all(
			guildIds.map(async (guildId) => {
				const config = await FAGC.communities.fetchGuildConfig({ guildId: guildId })
				if (config) guildConfigs.set(guildId, config)
			})
		)
		console.log("Started refreshing application (/) commands.")
		const commands: Collection<string, APIApplicationCommand[]> = new Collection()
		
		console.log("Removing old commands from DB")
		// delete old commands from db
		await prisma.command.deleteMany()
	
		console.log("Replacing commands")
		for (const guildId of guildIds) {
			console.log(`Replacing commands in guild ${guildId}`)
			const newCommands = await rest.put(
				Routes.applicationGuildCommands(self.id, guildId),
				{ body: toPushCommmands.map(c => c.data.toJSON()) }
			) as APIApplicationCommand[]
			commands.set(guildId, newCommands)
		}
	
		console.log("Saving new commands to DB")
		const toSaveCommands = commands.map(guildCommands => {
			return guildCommands.map(guildCommand => {
				return {
					id: guildCommand.id,
					guildId: guildCommand.guild_id!,
					name: guildCommand.name,
				}
			})
		}).flat()
	
	
		// current createMany alternative
		// https://github.com/prisma/prisma/issues/10710
		const createCommandQueryValues = toSaveCommands
			.map(command => `('${command.id}', '${command.guildId}', '${command.name}')`)
			.join(",\n\t")
			.concat(";")
		await prisma.$executeRawUnsafe(`INSERT INTO \`main\`.\`Command\` (id, guildId, name) VALUES \n\t${createCommandQueryValues}`)
		console.log("Saved new commands to DB")
	
		console.log("Setting permission overrides")
		for (const guildId of guildIds) {
			console.log(`Setting permission overrides in guild ${guildId}`)
			const guildConfig = guildConfigs.get(guildId)
			const guildCommands = commands.get(guildId)
			if (!guildCommands) {
				console.log(`Guild ${guildId} does not have any commands`)
				continue
			}
	
			type CommandWithPerms = Required<Command, "permissionOverrides" | "permissionType">
	
			const commandData: CommandWithPerms[] = guildCommands
				.map(command => toPushCommmands.find(c => c.data.name === command.name))
				.filter((c): c is CommandWithPerms => Boolean(c?.permissionType) || Boolean(c?.permissionOverrides?.length))
				.map(c=> {
					if (!c.permissionOverrides) c.permissionOverrides = []
					if (!c.permissionType) c.permissionType = "configrole"
					return c
				})
			const toSetPermissions = commandData.map((command) => {
				const guildCommand = guildCommands.find(c => c.name === command.data.name)!
				const perms = command.permissionOverrides
				perms.push({
					type: ApplicationCommandPermissionTypes.USER,
					id: ENV.OWNERID,
					permission: true,
				})
	
				if (guildConfig?.roles) {
					switch (command.permissionType) {
					case "banrole": {
						if (guildConfig.roles.reports)
							perms.push({
								type: ApplicationCommandPermissionTypes.ROLE,
								id: guildConfig.roles.reports,
								permission: true
							})
						break
					}
					case "configrole": {
						if (guildConfig.roles.setConfig)
							perms.push({
								type: ApplicationCommandPermissionTypes.ROLE,
								id: guildConfig.roles.setConfig,
								permission: true
							})
						break
					}
					case "notificationsrole": {
						if (guildConfig.roles.webhooks)
							perms.push({
								type: ApplicationCommandPermissionTypes.ROLE,
								id: guildConfig.roles.webhooks,
								permission: true
							})
						break
					}
					}
				}
				return {
					id: guildCommand.id,
					type: command.permissionType,
					permissions: perms,
				}
			})
	
			if (toSetPermissions.length)
				await rest.put(
					Routes.guildApplicationCommandsPermissions(self.id, guildId),
					{ body: toSetPermissions }
				)
		}
	} catch (error) {
		console.error(error)
	}
	await prisma.$disconnect()
	FAGC.destroy()
}
run()