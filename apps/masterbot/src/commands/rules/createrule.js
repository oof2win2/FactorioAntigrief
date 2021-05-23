const { MessageEmbed } = require("discord.js")
const { masterapiurl, masterapikey } = require("../../../config")
const fetch = require("node-fetch")

module.exports = {
	config: {
		name: "createrule",
		aliases: [],
		usage: "",
		category: "rules",
		description: "Creates a FAGC rule",
	},
	run: async (client, message) => {
		const messageFilter = (m) => m.author.id === message.author.id
		message.channel.send("Process of creating a new rule has started")
		message.channel.send("Please type in rule short description")
		const shortdesc = (await message.channel.awaitMessages(messageFilter, { max: 1, time: 30000 })).first()?.cleanContent
		if (!shortdesc)
			return message.reply("No valid rule short description entered")
		message.channel.send("Please type in rule long description")
		const longdesc = (await message.channel.awaitMessages(messageFilter, { max: 1, time: 30000 })).first()?.cleanContent
		if (!longdesc)
			return message.reply("No valid contact entered")
		let embed = new MessageEmbed()
			.setTitle("FAGC Community Setup")
			.setAuthor("FAGC Community")
			.setTimestamp()
			.addFields(
				{ name: "Rule short description", value: shortdesc },
				{ name: "Rule long description", value: longdesc }
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
			const communityRaw = await fetch(`${masterapiurl}/rules/create`, {
				method: "POST",
				body: JSON.stringify({
					shortdesc: shortdesc,
					longdesc: longdesc
				}),
				headers: { "apikey": masterapikey, "content-type": "application/json" }
			})
			const rule = await communityRaw.json()
			if (rule._id) {
				let info = new MessageEmbed()
					.setTitle("FAGC Community Setup")
					.setAuthor("FAGC Community")
					.setTimestamp()
					.addFields(
						{ name: "Rule short description", value: rule.shortdesc },
						{ name: "Rule long description", value: rule.longdesc },
						{ name: "Rule ID", value: rule._id }
					)
				message.channel.send(info)
				return message.channel.send("Rule created successfully!")
			} else {
				console.error({ rule })
				return message.channel.send("Error creating rule. Please check logs.")
			}
		} catch (error) {
			console.error({ error })
			return message.channel.send("Error creating rule. Please check logs.")
		}
	},
}
