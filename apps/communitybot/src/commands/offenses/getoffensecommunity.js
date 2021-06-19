const { MessageEmbed } = require("discord.js")
const Command = require("../../base/Command")

class GetAllOffenses extends Command {
	constructor(client) {
		super(client, {
			name: "getoffensecommunity",
			description: "Gets all offenses of a player in a specific community",
			aliases: [],
			usage: "[playername] [communityId]",
			examples: ["{{p}}getalloffenses Windsinger p1UgG0G"],
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
        if (!args[1]) return message.reply("Provide a community ID to get the offense from")
		const playername = args.shift()
        const communityId = args.shift()

        const community = await this.client.fagc.communities.fetchCommunity(communityId)
        if (!community) return message.channel.send(`Community with ID \`${communityId}\` does not exist`)
		const offense = await this.client.fagc.offenses.fetchCommunity(playername, communityId)
		if (!offense) return message.channel.send(`User \`${playername}\` has no offenses in community ${community.name} (\`${community.id}\`)`)

		let embed = new MessageEmbed()
			.setTitle("FAGC Offenses")
			.setColor("GREEN")
			.setTimestamp()
			.setAuthor("FAGC Community")
			.setDescription(`FAGC Offense of player \`${playername}\` in community ${community.name} (\`${community.id}\`)`)
        await Promise.all(offense.violations.map(async (violation, i) => {
            if (i && i % 25 === 0) {
				message.channel.send(embed)
				embed.fields = []
			}
            const rule = await this.client.fagc.rules.fetchRule(violation.brokenRule)
            const admin = await this.client.users.fetch(violation.adminId)
            embed.addField(violation.id,
				`By: <@${violation.adminId}> | ${admin?.tag}\n` +
                `Broken rule: ${rule.shortdesc} (${rule.id})\nProof: ${violation.proof}\n` +
                `Description: ${violation.description}\nAutomated: ${violation.automated}\n` +
                `Violated time: ${(new Date(violation.violatedTime)).toUTCString()}`,
				true
			)
            return
        }))
        if (embed.fields.length) message.channel.send(embed)
	}
}
module.exports = GetAllOffenses