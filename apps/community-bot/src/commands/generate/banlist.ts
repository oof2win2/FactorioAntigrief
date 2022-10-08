import { SubCommand } from "../../base/Command"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { MessageAttachment } from "discord.js"

const GenerateBanlist: SubCommand<false, true> = {
	type: "SubCommand",
	data: new SlashCommandSubcommandBuilder()
		.setName("banlist")
		.setDescription("Creates a .json banlist file to use for servers"),
	requiredPermissions: ["reports"],
	requiresRoles: true,
	requiresApikey: false,
	fetchFilters: true,
	execute: async ({ interaction, client, filters }) => {
		if (!filters.categoryFilters.length)
			return interaction.reply("Set category filters first")
		if (!filters.communityFilters.length)
			return interaction.reply("Set trusted communities first")

		await interaction.reply("Generating banlist...")

		const reports = await client.fagc.reports.list({
			communityIds: filters.communityFilters,
			categoryIds: filters.categoryFilters,
		})
		const toBanWith = new Set(reports.map((r) => r.playername))
		const banlist = [...toBanWith].map((playername) => {
			return {
				username: playername,
				reason: `Banned on FAGC. Please check one of the community Discord servers or go to ${
					client.env.REPLACEMENT_APIURL
				}/reports?playername=${encodeURIComponent(playername)}`,
			}
		})

		// using (null, 4) in JSON.stringify() to have nice formatting - 4 = 4 spaces for tab
		const file = new MessageAttachment(
			Buffer.from(JSON.stringify(banlist, null, 4)),
			"banlist.json"
		)
		return await interaction.editReply({
			content: "Banlist attached",
			files: [file],
		})
	},
}

export default GenerateBanlist
