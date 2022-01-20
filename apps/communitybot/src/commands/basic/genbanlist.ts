import { Command } from "../../base/Command";
import {Report} from "fagc-api-types"
import { MessageAttachment } from "discord.js";

// class Genbanlist extends Command {
// 	constructor(client) {
// 		super(client, {
// 			name: "generatebanlist",
// 			description: "Creates a .json banlist file to use for servers",
// 			aliases: [ "banlist", "genbanlist" ],
// 			category: "basic",
// 			dirname: __dirname,
// 			enabled: true,
// 			memberPermissions: [],
// 			botPermissions: [ "SEND_MESSAGES", "EMBED_LINKS" ],
// 			ownerOnly: false,
// 			cooldown: 5000,
// 			requiredConfig: true,
// 		})
// 	}
// 	async run(message, _, config) {
// 		if (!config.trustedCommunities || !config.trustedCommunities.length)
// 			return message.reply(`${this.client.emotes.warn} Please set trusted communities first`)
// 		if (!config.ruleFilters || !config.ruleFilters.length)
// 			return message.reply(`${this.client.emotes.warn} Please set rule filters first`)
// 		message.reply("Processing banlist. Please wait")

// 		const reports = await this.client.fagc.reports.list({
// 			communityIDs: config.trustedCommunities,
// 			ruleIDs: config.ruleFilters
// 		})

// 		const playerNames = new Set()
// 		reports.forEach((report) => {
// 			playerNames.add(report.playername)
// 		})

// 		// create & send banlist
// 		const banlist = Array.from(playerNames).map((playername) => {
// 			return {
// 				username: playername,
// 				reason: `Banned on FAGC. Please check one of the community Discord servers or go to ${this.client.env.APIURL}/profiles/getall?playername=${playername}`,
// 			}
// 		})
// 		// using (null, 4) in JSON.stringify() to have nice formatting - 4 = 4 spaces for tab
// 		const file = new MessageAttachment(
// 			Buffer.from(JSON.stringify(banlist, null, 4)),
// 			"banlist.json"
// 		)
// 		await message.channel.send("Banlist attatched", {
// 			files: [ file ],
// 		})
// 	}
// }

// module.exports = Genbanlist

const Genbanlist: Command = {
	name: "generatebanlist",
	description: "Creates a .json banlist file to use for servers",
	aliases: [ "banlist", "genbanlist" ],
	usage: "",
	examples: [],
	category: "basic",
	requiresRoles: true,
	requiredPermissions: ["reports"],
	run: async ({ message, client, guildConfig}) => {
		console.log(guildConfig)
		if (!guildConfig.ruleFilters.length)
			return message.reply("Set rule filters first")
		if (!guildConfig.trustedCommunities.length)
			return message.reply("Set trusted communities first")
		
		message.reply("Processing banlist. Please wait")
		
		const reports = await client.fagc.reports.list({
			communityIds: guildConfig.trustedCommunities,
			ruleIds: guildConfig.ruleFilters,
		})
		const toBanWith: Map<string, Report> = new Map()
		reports.forEach((report) => {
			if (toBanWith.has(report.playername)) return // already on banlist
			toBanWith.set(report.playername, report)
		})
		const banlist = Array.from(toBanWith.values()).map((report) => {
			return {
				username: report.playername,
				reason: `Banned on FAGC. Please check one of the community Discord servers or go to ${client.env.APIURL}/reports/${encodeURIComponent(report.id)}`,
			}
		})
		// using (null, 4) in JSON.stringify() to have nice formatting - 4 = 4 spaces for tab
		const file = new MessageAttachment(
			Buffer.from(JSON.stringify(banlist, null, 4)),
			"banlist.json"
		)
		return await message.reply({
			content: "Banlist attatched",
			files: [ file ],
		})

	}
}
export default Genbanlist