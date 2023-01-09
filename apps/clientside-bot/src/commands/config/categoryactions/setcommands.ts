import {
	ModalActionRowComponentBuilder,
	SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ComponentType,
	ModalBuilder,
	StringSelectMenuBuilder,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js"
import { SubCommand } from "../../../base/Commands.js"
import { FDGLCategoryAction } from "../../../types"
import CategoryActions from "../../../database/CategoryActions.js"

const Actions = [
	{
		label: "Discord message",
		value: FDGLCategoryAction.DiscordMessage.toString(),
	},
	{
		label: "Factorio message",
		value: FDGLCategoryAction.FactorioMessage.toString(),
	},
	{
		label: "Factorio ban",
		value: FDGLCategoryAction.FactorioBan.toString(),
	},
	{
		label: "Custom Factorio command",
		value: FDGLCategoryAction.CustomCommand.toString(),
	},
]

const Setactioncommands: SubCommand = {
	type: "SubCommand",
	data: new SlashCommandSubcommandBuilder()
		.setName("setcommands")
		.setDescription("Set custom action commands for a category HASFB")
		.addStringOption((option) =>
			option.setName("id").setDescription("Category ID").setRequired(true)
		),
	execute: async ({ client, interaction }) => {
		const categoryId = interaction.options.getString("id", true)

		const currentAction = client.FDGLCategoryActions.get(categoryId)
		if (!currentAction) {
			return interaction.reply({
				content: "Category not found",
				ephemeral: true,
			})
		}

		if (
			!currentAction.createAction.includes(
				FDGLCategoryAction.CustomCommand
			) &&
			!currentAction.revokeAction.includes(
				FDGLCategoryAction.CustomCommand
			)
		) {
			return interaction.reply({
				content:
					"This category does not have custom command actions enabled",
				ephemeral: true,
			})
		}

		const setCommandModal = new ModalBuilder()
			.setTitle("Set custom commands for category")
			.setCustomId("setcommands")
			.addComponents(
				new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
					new TextInputBuilder()
						.setCustomId("createcommand")
						.setPlaceholder(
							"/banlist add ${PLAYERNAME} FDGL Report at ${REPORTEDTIME}"
						)
						.setStyle(TextInputStyle.Paragraph)
						.setLabel("Create command")
						.setRequired(
							currentAction.createAction.includes(
								FDGLCategoryAction.CustomCommand
							)
						)
				),
				new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
					new TextInputBuilder()
						.setCustomId("revokecommand")
						.setPlaceholder("/banlist remove ${PLAYERNAME}")
						.setStyle(TextInputStyle.Paragraph)
						.setLabel("Revoke command")
						.setRequired(
							currentAction.revokeAction.includes(
								FDGLCategoryAction.CustomCommand
							)
						)
				),
				new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
					new TextInputBuilder()
						.setCustomId("revokeall")
						.setPlaceholder("/banlist clear")
						.setStyle(TextInputStyle.Paragraph)
						.setLabel("Revoke all command")
						.setRequired(
							currentAction.revokeAction.includes(
								FDGLCategoryAction.CustomCommand
							)
						)
				)
			)

		interaction.showModal(setCommandModal)
		try {
			const results = await interaction.awaitModalSubmit({
				filter: (i) => i.user.id === interaction.user.id,
				time: 5 * 60 * 1000,
			})
			// we need to "handle" the interaction, otherwise discord aint gonna like it
			results.deferUpdate()

			// now set the fields in the DB
			const createCommand =
				results.fields.getTextInputValue("createcommand")
			const revokeCommand =
				results.fields.getTextInputValue("revokecommand")
			const revokeAllCommand =
				results.fields.getTextInputValue("revokeall")

			client.FDGLCategoryActions.set(categoryId, {
				...currentAction,
				createCustomCommand: createCommand,
				revokeCustomCommand: revokeCommand,
				clearCustomCommand: revokeAllCommand,
			})
			await client.db.getRepository(CategoryActions).update(
				{
					id: categoryId,
				},
				{
					createCustomCommand: createCommand,
					revokeCustomCommand: revokeCommand,
					clearCustomCommand: revokeAllCommand,
				}
			)
			return interaction.followUp("Updated custom commands")
		} catch {
			return interaction.followUp("Timed out")
		}
	},
}
export default Setactioncommands
