// 	let args = message.content.slice(prefix.length).trim().split(/ +/g)
// 	let command = args.shift().toLowerCase()
// 	let cmd =
// 		client.commands.get(command) ||
// 		client.commands.get(client.aliases.get(command))
// 	if (!cmd)
// 		return message.reply(
// 			"You provided an invalid command! Use `fagc!help` to view commands"
// 		)

// 	if (!cmd.config.enabled)
// 		return message.channel.send("This command is currently disabled!")
// 	if (cmd.config.ownerOnly && message.author.id !== client.config.owner.id)
// 		return message.channel.send(
// 			`Only the owner of ${client.user.username} can run this commands!`
// 		)

// 	const rate = client.checkTimeout(message.author.id, cmd.config.cooldown)
// 	if (rate && !client.config.adminIDs.includes(message.author.id))
// 		return message.channel.send("You're too fast!")
// 	client.RateLimit.set(message.author.id, Date.now())

// 	let guildConfig = await ConfigModel.findOne({ guildId: guild.id })
// 	if (!guildConfig) await createGuildConfig(guild, client)
// 	guildConfig = await ConfigModel.findOne({ guildId: guild.id })

// 	/// permissions
// 	let neededPermissions = []
// 	if (!cmd.config.botPermissions.includes("EMBED_LINKS"))
// 		cmd.config.botPermissions.push("EMBED_LINKS")

// 	// bot permissions
// 	cmd.config.botPermissions.forEach((perm) => {
// 		if (!message.channel.permissionsFor(guild.me).has(perm))
// 			neededPermissions.push(perm)
// 	})
// 	if (neededPermissions.length > 0)
// 		return message.channel.send(
// 			`I need the following permissions to execute this command: ${neededPermissions
// 				.map((p) => `\`${p}\``)
// 				.join(", ")}`
// 		)

// 	// user permissions
// 	neededPermissions = []
// 	let neededRoles = []
// 	cmd.config.memberPermissions.forEach((perm) => {
// 		if (!message.channel.permissionsFor(message.member).has(perm))
// 			neededPermissions.push(perm)
// 	})
// 	if (guildConfig && guildConfig.roles !== undefined) {
// 		cmd.config.customPermissions.forEach((perm) => {
// 			if (perm && guildConfig.roles[perm])
// 				if (
// 					guildConfig.roles[perm] &&
// 					message.member.roles.cache.has(guildConfig.roles[perm])
// 				)
// 					neededPermissions = neededPermissions.filter(
// 						(perm) => perm !== perm
// 					)
// 				else neededRoles.push(guildConfig.roles[perm])
// 		})
// 	}
// 	if (neededRoles.length > 0)
// 		return message.channel.send(
// 			`You need the following permissions to execute this command: ${neededPermissions
// 				.map((p) => `\`${p}\``)
// 				.join(", ")}. You can also use these roles instead: ${(
// 				await Promise.all(
// 					neededRoles.map(
// 						async (r) =>
// 							await guild.roles
// 								.fetch(r)
// 								.then((r) => `\`${r.name}\``)
// 					)
// 				)
// 			).join(", ")}`
// 		)
// 	if (neededRoles.length == 0 && neededPermissions.length > 0)
// 		return message.channel.send(
// 			`You need the following permissions to execute this command: ${neededPermissions
// 				.map((p) => `\`${p}\``)
// 				.join(", ")}`
// 		)

// 	try {
// 		await cmd.run(message, args, guildConfig)
// 	} catch (e) {
// 		message.channel.send("Something went wrong... Please try again later!")
// 		throw e
// 	}
// }
import { Message, Role } from "discord.js"
import FAGCBot from "../../base/fagcbot"
import { afterJoinGuild, sendToGuild } from "../../utils/functions"

export default async (client: FAGCBot, message: Message) => {
	if (message.author.bot) return
	if (!message.inGuild()) return
	const prefix = client.env.BOTPREFIX
	if (!message.content.startsWith(prefix)) return

	const args = message.content.slice(prefix.length).split(/ +/g)
	const cmd = args.shift()
	if (!cmd) return message.reply("Invalid command!")

	const command = client.commands.get(cmd) || client.commands.get(client.aliases.get(cmd) || "")
	if (!command) return message.reply("Invalid command!")

	// TODO: add user to rate limit

	// fetch the guild config for the guild, or create one if it doesn't exist yet
	const guildConfig =
		await client.fagc.communities.fetchGuildConfigMaster({ guildId: message.guild.id }) ||
		await client.fagc.communities.createGuildConfig({ guildId: message.guild.id })
	
	// check if the command requires api key
	if (command.requiresApikey && !guildConfig.apiKey)
		return message.channel.send(`${client.config.emotes.warn} API key must be set for use of this command`)
	
	// if command doesnt require guild config (like help, ping etc), it can be ran
	if (!command.requiresRoles) {
		try {
			return await command.run({
				message,
				args,
				client,
				guildConfig
			})
		} catch (e) {
			message.reply("Something went wrong... Please try again later!")
			throw e
		}
	}

	// if any of the roles are not present on the guild config, they must be filled first
	if (command.name !== "setpermissions" && (
		!guildConfig.roles.reports ||
		!guildConfig.roles.setCommunities ||
		!guildConfig.roles.setConfig ||
		!guildConfig.roles.setRules ||
		!guildConfig.roles.webhooks
	)) return message.reply("You need to run the setup command and set all roles before you can run any other commands!")

	// check which roles the user doesnt have
	const doesntHaveRoles = command.requiredPermissions
		.filter((permname) => {
			const roleid = guildConfig.roles[permname] // get the role which has this perm
			return !message.member?.roles.cache.has(roleid) // if the user does not have the role, return true to keep it in the array
		})
	// if the user doesnt have any of the roles and is not the guild owner, return
	if (doesntHaveRoles.length > 0 && message.guild.ownerId !== message.author.id) {
		const nonexistentRoles: string[] = []
		const roles = doesntHaveRoles
			.map(permname => [permname, guildConfig.roles[permname]]) // get the role ID of the
			.map((permname): [string, string | undefined] => [permname[0], message.guild.roles.cache.get(permname[1])?.name])
			.filter((role: [string, string | undefined], i) => {
				if (!role[1]) {
					// notify the guild owner if the role is not found
					nonexistentRoles.push(role[0])
					return false
				}
				return true
			})
			// get the names of the roles and make sure they are valid roles
			.map((x) => x[1]).filter((x): x is string => Boolean(x))
		if (nonexistentRoles.length) sendToGuild(message.guild, `The following roles are not set on the guild config: \`${nonexistentRoles.join("`, `")}\``)
		return message.reply(`You need the following roles to execute this command: \`${roles.join("\`, \`")}\``)
	}

	// the user now has any sufficient roles, so the command can be ran
	try {
		return await command.run({
			message,
			args,
			client,
			guildConfig,
		})
	} catch (e) {
		message.reply("Something went wrong... Please try again later!")
		throw e
	}
}