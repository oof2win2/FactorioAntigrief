const { MessageEmbed } = require("discord.js")
const Command = require("../../base/Command")

class GetAllViolations extends Command {
	constructor(client) {
		super(client, {
			name: "getallviolations",
			description: "Gets all violations of a player",
			aliases: ["checkall"],
			category: "violations",
			usage: "[playername]",
			examples: ["{{p}}getallviolations Windsinger"],
			dirname: __dirname,
			enabled: true,
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			ownerOnly: false,
			cooldown: 3000,
			requiredConfig: false
		})
	}
	async run (message, args) {
		if (!args[0]) return message.reply("Provide a player name to get violations of")
		const violations = await this.client.fagc.violations.fetchAllName(args[0])
		if (!violations[0])
			return message.reply(`Player \`${args[0]}\` doesn't have any violations`)
		let embed = new MessageEmbed()
			.setTitle("FAGC Violations")
			.setColor("ORANGE")
			.setTimestamp()
			.setAuthor("FAGC Community")
			.setDescription(`FAGC Violations of player \`${args[0]}\``)
		
		await Promise.all(violations.map(async (violation, i) => {
			if (i && i % 25 == 0) {
				message.channel.send(embed)
				embed.fields = []
			}
			const admin = await this.client.users.fetch(violation.adminId)
			const rule = await this.client.getOrFetchRule(violation.brokenRule)
			const community = await this.client.getOrFetchCommunity(violation.communityId)
			embed.addField(violation.id,
				`By: <@${admin.id}> | ${admin.tag}\nCommunity ID: ${community.name} (${community.id})\n` +
                `Broken rule: ${rule.shortdesc} (${rule.id})\nProof: ${violation.proof}\n` +
                `Description: ${violation.description}\nAutomated: ${violation.automated}\n` +
                `Violated time: ${(new Date(violation.violatedTime)).toUTCString()}`,
				true
			)
		}))
		message.channel.send(embed)
	}
}
module.exports = GetAllViolations
