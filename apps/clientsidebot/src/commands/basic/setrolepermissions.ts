import Command from "../../base/Command"
import { MessageEmbed, Message } from "discord.js"
import { getMessageResponse, getConfirmationMessage } from "../../utils/responseGetter"
import FAGCBot from "../../base/fagcbot"

export const command: Command<Message> = {
	name: "setrolepermissions",
	description: "Set role permissions for command access",
	aliases: ["setroleperms", "setperms"],
	usage: "([option] [role])",
	examples: ["{{p}}setrolepermissions banRole 841761018380288100"],
	dirname: __dirname,
	enabled: true,
	memberPermissions: ["ADMINISTRATOR"],
	botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
	ownerOnly: false,
	cooldown: 3000,
	requiredConfig: true,
	run: async (client, message, args) => {
		const options = ["banRole", "configRole", "notificationsRole"]
		const guild = message.guild
		
		if (!args[0]) {
			// Set all roles
			const banRoleMsg = await getMessageResponse("What is the role that can create and manage bans (ping or ID)", message)
			const banRole = banRoleMsg.mentions.roles.first() || await guild.roles.fetch(banRoleMsg.content)
			if (!banRole) return message.channel.send("Provided role does not exist")

			const configRoleMsg = await getMessageResponse("What is the role that can manage the bot's configuration", message)
			const configRole = configRoleMsg.mentions.roles.first() || await guild.roles.fetch(configRoleMsg.content)
			if (!configRole) return message.channel.send("Provided role does not exist")

			const notificationRoleMsg = await getMessageResponse("What is the role that can manage FAGC notifications?", message)
			const notificationRole = notificationRoleMsg.mentions.roles.first() || await guild.roles.fetch(notificationRoleMsg.content)
			if (!notificationRole) return message.channel.send("Provided role does not exist")

			const embed = new MessageEmbed()
				.setTitle("Role permissions")
				.setAuthor(`${client.user.username} | oof2win2#3149`)
				.setTimestamp()
				.setDescription("Your role permissions")
			embed.addFields(
				{ name: "Role that can create and manage bans", value: banRole },
				{ name: "Role that can manage the bot's configuration", value: configRole },
				{ name: "Role that can manage FAGC notifications", value: notificationRole },
			)
			message.channel.send(embed)
			const confirm = await getConfirmationMessage("Are you sure you want these settings applied?", message)
			if (!confirm)
				return message.channel.send("Configuration cancelled")

			try {
				// set to database
				const res = await client.setConfig({
					...FAGCBot.GuildConfig,
					banRole: banRole.id,
					configRole: configRole.id,
					notificationsRole: notificationRole.id,
				})
				if (res.id) return message.channel.send("Config set successfully!")
			} catch (error) {
				console.error({ error })
				return message.channel.send("Error setting configuration. Please check logs.")
			}
		} else if (!args[1]) {
			// Set role but ask for the ID
			const permission = args.shift()
			if (options.includes(permission)) return message.reply(`\`${permission}\` is an invalid permission! Use one of \`${options.join("`, `")}\``)

			const roleMsg = await getMessageResponse(`Mention or type the ID of the role that will have access to the \`${permission}\` permission?`, message)
			const role = roleMsg.mentions.roles.first() || await guild.roles.fetch(roleMsg.content)
			if (!role) return message.channel.send("Provided role does not exist")

			const conf = FAGCBot.GuildConfig
			conf[permission] = role.id
			const newConfig = await client.setConfig(conf)
			if (newConfig.id) return message.channel.send(`Permission \`${permission}\` set successfully!`)
		} else {
			// Set role and ID from message
			const permission = args.shift()
			const id = args.shift()
			if (options.includes(permission)) return message.reply(`\`${permission}\` is an invalid permission! Use one of \`${options.join("`, `")}\``)
			const role = message.mentions.roles.first() || await guild.roles.fetch(permission)
			if (!role) return message.reply(`\`${id}\` is not a valid role!`)
			
			const conf = FAGCBot.GuildConfig
			conf[permission] = id
			const newConfig = await client.setConfig(conf)
			if (newConfig.id) return message.channel.send(`Permission \`${permission}\` set successfully!`)
		}
	}
}