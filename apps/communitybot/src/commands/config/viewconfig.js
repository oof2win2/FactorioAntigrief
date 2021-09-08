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
		embed.addFields(
			{ name: "Community name", value: config.communityname, inline: true },
			{ name: "Community contact", value: `<@${config.contact}> | ${config.contact}`, inline: true },
			// { name: "Moderator role", value: `<@&${config.moderatorroleId}> | ${config.moderatorroleId}`, inline: true },
			{ name: "API key", value: config.apikey ? "Set" : "None", inline: true },
			{ name: "Report management role", value: `<@&${config.roles.reports}> | ${config.roles.reports}`, inline: true },
			{ name: "Webhook management role", value: `<@&${config.roles.webhooks}> | ${config.roles.webhooks}`, inline: true },
			{ name: "Config management role", value: `<@&${config.roles.setConfig}> | ${config.roles.setConfig}`, inline: true },
			{ name: "Rule filter management role", value: `<@&${config.roles.setRules}> | ${config.roles.setRules}`, inline: true },
			{ name: "Trusted communities management role", value: `<@&${config.roles.setCommunities}> | ${config.roles.setCommunities}`, inline: true }
		)

		return message.channel.send(embed)
	}
}
module.exports = ViewConfig