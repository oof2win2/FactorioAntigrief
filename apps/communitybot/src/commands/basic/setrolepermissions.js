const Command = require("../../base/Command")
const ConfigModel = require("../../database/schemas/config")
const { MessageEmbed } = require("discord.js")
const { getMessageResponse } = require("../../utils/responseGetter")

class SetAPIKey extends Command {
	constructor(client) {
		super(client, {
			name: "setrolepermissions",
			description: "Set role permissions for command access",
			aliases: ["setroleperms", "setperms"],
			category: "basic",
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
	async run(message) {
		const messageFilter = response => response.author.id === message.author.id

		const violationsMsg = (await getMessageResponse(message.channel.send("Please type in the ID or ping the role for violation management"), messageFilter))
		const violations = violationsMsg.mentions.roles.first()?.id || await message.guild.roles.fetch(violationsMsg.content)
		if (!violations) return message.channel.send(`\`${violationsMsg.content}\` is not a valid role`)

		const webhooksMsg = (await getMessageResponse(message.channel.send("Please type in the ID or ping the role for webhook management"), messageFilter))
		const webhooks = webhooksMsg.mentions.roles.first()?.id || await message.guild.roles.fetch(webhooksMsg.content)
		if (!webhooks) return message.channel.send(`\`${webhooksMsg.content}\` is not a valid role`)

		const configMsg = (await getMessageResponse(message.channel.send("Please type in the ID or ping the role for config management"), messageFilter))
		const config = configMsg.mentions.roles.first()?.id || await message.guild.roles.fetch(configMsg.content)
		if (!config) return message.channel.send(`\`${configMsg.content}\` is not a valid role`)

		const ruleMsg = (await getMessageResponse(message.channel.send("Please type in the ID or ping the role for management of filtered rules"), messageFilter))
		const rules = ruleMsg.mentions.roles.first()?.id || await message.guild.roles.fetch(ruleMsg.content)
		if (!rules) return message.channel.send(`\`${ruleMsg.content}\` is not a valid role`)

		const communitiesMsg = (await getMessageResponse(message.channel.send("Please type in the ID or ping the role for management of trusted communities"), messageFilter))
		const communities = communitiesMsg.mentions.roles.first()?.id || await message.guild.roles.fetch(communitiesMsg.content)
		if (!communities) return message.channel.send(`\`${communitiesMsg.content}\` is not a valid role`)

		let embed = new MessageEmbed()
			.setTitle("FAGC Role Config")
			.setAuthor(`${this.client.user.username} | oof2win2#3149`)
			.setTimestamp()
			.setDescription("Your FAGC Role Configuration")
		embed.addFields(
			{ name: "Violations Management", value: `<@&${violations}>` },
			{ name: "Webhook Management", value: `<@&${webhooks}>` },
			{ name: "Config Management", value: `<@&${config}>` },
			{ name: "Rule Management", value: `<@&${rules}>` },
			{ name: "Communities Management", value: `<@&${communities}>` },
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
			return message.channel.send("Permission configuration cancelled")
		
		try {
			const res = await ConfigModel.findOneAndUpdate({guildid: message.guild.id},
				{
					$set: {
						"roles.violations": violations,
						"roles.webhooks": webhooks,
						"roles.setConfig": config,
						"roles.setRules": rules,
						"roles.setCommunities": communities
					}
				})
			if (res.guildid)
				return message.channel.send("Role configs successfully applied!")
			else
				return message.channel.send("An error occured. Please contact developers")
		} catch (e) {
			console.error({e})
			message.channel.send("An error occured. Please try again later")
		}
	}
}
module.exports = SetAPIKey