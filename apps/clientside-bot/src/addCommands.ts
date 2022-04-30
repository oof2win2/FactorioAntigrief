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
import { createConnection } from "typeorm"
import { Command } from "./base/Commands.js"
import { Collection } from "discord.js"
import { Required } from "utility-types"
import { FAGCWrapper } from "fagc-api-wrapper"
import { GuildConfig } from "fagc-api-types"
import { ApplicationCommandPermissionTypes } from "discord.js/typings/enums"
import DBCommand from "./database/Command.js"
import dbConnectionOptions from "./base/dbConnectionOptions.js"
import InfoChannel from "./database/InfoChannel.js"

const commandCategories = fs
	.readdirSync("./commands")
	.filter((command) => command.endsWith(".js"))
const toPushCommmands = commandCategories.map((commandFile) => {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const command: Command = require(`./commands/${commandFile}`).default
	return command
})

const rest = new REST({ version: "9" }).setToken(ENV.DISCORD_BOTTOKEN)

const FAGC = new FAGCWrapper({
	apiurl: ENV.APIURL,
	socketurl: ENV.WSURL,
	enableWebSocket: false,
})

const run = async () => {
	const db = await createConnection(await dbConnectionOptions())
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

		console.log("Removing old commands from DB")
		console.log(await db.getRepository(InfoChannel).find())
		// delete old commands from db
		await db
			.getRepository(DBCommand)
			.createQueryBuilder()
			.delete()
			.execute()

		console.log("Replacing commands")
		for (const guildId of guildIds) {
			console.log(`Replacing commands in guild ${guildId}`)
			const newCommands = (await rest.put(
				Routes.applicationGuildCommands(self.id, guildId),
				{ body: toPushCommmands.map((c) => c.data.toJSON()) }
			)) as APIApplicationCommand[]
			commands.set(guildId, newCommands)
		}

		console.log("Saving new commands to DB")
		const toSaveCommands = commands
			.map((guildCommands) => {
				return guildCommands.map((guildCommand) => {
					return {
						id: guildCommand.id,
						guildId: guildCommand.guild_id!,
						name: guildCommand.name,
					}
				})
			})
			.flat()

		await db.getRepository(DBCommand).insert(toSaveCommands)
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

			type CommandWithPerms = Required<
				Command,
				"permissionOverrides" | "permissionType"
			>

			const commandData: CommandWithPerms[] = guildCommands
				.map((command) =>
					toPushCommmands.find((c) => c.data.name === command.name)
				)
				.filter(
					(c): c is CommandWithPerms =>
						Boolean(c?.permissionType) ||
						Boolean(c?.permissionOverrides?.length)
				)
				.map((c) => {
					if (!c.permissionOverrides) c.permissionOverrides = []
					if (!c.permissionType) c.permissionType = "configrole"
					return c
				})
			const toSetPermissions = commandData.map((command) => {
				const guildCommand = guildCommands.find(
					(c) => c.name === command.data.name
				)!
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
									permission: true,
								})
							break
						}
						case "configrole": {
							if (guildConfig.roles.setConfig)
								perms.push({
									type: ApplicationCommandPermissionTypes.ROLE,
									id: guildConfig.roles.setConfig,
									permission: true,
								})
							break
						}
						case "notificationsrole": {
							if (guildConfig.roles.webhooks)
								perms.push({
									type: ApplicationCommandPermissionTypes.ROLE,
									id: guildConfig.roles.webhooks,
									permission: true,
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

			// if (toSetPermissions.length) {
			// 	// TODO: figure this out
			// 	for (const command of toSetPermissions) {
			// 		await rest.put(
			// 			Routes.applicationCommandPermissions(
			// 				self.id,
			// 				guildId,
			// 				command.id
			// 			),
			// 			{
			// 				body: {
			// 					permissions: command.permissions,
			// 				},
			// 			}
			// 		)
			// 	}
			// }
		}
	} catch (error) {
		console.error(error)
	}
	await db.close()
	FAGC.destroy()
}
run()
