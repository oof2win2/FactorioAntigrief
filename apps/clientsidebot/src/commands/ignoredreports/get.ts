import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { Revocation } from "fagc-api-types"
import {SubCommand} from "../../base/Command.js"

const CheckIgnoredReport: SubCommand = {
	data: new SlashCommandSubcommandBuilder()
		.setName("get")
		.setDescription("Check whether a report is ignored")
		.addStringOption(option =>
			option
				.setName("id")
				.setDescription("ID of the report to check")
				.setRequired(true)
		),
	execute: async (client, interaction) => {
		const id = interaction.options.get("id")
		if (id.type !== "STRING" || typeof id.value !== "string") return interaction.reply("An error occured")
	

		const ignoration = await client.prisma.ignoredReports.findFirst({
			where: {
				reportId: id.value
			}
		})

		if (ignoration) return interaction.reply(`Report \`${id.value}\` for ${ignoration.playername} has been ignored since <t:${Math.round(ignoration.whitelistedAt.valueOf()/1000)}> by ${await client.users.fetch(ignoration.whitelistedBy).then(u=>u.tag)}`)
		return interaction.reply(`Report ${id.value} is not ignored`)
	}
}
export default CheckIgnoredReport