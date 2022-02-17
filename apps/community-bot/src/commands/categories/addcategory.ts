import { EmbedField } from "discord.js"
import { Command } from "../../base/Command"
import { createPagedEmbed } from "../../utils/functions"
import { Category } from "fagc-api-types"
import { AuthError } from "fagc-api-wrapper"

const AddCategory: Command = {
	name: "addcategory",
	description:
		"Adds a category filter. Please see the [Explanation](https://gist.github.com/oof2win2/370050d3aa1f37947a374287a5e011c4#file-trusted-md)",
	aliases: [ "addcategories" ],
	usage: "[...ids]",
	examples: [ "addcategory XuciBx7", "addcategory XuciBx7 XuciBx9 XuciBx/" ],
	category: "categories",
	requiresRoles: true,
	requiredPermissions: [ "setCategories" ],
	requiresApikey: false,
	run: async ({ client, message, guildConfig, args }) => {
		// if they haven't provided any IDs, we'll show them all the categories and ask for IDs
		const allCategories = await client.fagc.categories.fetchAll({})
		if (!args[0]) {
			const embed = client.createBaseEmbed()
				.setTitle("FAGC Categories")
				.setDescription("All FAGC Categories")
			const fields: EmbedField[] = []
			for (let i = 0; i < allCategories.length; i += 2) {
				fields.push({
					name: `${allCategories[i].name} (\`${allCategories[i].id}\`)`,
					// this is done so that two categories are per field to take up less space
					value: allCategories[i + 1]
						? `**${allCategories[i + 1].name}** (\`${allCategories[i + 1].id}\`)`
						: "\u200b",
					inline: false,
				})
			}
			createPagedEmbed(fields, embed, message, { maxPageCount: 10 })
			const newIdsMessage = await client.getMessageResponse(
				message,
				`${client.emotes.type} No categories provided. Please provide IDs`,
			)

			if (!newIdsMessage || !newIdsMessage.content)
				return message.channel.send("No IDs were provided")
			args = newIdsMessage.content.split(" ")
		}

		// get the IDs that are not in their config
		const newCategories = args
			.map((categoryId) => client.fagc.categories.resolveId(categoryId))
			.filter((r): r is Category => Boolean(r))
			.filter((r) => !guildConfig.categoryFilters.includes(r.id))

		// if there are no new categories, return
		if (!newCategories.length)
			return message.channel.send("No valid or non-duplicate categories to be added")

		// send the new categories as an embed
		const newCategoryEmbed = client.createBaseEmbed()
			.setTitle("FAGC Categories")
			.setDescription("New Categories")
		const newCategoryFields = newCategories.map((category) => {
			return {
				name: `${category.name} (\`${category.id}\`)`,
				value: category.description,
				inline: false,
			}
		})
		createPagedEmbed(newCategoryFields, newCategoryEmbed, message, { maxPageCount: 10 })

		// ask for confirmation if they want it like this
		const confirm = await client.getConfirmationMessage(
			message,
			"Are you sure you want to add these categories to your category filters?",
		)
		if (!confirm) return message.channel.send("Adding categories cancelled")

		// add the new categories to the config
		const newCategoryIds = new Set([
			...guildConfig.categoryFilters,
			...newCategories.map((r) => r.id),
		])

		try {
		// save the config
			await client.saveGuildConfig({
				guildId: message.guild.id,
				categoryFilters: [ ...newCategoryIds ],
				apikey: guildConfig.apikey ?? undefined,
			})

			// send a success message
			return message.channel.send("Successfully added filtered categories")
		} catch (e) {
			if (e instanceof AuthError) {
				return message.channel.send(`${client.emotes.warn} Your API key is not recognized by FAGC`)
			}
			throw e
		}
	},
}
export default AddCategory
