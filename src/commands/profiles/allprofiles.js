const { MessageEmbed } = require("discord.js")
const Command = require("../../base/Command")
const { createPagedEmbed } = require("../../utils/functions")

class GetAllProfiles extends Command {
	constructor(client) {
		super(client, {
			name: "allprofiles",
			description: "Gets all profiles of a player",
			usage: "[playername]",
			examples: ["{{p}}allprofiles Windsinger"],
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
	async run(message, args) {
		if (!args[0])
			return message.reply("Provide a player name to get profiles of")
		const playername = args.shift()
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
module.exports = GetAllProfiles
