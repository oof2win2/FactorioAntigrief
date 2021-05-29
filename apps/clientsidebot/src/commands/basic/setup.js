const { MessageEmbed } = require("discord.js")
const { getMessageResponse } = require("../../utils/responseGetter")
const Command = require("../../base/Command")

class Setup extends Command {
	constructor(client) {
		super(client, {
			name: "setup",
			description: "Setup your guild",
			aliases: [],
			usage: ["{{p}}setup"],
			category: "basic",
			dirname: __dirname,
			enabled: true,
			memberPermissions: ["ADMINISTRATOR"],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			ownerOnly: false,
			cooldown: 3000,
			requiredConfig: false,
			customPermissions: ["setConfig"],
		})
	}
	async run(message) {
		const messageFilter = response => response.author.id === message.author.id

		message.channel.send("Hello! This is the bot setup process for this server")
		const violationAction = (await getMessageResponse(message.channel.send("What should be the default action of what should happen when a violation matching your config is created (one of `info`, `jail` and `ban`)"), messageFilter))?.cleanContent
		if (!(["info", "jail", "ban"]).includes(violationAction)) return message.channel.send("Default action on violation is invalid")

		const revocationAction = (await getMessageResponse(message.channel.send("What should happen when such a violation is revoked (one of `info`, `keepBanned` and `removeBan`)"), messageFilter))?.cleanContent
		if (!(["info", "keepBanned", "removeBan"]).includes(revocationAction)) return message.channel.send("Revocation action is not valid.")

		const banRoleMsg = (await getMessageResponse(message.channel.send("What is the role that can create and manage bans (ping or ID)"), messageFilter))
		const banRole = banRoleMsg.mentions.roles.first() || await this.client.roles.fetch(banRoleMsg.content)
		if (!banRole) return message.channel.send("Provided role does not exist")

		const configRoleMsg = (await getMessageResponse(message.channel.send("What is the role that can manage the bot's configuration"), messageFilter))
		const configRole = configRoleMsg.mentions.roles.first() || await this.client.roles.fetch(configRoleMsg.content)
		if (!configRole) return message.channel.send("Provided role does not exist")

		const notificationRoleMsg = (await getMessageResponse(message.channel.send("What is the role that can manage FAGC notifications?"), messageFilter))
		const notificationRole = notificationRoleMsg.mentions.roles.first() || await this.client.roles.fetch(notificationRoleMsg.content)
		if (!notificationRole) return message.channel.send("Provided role does not exist")

		let embed = new MessageEmbed()
			.setTitle("Config")
			.setAuthor(`${this.client.user.username} | oof2win2#3149`)
			.setTimestamp()
			.setDescription("Your configuration")
		embed.addFields(
			{ name: "Default action on created violation", value: violationAction },
			{ name: "Default action on revoked violation", value: revocationAction },
			{ name: "Role that can create and manage bans", value: banRole },
			{ name: "Role that can manage the bot's configuration", value: configRole },
			{ name: "Role that can manage FAGC notifications", value: notificationRole },
		)

		message.channel.send(embed)
		const confirm = await message.channel.send("Are you sure you want these settings applied?")
		confirm.react("✅")
		confirm.react("❌")
		const reactionFilter = (reaction, user) => user.id == message.author.id
		let reactions
		try {
			reactions = await confirm.awaitReactions(reactionFilter, { max: 1, time: 120000, errors: ["time"] })
		} catch (error) {
			return message.channel.send("Timed out.")
		}
		let reaction = reactions.first()
		if (reaction.emoji.name === "❌")
			return message.channel.send("Configuration cancelled")

		try {
			// set to database
			const res = await this.client.setConfig({
				onViolation: violationAction,
				onRevocation: revocationAction,
				banRole: banRole.id,
				configRole: configRole.id,
				notificationsRole: notificationRole.id,
				guildid: message.guild.id
			})
			if (res.id) return message.channel.send("Config set successfully!")
		} catch (error) {
			console.error({ error })
			return message.channel.send("Error setting configuration. Please check logs.")
		}
	}
}
module.exports = Setup