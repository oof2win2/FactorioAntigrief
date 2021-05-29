const Command = require("../../base/Command")
const { MessageEmbed } = require("discord.js")
const { getMessageResponse } = require("../../utils/responseGetter")

class SetAPIKey extends Command {
	constructor(client) {
		super(client, {
			name: "setrolepermissions",
			description: "Set role permissions for command access",
			aliases: ["setroleperms", "setperms"],
			category: "basic",
			usage: "([option] [role])",
			examples: ["{{p}}setrolepermissions banRole 841761018380288100"],
			dirname: __dirname,
			enabled: true,
			memberPermissions: ["ADMINISTRATOR"],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			ownerOnly: false,
			cooldown: 3000,
			requiredConfig: true,
		})
	}
	async run(message, args) {
		const options = ["banRole", "configRole", "notificationsRole"]
		const messageFilter = response => response.author.id === message.author.id
		if (!args[0]) {
			// Set all roles
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
				.setTitle("Role permissions")
				.setAuthor(`${this.client.user.username} | oof2win2#3149`)
				.setTimestamp()
				.setDescription("Your role permissions")
			embed.addFields(
				{ name: "Role that can create and manage bans", value: banRole },
				{ name: "Role that can manage the bot's configuration", value: configRole },
				{ name: "Role that can manage FAGC notifications", value: notificationRole },
			)
			message.channel.send(embed)
			const confirm = await message.channel.send("Are you sure you want these settings applied?")
			confirm.react("✅")
			confirm.react("❌")
			const reactionFilter = (reaction, user) => {
				return user.id == message.author.id
			}
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
					...this.client.guildConfig,
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

			const roleMsg = (await getMessageResponse(message.channel.send(`Mention or type the ID of the role that will have access to the \`${permission}\` permission?`), messageFilter))
			const role = roleMsg.mentions.roles.first() || await this.client.roles.fetch(roleMsg.content)
			if (!role) return message.channel.send("Provided role does not exist")

			const conf = this.client.guildConfig
			conf[permission] = role.id
			const newConfig = await this.client.setConfig(conf)
			if (newConfig.id) return message.channel.send(`Permission \`${permission}\` set successfully!`)
		} else {
			// Set role and ID from message
			const permission = args.shift()
			const id = args.shift()
			if (options.includes(permission)) return message.reply(`\`${permission}\` is an invalid permission! Use one of \`${options.join("`, `")}\``)
			const role = message.mentions.roles.first() || await this.client.roles.fetch(role)
			if (!role) return message.reply(`\`${id}\` is not a valid role!`)
			
			const conf = this.client.guildConfig
			conf[permission] = id
			const newConfig = await this.client.setConfig(conf)
			if (newConfig.id) return message.channel.send(`Permission \`${permission}\` set successfully!`)
		}
	}
}
module.exports = SetAPIKey