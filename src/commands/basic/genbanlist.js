const fetch = require("node-fetch")
const { MessageAttachment } = require("discord.js")
const Command = require("../../base/Command")

class Genbanlist extends Command {
	constructor(client) {
		super(client, {
			name: "generatebanlist",
			description: "Creates a .json banlist file to use for servers",
			aliases: ["banlist", "genbanlist"],
			category: "basic",
			dirname: __dirname,
			enabled: true,
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			ownerOnly: false,
			cooldown: 5000,
			requiredConfig: true
		})
	}
	async run(message, _, config) {
		if (!config.trustedCommunities) return message.reply("Please set trusted communities first")
		if (!config.ruleFilters) return message.reply("Please set rule filters first")
		message.reply("Processing banlist. Please wait")

		// get all violations based off of followed rules
		let rulePromises = config.ruleFilters.map((rule) => {
			return fetch(`${this.client.config.apiurl}/violations/getbyrule?id=${rule}`).then(res => res.json())
		})
		let ruleViolations = await Promise.all(rulePromises)
		let violationArr = []
		ruleViolations.forEach((violations) => {
			violations.forEach((violation) => {
				violationArr.push(violation)
			})
		})

		// filter violations so only trusted communities are on the banlist
		console.log(config.trustedCommunities)
		violationArr = violationArr.filter((violation) => config.trustedCommunities.includes(violation.communityid))
		// remove duplicates
		violationArr = violationArr.filter((violation, i) => violationArr.indexOf(violation) === i)

		// create & send banlist
		let banlist = violationArr.map((violation) => {
			return {
				username: violation.playername,
				reason: `Banned on FAGC. Please check one of the community Discord servers or go to ${this.client.config.apiurl}/offenses/getall?playername=${violation.playername}`
			}
		})
		// using (null, 4) in JSON.stringify() to have nice formatting - 4 = 4 spaces for tab
		let file = new MessageAttachment(Buffer.from(JSON.stringify(banlist, null, 4)), "banlist.json")
		await message.channel.send("Banlist attatched", {
			files: [file]
		})
	}
}

module.exports = Genbanlist