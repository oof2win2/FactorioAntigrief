import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { Revocation } from "fagc-api-types"
import {SubCommand} from "../../base/Command.js"
import { HandleUnfilteredRevocation } from "../../base/FAGCHandler.js"

const AddIgnoredReport: SubCommand = {
	data: new SlashCommandSubcommandBuilder()
		.setName("add")
		.setDescription("Ignore a report")
		.addStringOption(option =>
			option
				.setName("id")
				.setDescription("ID of the report to ignore")
				.setRequired(true)
		),
	execute: async (client, interaction) => {
		const id = interaction.options.get("id")
		if (id.type !== "STRING" || typeof id.value !== "string") return interaction.reply("An error occured")
		
		const report = await client.fagc.reports.fetchReport(id.value)
		if (!report) return interaction.reply(`Report \`${id.value}\` does not exist`)

		await client.prisma.ignoredReports.create({
			data: {
				reportId: report.id,
				playername: report.playername,
				whitelistedBy: interaction.user.id,
			}
		})

		// do the unbanning
		await HandleUnfilteredRevocation(report as Revocation, client)

		return interaction.reply(`Report \`${report.id}\` for ${report.playername} has been ignored`)
	}
}
export default AddIgnoredReport