import Command from "../../base/Command"
import { Message, MessageEmbed } from "discord.js"
import { getMessageResponse, getConfirmationMessage } from "../../utils/responseGetter"

export const command: Command<Message> = {
	name: "setup",
	description: "Setup your guild",
	aliases: [],
	usage: "{{p}}setup",
	dirname: __dirname,
	enabled: true,
	memberPermissions: ["ADMINISTRATOR"],
	botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
	ownerOnly: false,
	cooldown: 3000,
	requiredConfig: false,
	customPermissions: ["config"],
	run: async (client, message) => {
		const guild = message.guild
		message.channel.send("Hello! This is the bot setup process for this server")
		const violationAction = (await getMessageResponse("What should be the default action of what should happen when a violation matching your config is created (one of `info`, `jail` and `ban`)", message))?.cleanContent
		if (!(["info", "jail", "ban"]).includes(violationAction)) return message.channel.send("Default action on violation is invalid")

		const revocationAction = (await getMessageResponse("What should happen when such a violation is revoked (one of `info`, `keepBanned` and `removeBan`)", message))?.cleanContent
		if (!(["info", "keepBanned", "removeBan"]).includes(revocationAction)) return message.channel.send("Revocation action is not valid.")

		const banRoleMsg = await getMessageResponse("What is the role that can create and manage bans (ping or ID)", message)
		const banRole = banRoleMsg.mentions.roles.first() || await guild.roles.fetch(banRoleMsg.content)
		if (!banRole) return message.channel.send("Provided role does not exist")

		const configRoleMsg = await getMessageResponse("What is the role that can manage the bot's configuration", message)
		const configRole = configRoleMsg.mentions.roles.first() || await guild.roles.fetch(configRoleMsg.content)
		if (!configRole) return message.channel.send("Provided role does not exist")

		const notificationRoleMsg = await getMessageResponse("What is the role that can manage FAGC notifications?", message)
		const notificationRole = notificationRoleMsg.mentions.roles.first() || await guild.roles.fetch(notificationRoleMsg.content)
		if (!notificationRole) return message.channel.send("Provided role does not exist")

		const apikeyMsg = await getMessageResponse("If you have been given an API key by the FAGC team, please type it in. Type in `none` if you have not", message)
		apikeyMsg.delete()
		const apikey = apikeyMsg.content === "none" ? null : apikeyMsg.content

		const embed = new MessageEmbed()
			.setTitle("Config")
			.setAuthor(`${client.user.username} | oof2win2#3149`)
			.setTimestamp()
			.setDescription("Your configuration")
		embed.addFields(
			{ name: "Default action on created violation", value: violationAction },
			{ name: "Default action on revoked violation", value: revocationAction },
			{ name: "Role that can create and manage bans", value: banRole },
			{ name: "Role that can manage the bot's configuration", value: configRole },
			{ name: "Role that can manage FAGC notifications", value: notificationRole },
			{ name: "API key", value: apikey ? "Set" : "None" }
		)

		message.channel.send(embed)
		const confirm = await getConfirmationMessage("Are you sure you want these settings applied?", message)
		if (!confirm)
			return message.channel.send("Configuration cancelled")

		try {
			// set to database
			const res = await client.setConfig({
				id: 1,
				onViolation: violationAction,
				onRevocation: revocationAction,
				banRole: banRole.id,
				configRole: configRole.id,
				notificationsRole: notificationRole.id,
				guildId: message.guild.id,
				apikey: apikey
			})
			if (res.id) {
				client.getGuildConfig() // get config from FAGC
				return message.channel.send("Config set successfully!")
			}
		} catch (error) {
			message.channel.send("Error setting configuration. Please check logs.")
			throw error
		}
	}
}
