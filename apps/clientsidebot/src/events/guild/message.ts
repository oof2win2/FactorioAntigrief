import { PermissionResolvable } from "discord.js"
import { Message, TextChannel } from "discord.js"
import FAGCBot from "../../base/fagcbot"


export default async (client: FAGCBot, message: Message): Promise<Message|void> => {
	if (message.author.bot) return
	if (!message.channel.isText() || message.channel.type === "DM") return

	message.channel.permissionsFor(message.member).has("ADMINISTRATOR") // TextChannel | NewsChannel
	const prefix = client.config.prefix
	if (!message.content.startsWith(prefix)) return

	const args = message.content.slice(prefix.length).trim().split(/ +/g)
	const command = args.shift().toLowerCase()
	const cmd = client.commands.get(command) || client.commands.get(client.aliases.get(command))
	if (!cmd) return message.channel.send(`\`${prefix}${command}\` is not a valid command! Use \`fagc!help\` to view commands`)
	if (!cmd.enabled)
		return message.channel.send("This command is currently disabled!")
	if (cmd.ownerOnly && message.author.id !== client.config.owner.id)
		return message.channel.send(`Only the owner of ${client.user.username} can run this commands!`)

	const rate = client.checkTimeout(message.author.id, cmd.cooldown)
	if (rate && !client.config.adminIDs.includes(message.author.id)) return message.channel.send("You're too fast!")
	client.RateLimit.set(message.author.id, Date.now())
	const botconfig = FAGCBot.GuildConfig

	if (botconfig.guildId !== message.guild.id) return message.channel.send("You are trying to send commands in a different guild than the bot is configured for. The bot doesn't support this.")

	if (cmd.requiredConfig && !botconfig)
		return message.reply("You need to create a guild config first with `fagc!setup`!")
	/// permissions
	let neededPermissions = []
	if (!cmd.botPermissions.includes("EMBED_LINKS"))
		cmd.botPermissions.push("EMBED_LINKS")
	// bot permissions
	const channel = message.channel // this is because typescript issues of it not being to properly determine channel type in the callback
	cmd.botPermissions.forEach((perm) => {
		if (!channel.permissionsFor(message.guild.me).has(perm as PermissionResolvable))
			neededPermissions.push(perm)
	})
	if (neededPermissions.length > 0)
		return message.channel.send(`I need the following permissions to execute this command: ${neededPermissions.map((p) => `\`${p}\``).join(", ")}`)
	// user permissions
	neededPermissions = []
	const neededRoles = []
	cmd.memberPermissions.forEach((perm) => {
		if (!channel.permissionsFor(message.member).has(perm as PermissionResolvable))
			neededPermissions.push(perm)
	})
	if (botconfig) {
		cmd.customPermissions?.forEach(perm => {
			if (perm && botconfig[`${perm}Role`])
				if (!message.member.roles.cache.has(botconfig[`${perm}Role`]))
					neededRoles.push(botconfig[`${perm}Role`])
		})
	}
	if ((cmd.customPermissions?.length > 0 && neededRoles.length > 0) || neededPermissions.length > 0)
		return message.channel.send(`You need the following permissions to execute this command: ${neededPermissions.map((p) => `\`${p}\``).join(", ")}. You can also use these roles instead: ${(await Promise.all(neededRoles.map(async (r) => await message.guild.roles.fetch(r).then(r => `\`${r?.name}\``)))).join(", ")}`)
	if (cmd.customPermissions?.length == 0 && neededPermissions.length > 0)
		return message.channel.send(`You need the following permissions to execute this command: ${neededPermissions.map((p) => `\`${p}\``).join(", ")}`)
	try {
		cmd.run(client, message, args, botconfig)
	} catch (e) {
		message.channel.send("Something went wrong... Please try again later!")
		throw e
	}
}