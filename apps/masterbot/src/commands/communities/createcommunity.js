const { MessageEmbed } = require("discord.js")
const { masterapiurl, masterapikey } = require("../../../config")
const fetch = require("node-fetch")

module.exports = {
	config: {
		name: "createcommunity",
		aliases: [],
		usage: "",
		category: "communities",
		description: "Creates a FAGC Community (with API key)",
	},
	run: async (client, message) => {
		const messageFilter = (m) => m.author.id === message.author.id
		message.channel.send("Process of creating a new community has started")

		message.channel.send("Please type in community name")
		const name = (await message.channel.awaitMessages(messageFilter, { max: 1, time: 30000 })).first()?.cleanContent
		if (!name) return message.reply("No valid community name entered")
		
		message.channel.send("Please ping the contact user for this community")
		const contactMsg = (await message.channel.awaitMessages(messageFilter, { max: 1, time: 30000 })).first()
		if (!contactMsg) return message.channel.send("No valid contact supplied!")
		const contact = contactMsg.mentions.members.first()?.user || await client.users.fetch(contactMsg.content)
		if (!contact.id) return message.channel.send("User does not exist")
		if (contact.bot) return message.channel.send("User is a bot!")
		
		message.channel.send("Please type in the Guild ID of the community's server")
		const guildid = (await message.channel.awaitMessages(messageFilter, { max: 1, time: 30000 })).first()?.cleanContent
		if (!guildid) return message.channel.send("No guild ID supplied!")
		let embed = new MessageEmbed()
			.setTitle("FAGC Community Setup")
			.setAuthor("FAGC Community")
			.setTimestamp()
			.addFields(
				{name: "Community name", value: name},
				{name: "Contact", value: `<@${contact.id}> | ${contact.tag}`},
				{name: "Guild ID", value: guildid}
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
			return message.channel.send("Community creation cancelled")
		try {
			const communityRaw = await fetch(`${masterapiurl}/communities/create`, {
				method: "POST",
				body: JSON.stringify({
					name: name,
					contact: contact.id,
					guildid: guildid
				}),
				headers: { "apikey": masterapikey, "content-type": "application/json" }
			})
			const community = await communityRaw.json()
			if (community.key && community.community._id) {
				message.author.send(`API key for community ${name} (\`${community.community.readableid}\`), contacted at <@${contact.id}> | ${contact.tag}`)
				message.author.send(`||${community.key}||`)
				return message.channel.send(`Community with ID \`${community.community.readableid}\` created successfully! API key has been sent to your DMs`)
			} else if (community.error == "Bad Request" && community.error.includes("guildid must be Discord Guild snowflake")) {
				message.channel.send("Provided GuildID of community is not valid or the bot is not in it")
			} else {
				console.error({ community })
				return message.channel.send("Error creating community. Please check logs.")
			}
		} catch (error) {
			console.error({ error })
			return message.channel.send("Error creating community. Please check logs.")
		}
	},
}
