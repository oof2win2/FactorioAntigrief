import { MessageEmbed } from "discord.js";
import { Command } from "../../base/Command";

const ViewConfig: Command = {
	name: "viewconfig",
	description: "View your guild config",
	aliases: [],
	examples: ["viewconfig"],
	usage: "",
	category: "config",
	requiresRoles: false,
	run: async({client,message,guildConfig}) => {
		const embed = new MessageEmbed()
			.setTitle("FAGC Config")
			.setAuthor({name: "FAGC Team"})
			.setTimestamp()
			.setDescription("Your FAGC Configuration")
		const community = guildConfig.communityId  ? await client.fagc.communities.fetchCommunity({ communityId: guildConfig.communityId }) : null
		
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
				value: guildConfig.apiKey ? "Set" : "None",
				inline: true,
			},
			{
				name: "Report management",
				value: guildConfig.roles.reports
					? `<@&${guildConfig.roles.reports}> | ${guildConfig.roles.reports}`
					: "No role",
				inline: true,
			},
			{
				name: "Webhook management",
				value: guildConfig.roles.webhooks
					? `<@&${guildConfig.roles.webhooks}> | ${guildConfig.roles.webhooks}`
					: "No role",
				inline: true,
			},
			{
				name: "Config management",
				value: guildConfig.roles.setConfig
					? `<@&${guildConfig.roles.setConfig}> | ${guildConfig.roles.setConfig}`
					: "No role",
				inline: true,
			},
			{
				name: "Rule filter management",
				value: guildConfig.roles.setRules
					? `<@&${guildConfig.roles.setRules}> | ${guildConfig.roles.setRules}`
					: "No role",
				inline: true,
			},
			{
				name: "Trusted communities management",
				value: guildConfig.roles.setCommunities
					? `<@&${guildConfig.roles.setCommunities}> | ${guildConfig.roles.setCommunities}`
					: "No role",
				inline: true,
			}
		)

		return message.channel.send({
			embeds: [embed]
		})
	}
}
export default ViewConfig