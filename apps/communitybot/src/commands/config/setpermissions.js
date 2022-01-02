const Command = require("../../base/Command")
const { MessageEmbed } = require("discord.js")
const {
	getMessageResponse,
	getConfirmationMessage,
} = require("../../utils/responseGetter")

class SetAPIKey extends Command {
	constructor(client) {
		super(client, {
			name: "setpermissions",
			description: "Set role permissions for command access",
			aliases: [ "setroleperms", "setroleperm", "setperms", "setperm" ],
			category: "config",
			usage: "([option] [role])",
			examples: [ "{{p}}setrolepermissions reports 841761018380288100" ],
			dirname: __dirname,
			enabled: true,
			memberPermissions: [ "ADMINISTRATOR" ],
			botPermissions: [ "SEND_MESSAGES", "EMBED_LINKS" ],
			ownerOnly: false,
			cooldown: 3000,
			requiredConfig: true,
			customPermissions: [ "setConfig" ],
		})
	}
	async run(message, args, guildConfig) {
		if (!args[0]) {
			// all perms
			message.channel.send("Process of setting roles has started. ")
			const reportsMsg = await getMessageResponse(
				message,
				`${this.client.emotes.type} Type in the ID or ping the role for report management`
			)
			const reports =
				reportsMsg?.mentions.roles.first() ||
				(await message.guild.roles.fetch(reportsMsg?.content?.split(" ")[0]))
			if (!reports)
				return message.channel.send(
					`${this.client.emotes.warn} \`${reportsMsg?.content?.split(" ")[0]}\` is not a valid role`
				)

			const webhooksMsg = await getMessageResponse(
				message,
				`${this.client.emotes.type} Type in the ID or ping the role for webhook management`
			)
			const webhooks =
				webhooksMsg?.mentions.roles.first() ||
				(await message.guild.roles.fetch(webhooksMsg?.content?.split(" ")[0]))
			if (!webhooks)
				return message.channel.send(
					`${this.client.emotes.warn} \`${webhooksMsg?.content?.split(" ")[0]}\` is not a valid role`
				)

			const configMsg = await getMessageResponse(
				message,
				`${this.client.emotes.type} Type in the ID or ping the role for config management`
			)
			const setConfig =
				configMsg?.mentions.roles.first() ||
				(await message.guild.roles.fetch(configMsg?.content?.split(" ")[0]))
			if (!setConfig)
				return message.channel.send(
					`${this.client.emotes.warn} \`${configMsg?.content?.split(" ")[0]}\` is not a valid role`
				)

			const ruleMsg = await getMessageResponse(
				message,
				`${this.client.emotes.type} Type in the ID or ping the role for management of filtered rules`
			)
			const setRules =
				ruleMsg?.mentions.roles.first() ||
				(await message.guild.roles.fetch(ruleMsg?.content?.split(" ")[0]))
			if (!setRules)
				return message.channel.send(
					`${this.client.emotes.warn} \`${ruleMsg?.content?.split(" ")[0]}\` is not a valid role`
				)

			const communitiesMsg = await getMessageResponse(
				message,
				`${this.client.emotes.type} Type in the ID or ping the role for management of trusted communities`
			)
			const setCommunities =
				communitiesMsg?.mentions.roles.first() ||
				(await message.guild.roles.fetch(communitiesMsg?.content?.split(" ")[0]))
			if (!setCommunities)
				return message.channel.send(
					`${this.client.emotes.warn} \`${communitiesMsg?.content?.split(" ")[0]}\` is not a valid role`
				)

			let embed = new MessageEmbed()
				.setTitle("FAGC Role Config")
				.setAuthor(`${this.client.user?.username} | oof2win2#3149`)
				.setTimestamp()
				.setDescription("Your FAGC Role Configuration")
			embed.addFields(
				{ name: "Reports Management", value: reports },
				{ name: "Webhook Management", value: webhooks },
				{ name: "Config Management", value: setConfig },
				{ name: "Rule Management", value: setRules },
				{ name: "Communities Management", value: setCommunities }
			)
			message.channel.send(embed)
			const confirmation = await getConfirmationMessage(
				message,
				"Are you sure you want these settings applied?"
			)
			if (!confirmation)
				return message.channel.send(
					"Permission configuration cancelled"
				)

			try {
				guildConfig.roles.reports = reports.id
				guildConfig.roles.webhooks = webhooks.id
				guildConfig.roles.setConfig = setConfig.id
				guildConfig.roles.setRules = setRules.id
				guildConfig.roles.setCommunities = setCommunities.id
				const newConfig = await this.client.saveGuildConfig(guildConfig)
				console.log(guildConfig, newConfig, reports.id)
				if (newConfig.roles.reports == reports.id)
					return message.channel.send(
						`${this.client.emotes.success} Role setting successfully applied! Changes may take a few minutes to take effect`
					)
				else
					return message.channel.send(
						`${this.client.emotes.error} An error occured. Please contact developers`
					)
			} catch (e) {
				console.error("setrolepermissions", e)
				message.channel.send(`${this.client.emotes.error} An error occured. Please try again later`)
			}
		} else if (!args[1]) {
			// set with extra message
			const options = [
				"reports",
				"webhooks",
				"setConfig",
				"setRules",
				"setCommunities",
			]
			if (!options.includes(args[0]))
				return message.reply(
					`${this.client.emotes.warn} That is not a valid setting! Use one of \`${options.join(
						"`, `"
					)}\``
				)

			const roleMsg = await getMessageResponse(
				message,
				`${this.client.emotes.type} Type in the ID or ping the role for the \`${args[0]}\` permission`
			)
			const role =
				roleMsg?.mentions.roles.first() ||
				(await message.guild.roles.fetch(roleMsg?.content?.split(" ")[0]))
			if (!role)
				return message.channel.send(
					`${this.client.emotes.warn} \`${roleMsg?.content?.split(" ")[0]}\` is not a valid role`
				)
			const confirm = await getConfirmationMessage(
				message,
				`The role ${role.name} will be used for the permission \`${args[0]}\``
			)
			if (!confirm)
				return message.channel.send(
					"Permission configuration cancelled"
				)

			try {
				guildConfig.roles[args[0]] = role.id
				const newConfig = await this.client.saveGuildConfig(guildConfig)
				if (newConfig.roles[args[0]] == role.id)
					return message.channel.send(
						"Role setting successfully applied! Changes may take a few minutes to take effect"
					)
				else
					return message.channel.send(
						"An error occured. Please contact developers"
					)
			} catch (e) {
				console.error("setrolepermissions", e)
				message.channel.send("An error occured. Please try again later")
			}
		} else if (!args[2]) {
			const options = [
				"reports",
				"webhooks",
				"setConfig",
				"setRules",
				"setCommunities",
			]
			if (!options.includes(args[0]))
				return message.reply(
					`${this.client.emotes.warn} That is not a valid setting! Use one of \`${options.join(
						"`, `"
					)}\``
				)

			const role =
				message.mentions.roles.first() ||
				(await message.guild.roles.fetch(args[1]))
			if (!role)
				return message.channel.send(
					`\`${args[1]}\` is not a valid role`
				)
			const confirm = await getConfirmationMessage(
				message,
				`The role ${role.name} will be used for the permission \`${args[0]}\``
			)
			if (!confirm)
				return message.channel.send(
					"Permission configuration cancelled"
				)

			try {
				guildConfig.roles[args[0]] = role.id
				const newConfig = await this.client.saveGuildConfig(guildConfig)
				if (newConfig.roles[args[0]] == role.id)
					return message.channel.send(
						"Role setting successfully applied! Changes may take a few minutes to take effect"
					)
				else
					return message.channel.send(
						"An error occured. Please contact developers"
					)
			} catch (e) {
				console.error("setrolepermissions", e)
				message.channel.send("An error occured. Please try again later")
			}
		}
	}
}
module.exports = SetAPIKey
