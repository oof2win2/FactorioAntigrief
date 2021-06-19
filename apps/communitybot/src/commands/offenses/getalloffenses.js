const { MessageEmbed } = require("discord.js")
const Command = require("../../base/Command")
const { createPagedEmbed } = require("../../utils/functions")

class GetAllOffenses extends Command {
	constructor(client) {
		super(client, {
			name: "getalloffenses",
			description: "Gets all offenses of a player",
			aliases: [],
			usage: "[playername]",
			examples: ["{{p}}getalloffenses Windsinger"],
			category: "offenses",
			dirname: __dirname,
			enabled: true,
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			ownerOnly: false,
			cooldown: 3000,
			requiredConfig: false,
		})
	}
	async run (message, args) {
		if (!args[0]) return message.reply("Provide a player name to get offenses of")
		const playername = args.shift()
		const offenses = await this.client.fagc.offenses.fetchAll(playername)
		if (!offenses || !offenses[0]) return message.channel.send(`User \`${playername}\` has no offenses!`)

		let embed = new MessageEmbed()
			.setTitle("FAGC Offenses")
			.setColor("GREEN")
			.setTimestamp()
			.setAuthor("FAGC Community")
			.setDescription(`FAGC Offense of player \`${playername}\``)
		const fields = await Promise.all(offenses.map(async (offense) => {
			const violations = offense.violations.map((violation) => { return violation.id })
			const community = await this.client.getOrFetchCommunity(offense.communityId)
			return {
				name: `Community ${community.name} (\`${offense.communityId}\`)`,
				value:  `Violation ID(s): \`${violations.join("`, `")}\``
			}
		}))
		createPagedEmbed(fields, embed, message, {maxPageCount: 5})
	}
}
module.exports = GetAllOffenses