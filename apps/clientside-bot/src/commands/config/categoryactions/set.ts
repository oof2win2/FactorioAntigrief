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

const Setaction: SubCommand = {
	type: "SubCommand",
	data: new SlashCommandSubcommandBuilder()
		.setName("set")
		.setDescription("Set an action for a category")
		.addStringOption((option) =>
			option.setName("id").setDescription("Category ID").setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName("createaction")
				.setDescription("Action to perform when a report is created")
				.setRequired(true)
		),
	execute: async ({ client, interaction }) => {
		const categoryId = interaction.options.getString("id", true)

		const createActionSelect =
			new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
				new StringSelectMenuBuilder()
					.setCustomId("createaction")
					.setPlaceholder("What happens when a report is created")
					.setMaxValues(Actions.length)
					.setMinValues(0)
					.addOptions(Actions)
			)
		const revokeActionSelect =
			new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
				new StringSelectMenuBuilder()
					.setCustomId("revokeaction")
					.setPlaceholder("What happens when a report is revoked")
					.setMaxValues(Actions.length)
					.setMinValues(0)
					.addOptions(Actions)
			)

		const confirmButton =
			new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setCustomId("submit")
					.setLabel("Set actions of category to settings above")
					.setStyle(ButtonStyle.Success)
			)
		const state = {
			create: [] as FDGLCategoryAction[],
			revoke: [] as FDGLCategoryAction[],
		}

		const response = await interaction.reply({
			content: "Select the actions to take for this category",
			components: [createActionSelect, revokeActionSelect, confirmButton],
		})

		const collector = response.createMessageComponentCollector<
			ComponentType.StringSelect | ComponentType.Button
		>({
			time: 1000 * 60 * 5, // 5 minutes max
			filter: (i) => i.user.id === interaction.user.id,
		})

		const handleSubmit = async () => {
			collector.stop()

			const reportActions =
				state.create
					.map(
						(a) =>
							Actions.find(
								(action) => action.value === a.toString()
							)?.label
					)
					.join(", ") || "nothing"
			const revokeActions =
				state.revoke
					.map(
						(a) =>
							Actions.find(
								(action) => action.value === a.toString()
							)?.label
					)
					.join(", ") || "nothing"
			const followUp = await interaction.followUp({
				content: `Setting actions of category ${categoryId} to ${reportActions} on report creation and ${revokeActions} on report revocation.`,
			})

			// save the actions to the bot and the database
			const existingAction = client.FDGLCategoryActions.get(categoryId)
			client.FDGLCategoryActions.set(categoryId, {
				createAction: state.create,
				createCustomCommand:
					existingAction?.createCustomCommand || null,
				revokeAction: state.revoke,
				revokeCustomCommand:
					existingAction?.revokeCustomCommand || null,
				clearCustomCommand: existingAction?.clearCustomCommand || null,
			})
			let createActionBytes = 0
			let revokeActionBytes = 0
			for (const action of state.create) {
				createActionBytes |= 1 << action
			}
			for (const action of state.revoke) {
				revokeActionBytes |= 1 << action
			}
			client.db.getRepository(CategoryActions).update(
				{
					id: categoryId,
				},
				{
					createOptions: createActionBytes,
					revokeOptions: revokeActionBytes,
				}
			)
			followUp.edit({
				content: `Actions of category ${categoryId} have been set to ${reportActions} on report creation and ${revokeActions} on report revocation.`,
			})
		}

		collector.on("collect", (i) => {
			if (i.componentType === ComponentType.Button) {
				if (i.customId === "submit") {
					handleSubmit()
				}
			} else if (i.componentType === ComponentType.StringSelect) {
				// set the values of the state
				if (i.customId === "createaction") {
					state.create = i.values.map((v) => parseInt(v))
				} else if (i.customId === "revokeaction") {
					state.revoke = i.values.map((v) => parseInt(v))
				}
			}
			i.deferUpdate()
		})
	},
}
export default Setaction
