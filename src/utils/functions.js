const { MessageEmbed } = require("discord.js")
const ConfigModel = require("../database/schemas/config")

module.exports = {
	handleErrors,
	createPagedEmbed,
	createGuildConfig,
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
					return msg.channel.send(
						"Error: API key has been set incorrectly."
					)
			}
			break
		}
		default:
			msg.channel.send(
				`Error \`${response.error}\`: \`${response.description}\``
			)
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
async function createPagedEmbed(
	fields,
	embedMsgOptions,
	message,
	options = {}
) {
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
		embedMsg.reactions.cache
			.find((r) => r.emoji.name === emoteName)
			.users.remove(message.author.id)
	}
	// if there is only 1 page then no sense to make arrows, just slows other reactions down
	if (maxPages) {
		await embedMsg.react("⬅️")
		await embedMsg.react("➡️")
	}
	await embedMsg.react("🗑️")

	const reactionFilter = (reaction, user) => user.id === message.author.id

	const reactionCollector = embedMsg.createReactionCollector(reactionFilter, {
		timer: 120000,
	})

	// remove reactions after timeout runs out
	setTimeout(async () => {
		await embedMsg.reactions.cache.get("⬅️")?.remove()
		await embedMsg.reactions.cache.get("➡️")?.remove()
		await embedMsg.reactions.cache.get("🗑️")?.remove()
	}, 120000)

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

async function createGuildConfig(guild, client) {
	const owner = guild.owner || (await client.users.fetch(guild.ownerID))
	// create initial config only if it doesn't exist yet
	ConfigModel.findOne({ guildId: guild.id }).then((config) => {
		if (config) return
		console.log(`Creating config for guild with ID ${guild.id}`)
		ConfigModel.create({
			communityname: guild.name,
			guildId: guild.id,
			contact: owner.id,
			apikey: "",
		})
	})
	let embed = new MessageEmbed()
		.setTitle("Welcome to FAGC")
		.setColor(client.config.embeds.color)
		.setFooter(client.config.embeds.footer)
		.setTimestamp()
	embed.addFields(
		{ name: "FAGC Invite", value: client.config.fagcInvite },
		{
			name: "Initial Setup",
			value:
				"We assume that you want to set your guild up. For now, your guild data has been set to a few defaults, " +
				"such as the guild contact being the guild's owner. Everything with the API is readonly until you run `fagc!setapikey`. " +
				"Run `fagc!help` to view command help. Commands don't work in DMs!",
		},
		{
			name: "Bot Prefix",
			value: "The bot prefix is, and always will be, `fagc!`. This is displayed in the bot's status",
		}
	)
	if (guild.systemChannel) {
		await guild.systemChannel.createOverwrite(client.user.id, {
			SEND_MESSAGES: true,
			EMBED_LINKS: true,
			ATTACH_FILES: true,
		})
		guild.systemChannel.send(embed)
	} else {
		try {
			owner.send(embed)
			// eslint-disable-next-line no-empty
		} catch {}
	}
}
