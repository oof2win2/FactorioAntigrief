import { Command } from "../../base/Command"
import { createPagedEmbed } from "../../utils/functions"

const Categories = Command({
	name: "categories",
	description:
		"Gets categories that this community follows. Please see the [Explanation](https://gist.github.com/oof2win2/370050d3aa1f37947a374287a5e011c4#file-trusted-md)",
	category: "categories",
	usage: "",
	examples: [],
	aliases: [],
	requiresRoles: false,
	requiresApikey: false,
	fetchFilters: true,
	run: async ({ client, message, filters }) => {
		if (!filters)
			return message.reply(
				`${client.emotes.error} An error fetching your filters occured`
			)
		// if there are no filtered categories, it makes no sense proceeding
		if (!filters.categoryFilters.length)
			return message.reply(
				`${client.emotes.warn} No category filters set`
			)

		const allCategories = await client.fagc.categories.fetchAll({})
		const filteredCategories = allCategories.filter((category) =>
			filters.categoryFilters.includes(category.id)
		)

		const embed = client
			.createBaseEmbed()
			.setTitle("FAGC Categories")
			.setDescription(
				"Filtered FAGC Categories. [Explanation](https://gist.github.com/oof2win2/370050d3aa1f37947a374287a5e011c4#file-trusted-md)"
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
		createPagedEmbed(fields, embed, message, { maxPageCount: 10 })
	},
})

export default Categories
