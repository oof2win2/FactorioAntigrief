import { SubCommand } from "../../base/Command"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { createPagedEmbed } from "../../utils/functions"
import { EmbedField } from "discord.js"

const CategoriesList: SubCommand<false, false> = {
	type: "SubCommand",
	data: new SlashCommandSubcommandBuilder()
		.setName("list")
		.setDescription("Gets all categories"),
	requiresRoles: false,
	requiresApikey: false,
	fetchFilters: false,
	execute: async ({ interaction, client }) => {
		// fetch categories from backend
		const categories = await client.fagc.categories.fetchAll({})
		// create a nice embed to display the categories
		const embed = client
			.createBaseEmbed()
			.setTitle("FAGC Categories")
			.setDescription("All FAGC Categories")
		// create the fields for the embed
		const fields: EmbedField[] = []
		for (let i = 0; i < categories.length; i += 2) {
			fields.push({
				name: `${categories[i].name} (\`${categories[i].id}\`)`,
				// this is done so that two categories are per field to take up less space
				value: categories[i + 1]
					? `**${categories[i + 1].name}** (\`${
							categories[i + 1].id
					  }\`)`
					: "\u200b",
				inline: false,
			})
		}

		// create the embed
		createPagedEmbed(
			fields,
			embed,
			await interaction.reply({ embeds: [embed], fetchReply: true }),
			{ maxPageCount: 10, user: interaction.user }
		)
	},
}

export default CategoriesList
