const { MessageEmbed } = require("discord.js")
const {
	getMessageResponse,
	getConfirmationMessage,
} = require("../../utils/responseGetter")
const Command = require("../../base/Command")
const ConfigModel = require("../../database/schemas/config")

class Setup extends Command {
	constructor(client) {
		super(client, {
			name: "setup",
			description: "Setup your guild",
			aliases: [],
			usage: ["{{p}}setup"],
			category: "config",
			dirname: __dirname,
			enabled: true,
			memberPermissions: ["ADMINISTRATOR"],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			ownerOnly: false,
			cooldown: 3000,
			requiredConfig: false,
			customPermissions: ["setConfig"],
		})
	}
	async run(message, _, config) {
		message.channel.send(
			"Hello! This is the bot setup process for this server"
		)

		const name = (
			await getMessageResponse(
				message,
				"Please type in this community's name"
			)
		)?.content
		if (!name) return message.reply("No community name!")

		const contactID = (
			await getMessageResponse(
				message,
				"Please ping the user to contact in this community"
			)
		)?.mentions.users.first()?.id
		if (contactID === undefined)
			return message.channel.send(
				"Didn't send contact in time or invalid contact mention"
			)
		const contact = await this.client.users.fetch(contactID)
		if (!contact) return message.reply("Contact user is invalid!")

		let embed = new MessageEmbed()
			.setTitle("FAGC Config")
			.setAuthor(`${this.client.user.username} | oof2win2#3149`)
			.setTimestamp()
			.setDescription("Your FAGC Configuration")
		embed.addFields(
			{ name: "Community name", value: name },
			{ name: "Contact", value: `<@${contact.id}> | ${contact.tag}` }
		)
		message.channel.send(embed)

		const confirm = await getConfirmationMessage(
			message,
			"Are you sure you want these settings applied?"
		)
		if (!confirm)
			return message.channel.send("Community configuration cancelled")

		try {
			if (config.apikey) {
				const updatedConfig =
					await this.client.fagc.communities.setConfig(
						{
							communityname: name,
							guildId: message.guild.id,
							contact: contact.id,
							// moderatorRoleId: role,
							ruleFilters: [],
							trustedCommunities: [],
						},
						{
							apikey: config.apikey,
						}
					)

				if (updatedConfig.contact == contact.id)
					return message.channel.send(
						"Community configured successfully! Please run `fagc!setsetcommunityfilters` and `fagc!setrulefilters` to enable more commands (and set those filters)"
					)
				else {
					console.error("setup", updatedConfig)
					return message.channel.send(
						"Configuration unsuccessful. Please check logs"
					)
				}
			} else {
				const updatedConfig = await ConfigModel.findOneAndUpdate(
					{ guildId: message.guild.id },
					{
						communityname: name,
						guildId: message.guild.id,
						contact: contact.id,
						// moderatorRoleId: role,
						ruleFilters: [],
						trustedCommunities: [],
					},
					{ upsert: true, new: true }
				)
				if (updatedConfig.contact == contact.id)
					return message.channel.send(
						"Community configured successfully! Please run `fagc!setsetcommunityfilters` and `fagc!setrulefilters` to enable more commands (and set those filters)"
					)
				else {
					console.error("setup", updatedConfig)
					return message.channel.send(
						"Configuration unsuccessful. Please check logs"
					)
				}
			}
		} catch (error) {
			console.error("setup", error)
			return message.channel.send(
				"Error setting configuration. Please check logs."
			)
		}
	}
}
module.exports = Setup
