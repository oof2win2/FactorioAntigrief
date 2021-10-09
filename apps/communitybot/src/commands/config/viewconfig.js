const { MessageEmbed } = require("discord.js")
const Command = require("../../base/Command")

class ViewConfig extends Command {
	constructor(client) {
		super(client, {
			name: "viewconfig",
			description: "View your guild config",
			aliases: [],
			usage: ["{{p}}viewconfig"],
			category: "config",
			dirname: __dirname,
			enabled: true,
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			ownerOnly: false,
			cooldown: 3000,
			requiredConfig: true,
		})
	}
	async run(message, _, config) {
		const embed = new MessageEmbed()
			.setTitle("FAGC Config")
			.setAuthor(`${this.client.user.username} | oof2win2#3149`)
			.setTimestamp()
			.setDescription("Your FAGC Configuration")
		const community = await this.client.fagc.communities.fetchCommunity(
			config.communityId
		)
		embed.addFields(
			{
				name: "Community name",
				value: community ? community.name : "Community does not exist",
				inline: true,
			},
			{
				name: "Community contact",
				value: community
					? `<@${community.contact}> | ${community.contact}`
					: "Community does not exist",
				inline: true,
			},
			{
				name: "API key",
				value: config.apikey ? "Set" : "None",
				inline: true,
			},
			{
				name: "Report management",
				value: config.roles.reports
					? `<@&${config.roles.reports}> | ${config.roles.reports}`
					: "No role",
				inline: true,
			},
			{
				name: "Webhook management",
				value: config.roles.webhooks
					? `<@&${config.roles.webhooks}> | ${config.roles.webhooks}`
					: "No role",
				inline: true,
			},
			{
				name: "Config management",
				value: config.roles.setConfig
					? `<@&${config.roles.setConfig}> | ${config.roles.setConfig}`
					: "No role",
				inline: true,
			},
			{
				name: "Rule filter management",
				value: config.roles.setRules
					? `<@&${config.roles.setRules}> | ${config.roles.setRules}`
					: "No role",
				inline: true,
			},
			{
				name: "Trusted communities management",
				value: config.roles.setCommunities
					? `<@&${config.roles.setCommunities}> | ${config.roles.setCommunities}`
					: "No role",
				inline: true,
			}
		)

		return message.channel.send(embed)
	}
}
module.exports = ViewConfig
