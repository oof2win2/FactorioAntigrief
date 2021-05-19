const { MessageEmbed } = require("discord.js")
const { apiurl, apikey } = require("../../../config")
const fetch = require("node-fetch")

module.exports = {
	config: {
		name: "removerule",
		aliases: [],
		usage: "",
		category: "rules",
		description: "Removes a FAGC rule",
	},
	run: async (client, message, args) => {
		if (!args[0]) return message.reply("Supply a Rule ObjectID")
		let rule = await fetch(`${apiurl}/rules/getid?id=${args[0]}`)
		rule = await rule.json()
		if (!rule || !rule.shortdesc) return message.reply(`Rule with ObjectID ${args[0]} does not exist`)
		let embed = new MessageEmbed()
			.setTitle("FAGC Community Setup")
			.setAuthor("FAGC Community")
			.setTimestamp()
			.addFields(
				{ name: "Rule short description", value: rule.shortdesc },
				{ name: "Rule long description", value: rule.longdesc }
			)
		message.channel.send(embed)
		const confirm = await message.channel.send("Are you sure you want to remove this rule?")
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
			return message.channel.send("Rule removal cancelled")
		try {
			const communityRaw = await fetch(`${apiurl}/rules/remove`, {
				method: "DELETE",
				body: JSON.stringify({
					id: args[0]
				}),
				headers: { "apikey": apikey, "content-type": "application/json" }
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
				return message.channel.send("Rule removed successfully!")
			} else {
				console.error({ rule })
				return message.channel.send("Error removing rule. Please check logs.")
			}
		} catch (error) {
			console.error({ error })
			return message.channel.send("Error removing rule. Please check logs.")
		}
	},
}
