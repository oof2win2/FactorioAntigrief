const { MessageEmbed } = require("discord.js")

module.exports = {
	handleErrors,
	createPagedEmbed,
}

/**
 * 
 * @param {Object} msg - Discord message
 * @param {Object} response - API error message
 * @param {String} response.error - API error name
 * @param {String} response.description - API error description
 */
async function handleErrors(msg, response) {
	if (!msg.channel) return
	switch (response.error) {
	case "AuthenticationError": {
		switch (response.description) {
		case "API key is wrong":
			return msg.channel.send("Error: API key has been set incorrectly.")
		}
		break
	}
	default:
		msg.channel.send(`Error \`${response.error}\`: \`${response.description}\``)
	}
}

/**
 * 
 * @param {Array} fields 
 * @param {object} embedMsgOptions
 * @param {embedMsgOptions.author} 
 * @param {object} options
 * @param {options.maxPageCount} maxPageCount - maximum number of things on the page
 */
async function createPagedEmbed(fields, embedMsgOptions, message, options = {}) {
	if (!options.maxPageCount) options.maxPageCount = 25
	if (options.maxPageCount > 25) options.maxPageCount = 25 // discord limit is 25 things per embed
	let embed = new MessageEmbed(embedMsgOptions)
	let page = 0
	// if the amount of pages is 1 then there is actually only one page, f.e. 5/5 = 1 but the program will work with 0, 1
	let maxPages = Math.floor(fields.length / options.maxPageCount)
	if (maxPages === 1) maxPages = 0
	embed.fields = fields.slice(0, options.maxPageCount)
	let embedMsg = await message.channel.send(embed)

	const setData = async () => {
		const start = page * options.maxPageCount
		embed.fields = fields.slice(start, start + options.maxPageCount)
		embedMsg = await embedMsg.edit(null, embed)
	}
	const removeReaction = async (emoteName) => {
		embedMsg.reactions.cache.find(r => r.emoji.name === emoteName).users.remove(message.author.id)
	}
	// if there is only 1 page then no sense to make arrows, just slows other reactions down
	if (maxPages) {
		await embedMsg.react("⬅️")
		await embedMsg.react("➡️")
	}
	await embedMsg.react("🗑️")
	
	const reactionFilter = (reaction, user) => user.id === message.author.id

	const reactionCollector = embedMsg.createReactionCollector(reactionFilter, { timer: 120000 })

	reactionCollector.on("collect", (reaction) => {
		switch (reaction.emoji.name) {
		case "⬅️": {
			page--
			removeReaction("⬅️") // remove the user's reaction no matter what
			if (page == -1) page = 0
			else setData()
			break
		}
		case "➡️": {
			page++
			removeReaction("➡️") // remove the user's reaction no matter what
			if (page > maxPages) page = maxPages
			else setData()
			break
		}
		case "🗑️": {
			reactionCollector.stop()
			embedMsg.delete()
		}
		}
	})
}