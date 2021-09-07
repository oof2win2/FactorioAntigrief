const ConfigModel = require("../../database/schemas/config")
const Command = require("../../base/Command")
const fetch = require("node-fetch")

class SetAPIKey extends Command {
	constructor(client) {
		super(client, {
			name: "setapikey",
			description: "Set API key",
			aliases: [],
			usage: "[API KEY]",
			examples: ["{{p}}setapikey potatoKey"],
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
	async run(message, args) {
		if (!args[0]) return message.channel.send("You must provide your API key as a parameter")
		message.delete()
		const apikey = args[0]

		try {
			// TODO: add this fetch to the wrapper and fix this bug of token being wrong etc
			const community = await fetch(`${this.client.config.apiurl}/communities/getown`, {
				headers: { "apikey": apikey }
			}).then((c) => c.json())
			if (!community) return message.reply("That API key is not associated with a community")
			const config = await ConfigModel.findOneAndUpdate({ guildId: message.guild.id }, {
				$set: { "apikey": apikey, "communityId": community.id }
			}, { new: true }).then(c=>c.toObject())
			if (config.apikey && config.guildId === message.guild.id) {
				this.client.users.fetch(config.contact).then(owner=>owner?.send(`User ${message.author} (${message.author.tag}) has set your API key to ||${apikey}||`))
				return message.channel.send(`${message.author} set the API key successfully!`)
			} else throw config
		} catch (error) {
			message.channel.send("Error setting API key. Please check logs.")
			throw error
		}
	}
}
module.exports = SetAPIKey