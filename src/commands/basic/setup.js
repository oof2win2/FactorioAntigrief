const { MessageEmbed } = require("discord.js")
const { getMessageResponse } = require("../../utils/responseGetter")
const Command = require("../../base/Command")
const ConfigModel = require("../../database/schemas/config")
const fetch = require("node-fetch")
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
		})
	}
	async run (message) {
		const messageFilter = response => {
			return response.author.id === message.author.id
		}
		message.channel.send("Hello! This is the bot setup process for this server")

		const name = (await getMessageResponse(message.channel.send("Please type in this community's name"), messageFilter))?.content

		const contact = (await getMessageResponse(message.channel.send("Please type in a contact for this server or the server's owner"), messageFilter))?.content
		if (contact === undefined) return message.channel.send("Didn't send contact in time")

		let roleMessage = (await getMessageResponse(message.channel.send("Please ping (or type in the ID of) your role of people which can create violations"), messageFilter))
		let role
		if (roleMessage.mentions.roles.first()) role = roleMessage.mentions.roles.first().id
		else role = roleMessage.content
		if (message.guild.roles.cache.get(role) === undefined) return message.channel.send("Role is not correct")

		const apikeyMessage = await getMessageResponse(message.channel.send("Please type in your API key that you recieved from the FAGC team, if you did recieve one. Type `none` if you didn't"), messageFilter)
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
			{ name: "Contact", value: contact },
			{ name: "Moderator role", value: `<@&${role}>` },
			{ name: "API key", value: apikey ? "Hidden" : "None" }
		)
		message.channel.send(embed)
		const confirm = await message.channel.send("Are you sure you want these settings applied?")
		confirm.react("✅")
		confirm.react("❌")
		const reactionFilter = (reaction, user) => {
			return user.id == message.author.id
		}
		let reactions
		try {
			reactions = await confirm.awaitReactions(reactionFilter, { max: 1, time: 120000, errors: ["time"] })
		} catch (error) {
			return message.channel.send("Timed out.")
		}
		let reaction = reactions.first()
		if (reaction.emoji.name === "❌")
			return message.channel.send("Community configuration cancelled")

		try {
			await ConfigModel.findOneAndUpdate({guildid: message.guild.id}, {
				$set: {apikey: apikey}
			})
			let config = await fetch(`${this.client.config.apiurl}/communities/setconfig`, {
				method: "POST",
				body: JSON.stringify({
					communityname: name,
					guildid: message.guild.id,
					contact: contact,
					moderatorroleId: role,
					apikey: apikey,
				}),
				headers: { "apikey": apikey, "content-type": "application/json" }
			}).then((r) => r.json())
			
			if (config.moderatorroleId === role)
				return message.channel.send("Community configured successfully! Please run `fagc!setsetcommunityfilters` and `fagc!setrulefilters` to enable more commands (and set those filters)")
			else {
				console.error({config}, Date.now())
				return message.channel.send("Configuration unsuccessful. Please check logs")
			}
		} catch (error) {
			console.error({ error })
			return message.channel.send("Error setting configuration. Please check logs.")
		}
	}
}
module.exports = Setup