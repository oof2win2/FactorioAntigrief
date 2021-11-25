const { MessageEmbed } = require("discord.js")
const Command = require("../../base/Command")
const { createPagedEmbed } = require("../../utils/functions")
const { getMessageResponse } = require("../../utils/responseGetter")

class GetProfiles extends Command {
	constructor(client) {
		super(client, {
			name: "profiles",
			description:
				"Gets profiles of a player, filtered by trusted communities and rules",
			usage: "[playername]",
			examples: [ "{{p}}profiles Windsinger" ],
			category: "profiles",
			dirname: __dirname,
			enabled: true,
			memberPermissions: [],
			botPermissions: [ "SEND_MESSAGES", "EMBED_LINKS" ],
			ownerOnly: false,
			cooldown: 3000,
			requiredConfig: true,
		})
	}
	async run(message, args, config) {
		if (!args[0])
			args[0] = await getMessageResponse(message, `${this.client.emotes.type} Provide a player name to get profiles of`)
				.then((r) => r?.content)
		const playername = args.shift()
		if (!playername) return message.channel.send(`${this.client.emotes.warn} No player name was provided`)
		
		if (!config.trustedCommunities || !config.trustedCommunities[0])
			return message.reply(`${this.client.emotes.warn} Please set trusted communities first`)

		const profiles = await Promise.all(
			config.trustedCommunities.map((communityId) =>
				this.client.fagc.profiles.fetchCommunity(
					playername,
					communityId
				)
			)
		)
		if (!profiles || !profiles[0])
			return message.channel.send(
				`User \`${playername}\` has no profiles`
			)

		let embed = new MessageEmbed()
			.setTitle("FAGC Profiles")
			.setColor("GREEN")
			.setTimestamp()
			.setAuthor("FAGC Community")
			.setDescription(`FAGC Profiles of player \`${playername}\``)

		const filteredProfiles = profiles.filter((profile) =>
			config.trustedCommunities.includes(profile.communityId)
		)
		if (!filteredProfiles[0])
			return message.channel.send(
				`User \`${playername}\` has no profiles that correspond to your filters`
			)
		const fields = await Promise.all(
			profiles.map(async (profile) => {
				const reports = profile.reports.map((report) => report.id)
				const community =
					await this.client.fagc.communities.fetchCommunity(
						profile.communityId
					)
				return {
					name: `Community ${community.name} (\`${profile.communityId}\`)`,
					value: `Report ID(s): \`${reports.join("`, `")}\``,
				}
			})
		)
		createPagedEmbed(fields, embed, message, { maxPageCount: 5 })
	}
}

module.exports = GetProfiles
