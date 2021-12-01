const { MessageEmbed } = require("discord.js")
const Command = require("../../base/Command")
const { createPagedEmbed } = require("../../utils/functions")

class GetAllRules extends Command {
	constructor(client) {
		super(client, {
			name: "allrules",
			description: "Gets all rules",
			category: "rules",
			dirname: __dirname,
			enabled: true,
			memberPermissions: [],
			botPermissions: [ "SEND_MESSAGES", "EMBED_LINKS" ],
			ownerOnly: false,
			cooldown: 3000,
		})
	}
	async run(message) {
		const rules = await this.client.fagc.rules.fetchAll()

		let embed = new MessageEmbed()
			.setTitle("FAGC Rules")
			.setColor("GREEN")
			.setTimestamp()
			.setAuthor("FAGC Community")
			.setDescription("All FAGC Rules")
		let fields = []
		for (let i = 0; i < rules.length; i += 10) {
			fields.push({
				value: rules
					.slice(i, i + 10)
					.map((rule) => `**${rule.shortdesc}** (\`${rule.id}\`)\n`)
					.join(""),
				name: "\u200b",
			})
		}
		console.log(fields.length)
		createPagedEmbed(fields, embed, message, { maxPageCount: 1 })
	}
}
module.exports = GetAllRules
