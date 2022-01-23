import { Command } from "../../base/Command"
import { Report } from "fagc-api-types"
import { MessageAttachment } from "discord.js"

const Genbanlist: Command = {
	name: "generatebanlist",
	description: "Creates a .json banlist file to use for servers",
	aliases: ["banlist", "genbanlist"],
	usage: "",
	examples: [],
	category: "basic",
	requiresRoles: true,
	requiredPermissions: ["reports"],
	requiresApikey: false,
	run: async ({ message, client, guildConfig }) => {
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
				reason: `Banned on FAGC. Please check one of the community Discord servers or go to ${
					client.env.APIURL
				}/reports/${encodeURIComponent(report.id)}`,
			}
		})
		// using (null, 4) in JSON.stringify() to have nice formatting - 4 = 4 spaces for tab
		const file = new MessageAttachment(
			Buffer.from(JSON.stringify(banlist, null, 4)),
			"banlist.json",
		)
		return await message.reply({
			content: "Banlist attatched",
			files: [file],
		})
	},
}
export default Genbanlist
