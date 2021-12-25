const { MessageAttachment } = require("discord.js")
const Command = require("../../base/Command")

class Genbanlist extends Command {
	constructor(client) {
		super(client, {
			name: "generatebanlist",
			description: "Creates a .json banlist file to use for servers",
			aliases: [ "banlist", "genbanlist" ],
			category: "basic",
			dirname: __dirname,
			enabled: true,
			memberPermissions: [],
			botPermissions: [ "SEND_MESSAGES", "EMBED_LINKS" ],
			ownerOnly: false,
			cooldown: 5000,
			requiredConfig: true,
		})
	}
	async run(message, _, config) {
		if (!config.trustedCommunities || !config.trustedCommunities.length)
			return message.reply(`${this.client.emotes.warn} Please set trusted communities first`)
		if (!config.ruleFilters || !config.ruleFilters.length)
			return message.reply(`${this.client.emotes.warn} Please set rule filters first`)
		message.reply("Processing banlist. Please wait")

		const reports = await this.client.fagc.reports.listFiltered({
			communityIDs: config.trustedCommunities,
			ruleIDs: config.ruleFilters
		})

		const playerNames = new Set()
		reports.forEach((report) => {
			playerNames.add(report.playername)
		})

		// create & send banlist
		const banlist = Array.from(playerNames).map((playername) => {
			return {
				username: playername,
				reason: `Banned on FAGC. Please check one of the community Discord servers or go to ${this.client.env.APIURL}/profiles/getall?playername=${playername}`,
			}
		})
		// using (null, 4) in JSON.stringify() to have nice formatting - 4 = 4 spaces for tab
		const file = new MessageAttachment(
			Buffer.from(JSON.stringify(banlist, null, 4)),
			"banlist.json"
		)
		await message.channel.send("Banlist attatched", {
			files: [ file ],
		})
	}
}

module.exports = Genbanlist
