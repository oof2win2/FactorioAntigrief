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
		if (!guildConfig.categoryFilters.length)
			return message.reply("Set category filters first")
		if (!guildConfig.trustedCommunities.length)
			return message.reply("Set trusted communities first")

		message.reply("Processing banlist. Please wait")

		const reports = await client.fagc.reports.list({
			communityIds: guildConfig.trustedCommunities,
			categoryIds: guildConfig.categoryFilters,
		})
		const toBanWith = new Set(reports.map((r) => r.playername))
		const banlist = [...toBanWith].map((playername) => {
			return {
				username: playername,
				reason: `Banned on FAGC. Please check one of the community Discord servers or go to ${
					client.fagc.apiurl
				}/reports/search?playername=${encodeURIComponent(playername)}`,
			}
		})
		// using (null, 4) in JSON.stringify() to have nice formatting - 4 = 4 spaces for tab
		const file = new MessageAttachment(
			Buffer.from(JSON.stringify(banlist, null, 4)),
			"banlist.json"
		)
		return await message.reply({
			content: "Banlist attatched",
			files: [file],
		})
	},
}
export default Genbanlist
