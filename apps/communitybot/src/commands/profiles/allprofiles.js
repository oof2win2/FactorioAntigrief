const { MessageEmbed } = require("discord.js")
const Command = require("../../base/Command")
const { createPagedEmbed } = require("../../utils/functions")
const { getMessageResponse } = require("../../utils/responseGetter")

class GetAllProfiles extends Command {
	constructor(client) {
		super(client, {
			name: "allprofiles",
			description: "Gets all profiles of a player",
			usage: "[playername]",
			examples: [ "{{p}}allprofiles Windsinger" ],
			category: "profiles",
			dirname: __dirname,
			enabled: true,
			memberPermissions: [],
			botPermissions: [ "SEND_MESSAGES", "EMBED_LINKS" ],
			ownerOnly: false,
			cooldown: 3000,
			requiredConfig: false,
		})
	}
	async run(message, args) {
		if (!args[0])
			args[0] = await getMessageResponse(message, `${this.client.emotes.type} Provide a player name to get profiles of`)
				.then((r) => r?.content)
		const playername = args.shift()
		if (!playername) return message.channel.send(`${this.client.emotes.warn} No player name was provided`)
		
		const profiles = await this.client.fagc.profiles.fetchAll(playername)
		if (!profiles || !profiles[0])
			return message.channel.send(
				`User \`${playername}\` has no profiles!`
			)

		let embed = new MessageEmbed()
			.setTitle("FAGC Profiles")
			.setColor("GREEN")
			.setTimestamp()
			.setAuthor("FAGC Community")
			.setDescription(`FAGC Profiles of player \`${playername}\``)
		const fields = await Promise.all(
			profiles.map(async (profile) => {
				// this is because there is a limit of 6k chars per embed
				const reports = profile.reports.map((report) => report.id)
				const community =
					await this.client.fagc.communities.fetchCommunity({
						communityID: profile.communityId
					})
				return {
					name: `Community ${community?.name} (\`${profile.communityId}\`)`,
					value: `Report ID(s): \`${reports.join("`, `")}\``,
				}
			})
		)
		createPagedEmbed(fields, embed, message, { maxPageCount: 5 })
	}
}
module.exports = GetAllProfiles
