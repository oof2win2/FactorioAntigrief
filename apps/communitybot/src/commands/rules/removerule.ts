import { Command } from "../../base/Command"
import { createPagedEmbed } from "../../utils/functions"
import { Category } from "fagc-api-types"

const RemoveCategories: Command = {
	name: "removecategory",
	aliases: ["removecategories"],
	description:
		"Removes a category filter. Please see the [Explanation](https://gist.github.com/oof2win2/370050d3aa1f37947a374287a5e011c4#file-trusted-md)",
	usage: "[...ids]",
	examples: ["removecategory XuciBx7", "removecategory XuciBx7 XuciBx9 XuciBx/"],
	category: "categories",
	requiresRoles: true,
	requiredPermissions: ["setCategories"],
	requiresApikey: false,
	run: async ({ client, message, args, guildConfig }) => {
		// if no args provided, ask for category ids to remove from filters
		const allCategories = await client.fagc.categories.fetchAll({})
		if (!args[0]) {
			const embed = client.createBaseEmbed()
				.setTitle("FAGC Categories")
				.setDescription("All FAGC Categories")
			const categoryFields = allCategories
				// make sure the categories are filtered
				.filter((category) => guildConfig.categoryFilters.includes(category.id))
				.sort((a, b) => guildConfig.categoryFilters.indexOf(a.id) - guildConfig.categoryFilters.indexOf(b.id))
				.map((category) => {
					return {
						name: `${guildConfig.categoryFilters.indexOf(category.id) + 1}) ${
							category.shortdesc
						} (\`${category.id}\`)`,
						value: category.longdesc,
						inline: false,
					}
				})
			createPagedEmbed(categoryFields, embed, message, { maxPageCount: 5 })
			const newIDsMessage = await client.getMessageResponse(
				message,
				`${client.emotes.type} No categories provided. Please provide IDs`,
			)

			if (!newIDsMessage || !newIDsMessage.content)
				return message.channel.send("No IDs were provided")
			args = newIDsMessage.content.split(" ")
		}

		// check if the categories are in the community's category filters
		const categories = args
			.map((categoryid) =>
				isNaN(Number(categoryid))
					? client.fagc.categories.resolveID(categoryid)
					: // if it is an index in filtered categories, it needs to be resolved
					  client.fagc.categories.resolveID(
						guildConfig.categoryFilters[Number(categoryid) - 1],
					  ),
			)
			.filter((r): r is Category => Boolean(r))
			.filter((r) => guildConfig.categoryFilters.includes(r.id))

		// if there are no categories that are already in the community's filters, then exit
		if (!categories.length)
			return message.channel.send("No valid categories to be removed")

		// otherwise, send a paged embed with the categories to be removed and ask for confirmation
		const embed = client.createBaseEmbed()
			.setTitle("FAGC Categories")
			.setDescription(
				"Remove Filtered Categories. [Explanation](https://gist.github.com/oof2win2/370050d3aa1f37947a374287a5e011c4#file-trusted-md)",
			)
		const categoryFields = categories.map((category) => {
			return {
				name: `${category.shortdesc} (\`${category.id}\`)`,
				value: category.longdesc,
				inline: false,
			}
		})
		createPagedEmbed(categoryFields, embed, message, { maxPageCount: 5 })

		const confirm = await client.getConfirmationMessage(
			message,
			"Are you sure you want to remove these categories from your category filters?",
		)
		if (!confirm) return message.channel.send("Removing categories cancelled")

		// remove the categories from the community's filters
		const categoryIDs = categories.map((category) => category.id)
		const newCategoryFilters = guildConfig.categoryFilters.filter(
			(categoryFilter) => !categoryIDs.includes(categoryFilter),
		)

		// save the community's config
		await client.saveGuildConfig({
			guildId: message.guild.id,
			categoryFilters: newCategoryFilters,
			apikey: guildConfig.apiKey || undefined,
		})

		return message.channel.send("Successfully removed specified filtered categories")
	},
}
export default RemoveCategories
