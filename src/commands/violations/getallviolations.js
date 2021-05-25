const fetch = require("node-fetch")
const { MessageEmbed, Collection } = require("discord.js")
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
		const violationsRaw = await fetch(`${this.client.config.apiurl}/violations/getall?playername=${args[0]}`)
		const violations = await violationsRaw.json()
		if (!violations[0])
			return message.reply(`Player \`${args[0]}\` doesn't have any violations`)
		let embed = new MessageEmbed()
			.setTitle("FAGC Violations")
			.setColor("ORANGE")
			.setTimestamp()
			.setAuthor("FAGC Community")
			.setDescription(`FAGC Violations of player \`${args[0]}\``)
		
		const CachedCommunities = new Collection()
		const getOrFetchCommunity = async (communityid) => {
			if (CachedCommunities.get(communityid)) return CachedCommunities.get(communityid)
			const community = await fetch(`${this.client.config.apiurl}/communities/getid?id=${communityid}`).then((c) => c.json())
			CachedCommunities.set(communityid, community)
			return community
		}
		const CachedRules = new Collection()
		const getOrFetchRule = async (ruleid) => {
			if (CachedRules.get(ruleid)) return CachedRules.get(getOrFetchCommunity)
			const rule = await fetch(`${this.client.config.apiurl}/rules/getid?id=${ruleid}`).then((c) => c.json())
			CachedRules.set(ruleid, rule)
			return rule
		}
		
		await Promise.all(violations.map(async (violation, i) => {
			if (i && i % 25 == 0) {
				message.channel.send(embed)
				embed.fields = []
			}
			const admin = await this.client.users.fetch(violation.admin_id)
			const rule = await getOrFetchRule(violation.broken_rule)
			const community = await getOrFetchCommunity(violation.communityid)
			embed.addField(violation.id,
				`By: <@${admin.id}> | ${admin.tag}\nCommunity ID: ${community.name} (${community.id})\n` +
                `Broken rule: ${rule.shortdesc} (${rule.id})\nProof: ${violation.proof}\n` +
                `Description: ${violation.description}\nAutomated: ${violation.automated}\n` +
                `Violated time: ${(new Date(violation.violated_time)).toUTCString()}`,
				true
			)
		}))
		message.channel.send(embed)
	}
}
module.exports = GetAllViolations
