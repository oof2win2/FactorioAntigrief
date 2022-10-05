import { SubCommand } from "../../base/Command"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { AuthError } from "fagc-api-wrapper"

const slashCommand = new SlashCommandSubcommandBuilder()
	.setName("remove")
	.setDescription("Remove communities from your list of filtered communities")
	.addStringOption(
		(option) =>
			option
				.setName("community")
				.setDescription("The community to remove")
				.setRequired(true)
		// .setAutocomplete(true) // TODO implement autocomplete
	)

// Add 9 more community arguments
new Array(9).fill(0).forEach((_, i) => {
	slashCommand.addStringOption((option) =>
		option
			.setName(`community${i + 2}`)
			.setDescription(`The community to remove`)
			.setRequired(false)
	)
})

const CommunitiesRemove: SubCommand<false, true> = {
	type: "SubCommand",
	data: slashCommand,
	requiredPermissions: ["setCategories"],
	requiresRoles: true,
	requiresApikey: false,
	fetchFilters: true,
	execute: async ({ interaction, client, filters, guildConfig }) => {
		// you need to trust at least one external community for this command to be useful and do anything
		if (
			guildConfig.communityId &&
			filters.communityFilters === [guildConfig.communityId]
		)
			return interaction.reply(
				"You need to have at least one trusted community"
			)

		const argCommunities =
			interaction.options.data[0].options?.map(
				(option) => option.value as string
			) ?? []

		const message = await interaction.deferReply({ fetchReply: true })

		// ask user if they really want to remove these communities from their filters
		const confirm = await client.getConfirmationMessage(
			message,
			"Are you sure you want to remove these communities from your community filters?"
		)
		if (!confirm)
			return interaction.followUp("Removing communities cancelled")

		// remove the communities from the config
		const communityIds = new Set(filters.communityFilters)
		argCommunities.forEach((id) => communityIds.delete(id))

		try {
			await client.saveFilters(
				{
					id: filters.id,
					communityFilters: [...communityIds],
				},
				guildConfig.communityId ?? null
			)
			return interaction.followUp(
				"Successfully removed community filters"
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

export default CommunitiesRemove
