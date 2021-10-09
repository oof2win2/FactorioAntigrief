const { MessageEmbed } = require("discord.js")
const Command = require("../../base/Command")
const { createPagedEmbed } = require("../../utils/functions")

class GetAllRules extends Command {
	constructor(client) {
		super(client, {
			name: "getallrules",
			description: "Gets all rules",
			aliases: ["getallrules", "viewallrules"],
			category: "rules",
			dirname: __dirname,
			enabled: true,
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
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
		for (let i = 0; i < rules.length; i += 5) {
			fields.push({
				name: rules
					.slice(i, i + 5)
					.map((rule) => `${rule.shortdesc} (\`${rule.id}\`)\n`)
					.join(""),
				value: "\u200b",
			})
		}
		createPagedEmbed(fields, embed, message, { maxPageCount: 1 })
	}
}
module.exports = GetAllRules
