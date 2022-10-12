import { SubCommand } from "../../base/Command"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"

const CategoriesDetails: SubCommand<false, true> = {
	type: "SubCommand",
	data: new SlashCommandSubcommandBuilder()
		.setName("details")
		.setDescription("View details of a category")
		.addStringOption(
			(option) =>
				option
					.setName("category")
					.setDescription("The category to view")
					.setRequired(true)
			// TODO implement autocomplete
			// .setAutocomplete(true)
		),
	requiresRoles: false,
	requiresApikey: false,
	fetchFilters: true,
	execute: async ({ interaction, filters, client }) => {
		const categoryId = interaction.options.getString("category", true)

		const category = Number(categoryId)
			? await client.fagc.categories.fetchCategory({
					categoryId: filters.categoryFilters[Number(categoryId) - 1],
			  })
			: await client.fagc.categories.fetchCategory({
					categoryId: categoryId,
			  })

		if (category === null)
			return interaction.reply(
				`${client.emotes.warn} No category with ID of \`${categoryId}\` exists`
			)

		const embed = client
			.createBaseEmbed()
			.setTitle("FAGC Categories")
			.setDescription(`FAGC Category with ID \`${category.id}\``)
		embed.addField(category.name, category.description)

		if (client.config && filters.categoryFilters) {
			if (filters.categoryFilters.indexOf(category.id) != -1) {
				embed.addField(
					"Category index",
					(
						filters.categoryFilters.indexOf(category.id) + 1
					).toString()
				)
			}
		}

		return interaction.reply({
			embeds: [embed],
		})
	},
}

export default CategoriesDetails
