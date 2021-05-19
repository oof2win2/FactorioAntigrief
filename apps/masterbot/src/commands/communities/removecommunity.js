const { MessageEmbed } = require("discord.js")
const { apiurl, apikey } = require("../../../config")
const fetch = require("node-fetch")

module.exports = {
	config: {
		name: "removecommunity",
		aliases: [],
		usage: "<community ID>",
		category: "communities",
		description: "Removes a FAGC community",
	},
	run: async (client, message, args) => {
		if (!args[0]) return message.reply("No CommunityID given")
		const communityRaw = await fetch(`${apiurl}/communities/getid?id=${args[0]}`)
		const community = await communityRaw.json()
		if (!community) return message.reply(`No community with ObjectID ${args[0]} does not exist`)
		let embed = new MessageEmbed()
			.setTitle("FAGC Community Setup")
			.setAuthor("FAGC Community")
			.setTimestamp()
			.addFields(
				{ name: "Community name", value: community.name },
				{ name: "Contact", value: `<@${community.contact}> | ${client.users.cache.get(community.contact).tag || (await client.users.fetch(community.contact)).tag}` }
			)
		message.channel.send(embed)
		const confirm = await message.channel.send("Are you sure you want to remove this community?")
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
			return message.channel.send("Community removal cancelled")
		try {
			const communityRaw = await fetch(`${apiurl}/communities/remove`, {
				method: "DELETE",
				body: JSON.stringify({
					id: args[0]
				}),
				headers: { "apikey": apikey, "content-type": "application/json" }
			})
			const community = await communityRaw.json()
			if (community._id) {
				return message.channel.send("Community removed!")
			} else {
				console.error({ community })
				return message.channel.send("Error removing community. Please check logs.")
			}
		} catch (error) {
			console.error({ error })
			return message.channel.send("Error creating community. Please check logs.")
		}
	},
}
