const fetch = require("node-fetch")
const { MessageEmbed } = require("discord.js")
const ConfigModel = require("../../database/schemas/config")
const Command = require("../../base/Command")

class SetRuleFilters extends Command {
	constructor(client) {
		super(client, {
			name: "setrulefilters",
			description: "Sets rule filters",
			aliases: [],
			category: "rules",
			dirname: __dirname,
			enabled: true,
			memberPermissions: ["ADMINISTRATOR"],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			ownerOnly: false,
			cooldown: 3000,
			requiredConfig: true,
			customPermissions: ["setRules"],
		})
	}
	async run(message) {
		const rules = await fetch(`${this.client.config.apiurl}/rules/getall`).then((r) => r.json())

		let embed = new MessageEmbed()
			.setTitle("FAGC Rules")
			.setColor("GREEN")
			.setTimestamp()
			.setAuthor("FAGC Community")
			.setDescription("Set Filtered Rules")

		rules.forEach((rule, i) => {
			if (i && i % 25 == 0) {
				message.channel.send(embed)
				embed.fields = []
			}
			embed.addField(rule.shortdesc, rule.readableid, true)
		})
		message.channel.send(embed)


		const messageFilter = response => {
			return response.author.id === message.author.id
		}
		message.channel.send("Please type in IDs of rules you wish to use. Type `stop` to stop")

		let ruleFilters = []
		const onEnd = async () => {
			const config = await ConfigModel.findOneAndUpdate({ guildid: message.guild.id }, {
				$set: { "ruleFilters": ruleFilters }
			}, { new: true })
			let ruleEmbed = new MessageEmbed()
				.setTitle("FAGC Rules")
				.setColor("GREEN")
				.setTimestamp()
				.setAuthor("FAGC Community")
				.setDescription("Filtered Rules")
			config.ruleFilters.forEach((filteredRuleID, i) => {
				if (i && i % 25 == 0) {
					message.channel.send(ruleEmbed)
					embed.fields = []
				}
				let rule = rules.find(rule => rule.readableid === filteredRuleID)
				ruleEmbed.addField(rule.shortdesc, rule.readableid, true)
			})
			message.channel.send(ruleEmbed)
		}

		let collector = await message.channel.createMessageCollector(messageFilter, { max: Object.keys(rules).length, time: 120000 })
		collector.on("collect", (message) => {
			if (message.content === "stop") collector.stop()
			else ruleFilters.push(message.content)
		})
		collector.on("end", () => {
			message.channel.send("End of collection")
			onEnd()
		})
	}
}
module.exports = SetRuleFilters