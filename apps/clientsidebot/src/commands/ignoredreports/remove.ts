import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { Revocation } from "fagc-api-types"
import {SubCommand} from "../../base/Command.js"
import { HandleUnfilteredReport } from "../../base/FAGCHandler.js"

const CheckIgnoredReport: SubCommand = {
	data: new SlashCommandSubcommandBuilder()
		.setName("remove")
		.setDescription("Un-ignore a report")
		.addStringOption(option =>
			option
				.setName("id")
				.setDescription("ID of the report to un-ignore")
				.setRequired(true)
		),
	execute: async (client, interaction) => {
		const id = interaction.options.get("id")
		if (id.type !== "STRING" || typeof id.value !== "string") return interaction.reply("An error occured")
	

		const ignoration = await client.prisma.ignoredReports.delete({
			where: {
				reportId: id.value
			}
		})

		const report = await client.fagc.reports.fetchReport(id.value)

		await HandleUnfilteredReport(report, client)

		return interaction.reply(`Report \`${id.value}\` for ${ignoration.playername} has been unignored`)
	}
}
export default CheckIgnoredReport