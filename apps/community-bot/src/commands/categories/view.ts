import { SubCommand } from "../../base/Command"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { createPagedEmbed } from "../../utils/functions"

const CategoriesView: SubCommand<false, true> = {
	type: "SubCommand",
	data: new SlashCommandSubcommandBuilder()
		.setName("view")
		.setDescription("Gets categories that this community follows"),
	requiresRoles: false,
	requiresApikey: false,
	fetchFilters: true,
	execute: async ({ interaction, client, filters }) => {
		if (!filters)
			return interaction.reply(
				`${client.emotes.error} An error fetching your filters occured`
			)
		// if there are no filtered categories, it makes no sense proceeding
		if (!filters.categoryFilters.length)
			return interaction.reply(
				`${client.emotes.warn} No category filters set`
			)

		const allCategories = await client.fdgl.categories.fetchAll({})
		const filteredCategories = allCategories.filter((category) =>
			filters.categoryFilters.includes(category.id)
		)

		const embed = client
			.createBaseEmbed()
			.setTitle("FDGL Categories")
			.setDescription(
				"Filtered FDGL Categories. [Explanation](https://gist.github.com/oof2win2/370050d3aa1f37947a374287a5e011c4#file-trusted-md)"
			)
		// create the fields
		const fields = filteredCategories
			// sort IDs by ascending
			.sort(
				(a, b) =>
					filters.categoryFilters.indexOf(a.id) -
					filters.categoryFilters.indexOf(b.id)
			)
			.map((category) => {
				return {
					name: `${
						filters.categoryFilters.indexOf(category.id) + 1
					}) ${category.name} (\`${category.id}\`)`,
					value: category.description,
					inline: false,
				}
			})

		// create the embed
		createPagedEmbed(fields, embed, interaction, interaction.user, {
			maxPageCount: 10,
		})
	},
}

export default CategoriesView
