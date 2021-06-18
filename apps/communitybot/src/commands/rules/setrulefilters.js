const fetch = require("node-fetch")
const { MessageEmbed } = require("discord.js")
const Command = require("../../base/Command")
const { getConfirmationMessage } = require("../../utils/responseGetter")

class SetRuleFilters extends Command {
	constructor(client) {
		super(client, {
			name: "setrulefilters",
			description: "Sets rule filters. [Explanation](https://gist.github.com/oof2win2/370050d3aa1f37947a374287a5e011c4#file-trusted-md)",
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
	async run(message, _, config) {
		const rules = await this.client.fagc.rules.fetchAll()

		let embed = new MessageEmbed()
			.setTitle("FAGC Rules")
			.setColor("GREEN")
			.setTimestamp()
			.setAuthor("FAGC Community")
			.setDescription("Set Filtered Rules. [Explanation](https://gist.github.com/oof2win2/370050d3aa1f37947a374287a5e011c4#file-trusted-md)")

		rules.forEach((rule, i) => {
			if (i && i % 25 == 0) {
				message.channel.send(embed)
				embed.fields = []
			}
			embed.addField(rule.shortdesc, rule.id, true)
		})
		message.channel.send(embed)


		const messageFilter = response => {
			return response.author.id === message.author.id
		}
		message.channel.send("Please type in IDs of rules you wish to use. Type `stop` to stop")

		let ruleFilters = []
		const onEnd = async () => {
			let ruleEmbed = new MessageEmbed()
				.setTitle("FAGC Rules")
				.setColor("GREEN")
				.setTimestamp()
				.setAuthor("FAGC Community")
				.setDescription("Filtered Rules. [Explanation](https://gist.github.com/oof2win2/370050d3aa1f37947a374287a5e011c4#file-trusted-md)")
			ruleFilters.forEach((filteredRuleID, i) => {
				if (i && i % 25 == 0) {
					message.channel.send(ruleEmbed)
					embed.fields = []
				}
				let rule = rules.find(rule => rule.id === filteredRuleID)
				if (!rule.id) return
				ruleEmbed.addField(rule.shortdesc, rule.id, true)
			})
			message.channel.send(ruleEmbed)

			const confirm = await getConfirmationMessage(message, "Are you sure you want your rule filters set to this?")
			if (!confirm) return message.channel.send("Rule setting cancelled")

			const request = await this.client.fagc.communities.setConfig({ruleFilters}, {apikey: config.apikey})
			if (request.guildId === message.guildid) return message.channel.send("Rules have successfully been set")

			message.channel.send("An error has occured. Please try again in some time")
			throw request
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