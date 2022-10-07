import { SubCommand } from "../../base/Command"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { createPagedEmbed } from "../../utils/functions"
import { Category } from "fagc-api-types"
import { AuthError } from "fagc-api-wrapper"

const slashCommand = new SlashCommandSubcommandBuilder()
	.setName("add")
	.setDescription("Adds a category filter")
	.addStringOption(
		(option) =>
			option
				.setName("category")
				.setDescription("The category to add")
				.setRequired(true)
		// .setAutocomplete(true) // TODO implement autocomplete
	)

// Add 9 more category arguments
new Array(9).fill(0).forEach((_, i) => {
	slashCommand.addStringOption((option) =>
		option
			.setName(`category${i + 2}`)
			.setDescription(`The category to add`)
			.setRequired(false)
	)
})

const CategoriesAdd: SubCommand<false, true> = {
	type: "SubCommand",
	data: slashCommand,
	requiredPermissions: ["setCategories"],
	requiresRoles: true,
	requiresApikey: false,
	fetchFilters: true,
	execute: async ({ interaction, client, filters, guildConfig }) => {
		const argCategories =
			interaction.options.data[0].options?.map(
				(option) => option.value as string
			) ?? []

		// get the IDs that are not in their config
		const newCategories = argCategories
			.map((categoryId) => client.fagc.categories.resolveId(categoryId))
			.filter((r): r is Category => Boolean(r))
			.filter((r) => !filters.categoryFilters.includes(r.id))

		// if there are no new categories, return
		if (!newCategories.length)
			return interaction.reply(
				"No valid or non-duplicate categories to be added"
			)

		// send the new categories as an embed
		const newCategoryEmbed = client
			.createBaseEmbed()
			.setTitle("FAGC Categories")
			.setDescription("New Categories")
		const newCategoryFields = newCategories.map((category) => {
			return {
				name: `${category.name} (\`${category.id}\`)`,
				value: category.description,
				inline: false,
			}
		})

		const message = await interaction.reply({
			embeds: [newCategoryEmbed],
			fetchReply: true,
		})

		createPagedEmbed(newCategoryFields, newCategoryEmbed, message, {
			maxPageCount: 10,
			user: interaction.user,
		})

		// ask for confirmation if they want it like this
		const confirm = await client.getConfirmation(
			message,
			"Are you sure you want to add these categories to your category filters?",
			interaction.user
		)
		if (!confirm) return interaction.followUp("Adding categories cancelled")

		// add the new categories to the config
		const newCategoryIds = new Set([
			...filters.categoryFilters,
			...newCategories.map((r) => r.id),
		])

		try {
			// save the config
			await client.saveFilters(
				{
					id: filters.id,
					categoryFilters: Array.from(newCategoryIds),
				},
				guildConfig.communityId ?? null
			)

			// send a success message
			return interaction.followUp(
				"Successfully added filtered categories"
			)
		} catch (e) {
			if (e instanceof AuthError) {
				return interaction.followUp(
					`${client.emotes.warn} Your API key is not recognized by FAGC`
				)
			}
			throw e
		}
	},
}

export default CategoriesAdd
