const { MessageEmbed } = require("discord.js")
const Command = require("../../base/Command")
const { createPagedEmbed } = require("../../utils/functions")

class GetAllProfiles extends Command {
	constructor(client) {
		super(client, {
			name: "profile",
			description: "Gets the profile of a player in a specific community",
			usage: "[playername] (communityId)",
			examples: [
				"{{p}}profile Windsinger p1UgG0G",
				"{{p}}profile Windsinger",
			],
			category: "profiles",
			dirname: __dirname,
			enabled: true,
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			ownerOnly: false,
			cooldown: 3000,
			requiredConfig: false,
		})
	}
	async run(message, args, config) {
		if (!args[0])
			return message.reply("Provide a player name to get profiles of")
		const playername = args.shift()
		const communityId = args.shift() || config.communityId
		if (!communityId)
			return message.channel.send(
				"You do not have a community ID set and none was provided"
			)

		const community = await this.client.fagc.communities.fetchCommunity(
			communityId
		)
		if (!community)
			return message.channel.send(
				`Community with ID \`${communityId}\` does not exist`
			)
		const profile = await this.client.fagc.profiles.fetchCommunity(
			playername,
			communityId
		)
		if (!profile || !profile.reports.length)
			return message.channel.send(
				`User \`${playername}\` has no profile in community ${community.name} (\`${community.id}\`)`
			)

		let embed = new MessageEmbed()
			.setTitle("FAGC Profile")
			.setColor("GREEN")
			.setTimestamp()
			.setAuthor("FAGC Community")
			.setDescription(
				`FAGC Profile of player \`${playername}\` in community ${community.name} (\`${community.id}\`)`
			)
		const fields = await Promise.all(
			profile.reports.map(async (report) => {
				const rule = await this.client.fagc.rules.fetchRule(
					report.brokenRule
				)
				const admin = await this.client.users.fetch(report.adminId)
				return {
					name: report.id,
					value:
						`By: <@${report.adminId}> | ${admin?.tag}\n` +
						`Broken rule: ${rule.shortdesc} (${rule.id})\nProof: ${report.proof}\n` +
						`Description: ${report.description}\nAutomated: ${report.automated}\n` +
						`Violated time: <t:${Math.round(
							report.reportedTime.valueOf() / 1000
						)}>`,
					inline: true,
				}
			})
		)
		createPagedEmbed(fields, embed, message, { maxPageCount: 5 })
	}
}
module.exports = GetAllProfiles
