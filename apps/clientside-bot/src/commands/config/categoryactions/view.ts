import {
	ModalActionRowComponentBuilder,
	SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
import { EmbedBuilder, EmbedField } from "discord.js"
import { SubCommand } from "../../../base/Commands.js"
import { FDGLCategoryAction } from "../../../types"
import CategoryActions from "../../../database/CategoryActions.js"
import { createPagedEmbed } from "../../../utils/functions/createPagedEmbed.js"

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

const Viewactions: SubCommand = {
	type: "SubCommand",
	data: new SlashCommandSubcommandBuilder()
		.setName("get")
		.setDescription("Get an action for a category")
		.addStringOption((option) =>
			option.setName("id").setDescription("Category ID")
		),
	execute: async ({ client, interaction }) => {
		const categoryId = interaction.options.getString("id", false)

		if (categoryId) {
			const category = client.FDGLCategoryActions.get(categoryId)
			if (!category)
				return interaction.reply({
					content: "Category not found",
					ephemeral: true,
				})
			return interaction.reply({
				content: `For category \`${categoryId}\`, your report creation actions are set to ${category.createAction
					.map((x) => Actions[x].label)
					.join(
						", "
					)}; your report revocation actions are set to ${category.revokeAction
					.map((x) => Actions[x].label)
					.join(", ")}.`,
			})
		}

		const embed = new EmbedBuilder()
			.setTitle("Category actions")
			.setDescription(
				`Here are the actions for each category. You can use \`/config categoryactions set <id>\` to set actions for a category.`
			)
		const embedFields: EmbedField[] = []
		for (const [id, category] of client.FDGLCategoryActions) {
			embedFields.push({
				name: id,
				value: `Your report creation actions are set to ${
					category.createAction
						.map((x) => Actions[x].label)
						.join(", ") || "nothing"
				}; your report revocation actions are set to ${
					category.revokeAction
						.map((x) => Actions[x].label)
						.join(", ") || "nothing"
				}.`,
				inline: false,
			})
		}
		console.log(client.FDGLCategoryActions.size, embedFields.length)

		await createPagedEmbed(
			embedFields,
			embed,
			interaction,
			interaction.user,
			{
				maxPageCount: 5,
			}
		)
	},
}
export default Viewactions
