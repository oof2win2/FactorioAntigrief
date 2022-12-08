import { SubCommand } from "../../base/Command"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { createPagedEmbed } from "../../utils/functions"
import { AuthError } from "@fdgl/wrapper"

const slashCommand = new SlashCommandSubcommandBuilder()
	.setName("add")
	.setDescription("Add communities to your community filter")
	.addStringOption(
		(option) =>
			option
				.setName("community")
				.setDescription("The community to add")
				.setRequired(true)
		// .setAutocomplete(true) // TODO implement autocomplete
	)

// Add 9 more community arguments
new Array(9).fill(0).forEach((_, i) => {
	slashCommand.addStringOption((option) =>
		option
			.setName(`community${i + 2}`)
			.setDescription(`The community to add`)
			.setRequired(false)
	)
})

const CommunitiesAdd: SubCommand<false, true> = {
	type: "SubCommand",
	data: slashCommand,
	requiredPermissions: ["setCommunities"],
	requiresRoles: true,
	requiresApikey: false,
	fetchFilters: true,
	execute: async ({ interaction, client, filters, guildConfig }) => {
		const allCommunities = await client.fdgl.communities.fetchAll({})

		const argCategories =
			interaction.options.data[0].options?.map(
				(option) => option.value as string
			) ?? []

		const communitiesToAdd = argCategories
			// check if the community exists
			.filter((id) => Boolean(allCommunities.find((c) => c.id === id)))
			// check if the community is already in the filter
			.filter((id) => !filters.communityFilters.includes(id))

		if (!communitiesToAdd.length)
			return interaction.reply("No valid or new communities to add")

		const confirmationEmbed = client
			.createBaseEmbed()
			.setTitle("FDGL Communities")
			.setDescription("All FDGL Communities")
		const fields = await Promise.all(
			communitiesToAdd.map(async (id) => {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const community = allCommunities.find((c) => c.id === id)!
				return {
					name: `${community.name} | \`${community.id}\``,
					value: await client.safeGetContactString(community.contact),
					inline: false,
				}
			})
		)

		createPagedEmbed(
			fields,
			confirmationEmbed,
			interaction,
			interaction.user,
			{
				maxPageCount: 10,
			}
		)
		const confirm = await client.getConfirmation(
			interaction,
			"Are you sure you want to add these communities to your communities filters?",
			interaction.user,
			{ followUp: true }
		)
		if (!confirm)
			return interaction.followUp("Adding communities cancelled")

		const newCommunityFilters = new Set([
			...communitiesToAdd,
			...filters.communityFilters,
		])

		try {
			await client.saveFilters(
				{
					id: filters.id,
					communityFilters: [...newCommunityFilters],
				},
				guildConfig.communityId ?? null
			)
			return interaction.followUp("Successfully added community filters")
		} catch (e) {
			if (e instanceof AuthError) {
				return interaction.followUp(
					`${client.emotes.warn} Your API key is not recognized by FDGL`
				)
			}
			throw e
		}
	},
}

export default CommunitiesAdd
