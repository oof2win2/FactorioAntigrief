const { MessageEmbed } = require("discord.js")
const ConfigModel = require("../../database/schemas/config")
const Command = require("../../base/Command")
const { createPagedEmbed } = require("../../utils/functions")

class GetViolations extends Command {
	constructor(client) {
		super(client, {
			name: "getfilteredviolations",
			description: "Gets violations of a player from only trusted communities and filtered rules",
			aliases: ["check", "getviolations"],
			category: "violations",
			usage: "[playername]",
			examples: ["{{p}}getfilteredviolations Windsinger"],
			dirname: __dirname,
			enabled: true,
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			ownerOnly: false,
			cooldown: 3000,
			requiredConfig: true
		})
	}
	async run(message, args, config) {
		if (!args[0]) return message.reply("Provide a player name to get violations of")
		if (!config.trustedCommunities) return message.reply("No filtered communities set")
		if (!config.ruleFilters) return message.reply("No filtered rules set")
		const violations = await this.client.fagc.violations.fetchAllName(args[0])
		const communities = await this.client.fagc.communities.fetchAll()

		let embed = new MessageEmbed()
			.setTitle("FAGC Violations")
			.setColor("GREEN")
			.setTimestamp()
			.setAuthor("FAGC Community")
			.setDescription(`FAGC Violations of player \`${args[0]}\``)

		const trustedCommunities = communities.filter((community) => {
			if (config.trustedCommunities.some((trustedID) => { return trustedID === community.id })) return community
		})
		const filteredViolations = violations.map(violation => {
			if (
				trustedCommunities.some((community) => community.id === violation.communityId) &&
				config.ruleFilters.includes(violation.brokenRule)
			) return violation
			return null
		}).filter(v=>v)

		if (!filteredViolations.length)
			return message.channel.send(`Player \`${args[0]}\` doesn't have violations that correspond to your rule and community preferences`)
		const fields = await Promise.all(filteredViolations.map(async (violation) => {
			const admin = await this.client.users.fetch(violation.adminId)
			const rule = await this.client.getOrFetchRule(violation.brokenRule)
			const community = await this.client.getOrFetchCommunity(violation.communityId)
			return {
				name: violation.id,
				value: `By: <@${admin.id}> | ${admin.tag}\nCommunity ID: ${community.name} (${community.id})\n` +
					`Broken rule: ${rule.shortdesc} (${rule.id})\nProof: ${violation.proof}\n` +
					`Description: ${violation.description}\nAutomated: ${violation.automated}\n` +
					`Violated time: ${(new Date(violation.violatedTime)).toUTCString()}`,
				inline: true
			}
		}))
		createPagedEmbed(fields, embed, message, {maxPageCount: 5})
	}
}
module.exports = GetViolations