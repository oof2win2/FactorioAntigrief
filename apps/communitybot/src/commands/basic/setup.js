const { MessageEmbed } = require("discord.js")
const { getMessageResponse, getConfirmationMessage } = require("../../utils/responseGetter")
const Command = require("../../base/Command")

class Setup extends Command {
	constructor(client) {
		super(client, {
			name: "setup",
			description: "Setup your guild",
			aliases: [],
			usage: ["{{p}}setup"],
			category: "basic",
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
	async run (message, _, config) {
		if (!config.apikey) return message.reply("No API key set")

		message.channel.send("Hello! This is the bot setup process for this server")

		const name = (await getMessageResponse(message, "Please type in this community's name"))?.content
		if (!name) return message.reply("No community name!")

		const contactID = (await getMessageResponse(message, "Please ping the user to contact in this community"))?.mentions.users.first()?.id
		if (contactID === undefined) return message.channel.send("Didn't send contact in time or invalid contact mention")
		const contact = await this.client.users.fetch(contactID)
		if (!contact) return message.reply("Contact user is invalid!")

		let roleMessage = (await getMessageResponse(message, "Please ping (or type in the ID of) your role of people which can create reports"))
		let role
		if (roleMessage.mentions.roles.first()) role = roleMessage.mentions.roles.first().id
		else role = roleMessage.content
		if (message.guild.roles.cache.get(role) === undefined) return message.channel.send("Role is not correct")

		const apikeyMessage = await getMessageResponse(message, "Please type in your API key that you recieved from the FAGC team, if you did recieve one. Type `none` if you didn't")
		apikeyMessage.delete()
		let apikey
		if (apikeyMessage.content === "none") apikey = undefined
		else apikey = apikeyMessage.content
		
		let embed = new MessageEmbed()
			.setTitle("FAGC Config")
			.setAuthor(`${this.client.user.username} | oof2win2#3149`)
			.setTimestamp()
			.setDescription("Your FAGC Configuration")
		embed.addFields(
			{ name: "Community name", value: name },
			{ name: "Contact", value: `<@${contact.id}> | ${contact.tag}` },
			{ name: "Moderator role", value: `<@&${role}>` },
			{ name: "API key", value: apikey ? "Hidden" : "None" }
		)
		message.channel.send(embed)

		const confirm = await getConfirmationMessage(message, "Are you sure you want these settings applied?")
		if (!confirm)
			return message.channel.send("Community configuration cancelled")
		
		try {
			const updatedConfig = await this.client.fagc.communities.setConfig({
				communityname: name,
				guildId: message.guild.id,
				contact: contact.id,
				moderatorRoleId: role,
				apikey: apikey,
				ruleFilters: [],
				trustedCommunities: [],
			}, {
				apikey: config.apikey
			})
			
			if (updatedConfig.moderatorRoleId === role)
				return message.channel.send("Community configured successfully! Please run `fagc!setsetcommunityfilters` and `fagc!setrulefilters` to enable more commands (and set those filters)")
			else {
				console.error("setup", config)
				return message.channel.send("Configuration unsuccessful. Please check logs")
			}
		} catch (error) {
			console.error("setup", error)
			return message.channel.send("Error setting configuration. Please check logs.")
		}
	}
}
module.exports = Setup