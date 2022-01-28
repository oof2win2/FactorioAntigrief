import { EmbedField } from "discord.js"
import { Command } from "../../base/Command"
import { createPagedEmbed } from "../../utils/functions"

const AllCategories: Command = {
	name: "allcategories",
	description: "Gets all categories",
	category: "categories",
	aliases: [],
	usage: "",
	examples: [],
	requiresRoles: false,
	requiresApikey: false,
	run: async ({ client, message }) => {
		// fetch categories from backend
		const categories = await client.fagc.categories.fetchAll({})
		// create a nice embed to display the categories
		const embed = client.createBaseEmbed()
			.setTitle("FAGC Categories")
			.setDescription("All FAGC Categories")
		// create the fields for the embed
		const fields: EmbedField[] = []
		for (let i = 0; i < categories.length; i += 2) {
			fields.push({
				name: `${categories[i].shortdesc} (\`${categories[i].id}\`)`,
				// this is done so that two categories are per field to take up less space
				value: categories[i + 1]
					? `**${categories[i + 1].shortdesc}** (\`${categories[i + 1].id}\`)`
					: "\u200b",
				inline: false,
			})
		}
		createPagedEmbed(fields, embed, message, { maxPageCount: 10 })
	},
}
export default AllCategories
