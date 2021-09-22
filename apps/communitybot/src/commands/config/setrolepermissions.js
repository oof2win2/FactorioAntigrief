const Command = require("../../base/Command")
const ConfigModel = require("../../database/schemas/config")
const { MessageEmbed } = require("discord.js")
const {
	getMessageResponse,
	getConfirmationMessage,
} = require("../../utils/responseGetter")

class SetAPIKey extends Command {
	constructor(client) {
		super(client, {
			name: "setrolepermissions",
			description: "Set role permissions for command access",
			aliases: ["setroleperms", "setperms", "setpermissions"],
			category: "config",
			usage: "([option] [role])",
			examples: ["{{p}}setrolepermissions reports 841761018380288100"],
			dirname: __dirname,
			enabled: true,
			memberPermissions: ["ADMINISTRATOR"],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			ownerOnly: false,
			cooldown: 3000,
			requiredConfig: true,
			customPermissions: ["setConfig"],
		})
	}
	async run(message, args) {
		if (!args[0]) {
			// all perms
			message.channel.send("Process of setting roles has started. ")
			const reportsMsg = await getMessageResponse(
				message,
				"Please type in the ID or ping the role for report management"
			)
			const reports =
				reportsMsg.mentions.roles.first()?.id ||
				(await message.guild.roles.fetch(reportsMsg.content))
			if (!reports)
				return message.channel.send(
					`\`${reportsMsg.content}\` is not a valid role`
				)

			const webhooksMsg = await getMessageResponse(
				message,
				"Please type in the ID or ping the role for webhook management"
			)
			const webhooks =
				webhooksMsg.mentions.roles.first()?.id ||
				(await message.guild.roles.fetch(webhooksMsg.content))
			if (!webhooks)
				return message.channel.send(
					`\`${webhooksMsg.content}\` is not a valid role`
				)

			const configMsg = await getMessageResponse(
				message,
				"Please type in the ID or ping the role for config management"
			)
			const config =
				configMsg.mentions.roles.first()?.id ||
				(await message.guild.roles.fetch(configMsg.content))
			if (!config)
				return message.channel.send(
					`\`${configMsg.content}\` is not a valid role`
				)

			const ruleMsg = await getMessageResponse(
				message,
				"Please type in the ID or ping the role for management of filtered rules"
			)
			const rules =
				ruleMsg.mentions.roles.first()?.id ||
				(await message.guild.roles.fetch(ruleMsg.content))
			if (!rules)
				return message.channel.send(
					`\`${ruleMsg.content}\` is not a valid role`
				)

			const communitiesMsg = await getMessageResponse(
				message,
				"Please type in the ID or ping the role for management of trusted communities"
			)
			const communities =
				communitiesMsg.mentions.roles.first()?.id ||
				(await message.guild.roles.fetch(communitiesMsg.content))
			if (!communities)
				return message.channel.send(
					`\`${communitiesMsg.content}\` is not a valid role`
				)

			let embed = new MessageEmbed()
				.setTitle("FAGC Role Config")
				.setAuthor(`${this.client.user.username} | oof2win2#3149`)
				.setTimestamp()
				.setDescription("Your FAGC Role Configuration")
			embed.addFields(
				{ name: "Reports Management", value: reports },
				{ name: "Webhook Management", value: webhooks },
				{ name: "Config Management", value: config },
				{ name: "Rule Management", value: rules },
				{ name: "Communities Management", value: communities }
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
				const updatedConfig = await ConfigModel.findOneAndUpdate(
					{ guildId: message.guild.id },
					{
						$set: {
							"roles.reports": reports,
							"roles.webhooks": webhooks,
							"roles.setConfig": config,
							"roles.setRules": rules,
							"roles.setCommunities": communities,
						},
					},
					{ new: true }
				).then((r) => r.toObject())

				if (updatedConfig && updatedConfig.guildId == message.guild.id)
					return message.channel.send(
						"Role configs successfully applied!"
					)
				else {
					console.error("setrolepermissions", updatedConfig)
					return message.channel.send(
						"An error occured. Please contact developers"
					)
				}
			} catch (e) {
				console.error("setrolepermissions", e)
				message.channel.send("An error occured. Please try again later")
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
					`That is not a valid setting! Use one of \`${options.join(
						"`, `"
					)}\``
				)

			const roleMsg = await getMessageResponse(
				message,
				`Please type in the ID or ping the role for the \`${args[0]}\` permission`
			)
			const role =
				roleMsg.mentions.roles.first() ||
				(await message.guild.roles.fetch(roleMsg.content))
			if (!role)
				return message.channel.send(
					`\`${roleMsg.content}\` is not a valid role`
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
				const res = await ConfigModel.findOneAndUpdate(
					{ guildId: message.guild.id },
					{
						$set: {
							[`roles.${args[0]}`]: role.id,
						},
					},
					{ new: true }
				)
				if (res.guildId && res.roles[args[0]] == role.id)
					return message.channel.send(
						"Role configs successfully applied!"
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
					`That is not a valid setting! Use one of \`${options.join(
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
				const res = await ConfigModel.findOneAndUpdate(
					{ guildId: message.guild.id },
					{
						$set: {
							[`roles.${args[0]}`]: role.id,
						},
					},
					{ new: true }
				)
				if (res.guildId && res.roles[args[0]] == role.id)
					return message.channel.send(
						"Role setting successfully applied!"
					)
				else {
					console.error("setrolepermissions", res)
					return message.channel.send(
						"An error occured. Please contact developers"
					)
				}
			} catch (e) {
				console.error("setrolepermissions", e)
				message.channel.send("An error occured. Please try again later")
			}
		}
	}
}
module.exports = SetAPIKey
