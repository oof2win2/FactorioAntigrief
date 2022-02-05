import { Command } from "../../base/Command"
import { createPagedEmbed } from "../../utils/functions"

const Categories: Command = {
	name: "categories",
	description:
		"Gets categories that this community follows. Please see the [Explanation](https://gist.github.com/oof2win2/370050d3aa1f37947a374287a5e011c4#file-trusted-md)",
	category: "categories",
	usage: "",
	examples: [],
	aliases: [],
	requiresRoles: false,
	requiresApikey: false,
	run: async ({ client, message, guildConfig }) => {
		// if there are no filtered categories, it makes no sense proceeding
		if (!guildConfig.categoryFilters.length)
			return message.reply(`${client.emotes.warn} No category filters set`)

		const allCategories = await client.fagc.categories.fetchAll({})
		const filteredCategories = allCategories.filter((category) =>
			guildConfig.categoryFilters.includes(category.id),
		)

		const embed = client.createBaseEmbed()
			.setTitle("FAGC Categories")
			.setDescription(
				"Filtered FAGC Categories. [Explanation](https://gist.github.com/oof2win2/370050d3aa1f37947a374287a5e011c4#file-trusted-md)",
			)
		// create the fields
		const fields = filteredCategories
			// sort IDs by ascending
			.sort((a, b) => guildConfig.categoryFilters.indexOf(a.id) - guildConfig.categoryFilters.indexOf(b.id))
			.map((category) => {
				return {
					name: `${guildConfig.categoryFilters.indexOf(category.id) + 1}) ${
						category.name
					} (\`${category.id}\`)`,
					value: category.description,
					inline: false,
				}
			})
		// create the embed
		createPagedEmbed(fields, embed, message, { maxPageCount: 10 })
	},
}

export default Categories
