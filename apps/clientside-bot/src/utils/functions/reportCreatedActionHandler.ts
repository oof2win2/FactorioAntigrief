import { Category, Community, Report } from "@fdgl/types"
import { EmbedBuilder } from "discord.js"
import FDGLBot from "../../base/FDGLBot"
import ActionLog from "../../database/ActionLog"
import {
	FDGLCategoryAction,
	FDGLCategoryHandler,
	FDGLReportActionResponse,
} from "../../types"

type reportCreatedActionHandlerInput =
	| {
			detailed: true
			report: Report
			category: Category
			community: Community
			action: FDGLCategoryHandler
			client: FDGLBot
	  }
	| {
			detailed: false
			playername: string
	  }

/**
 * Creates embeds and commands for when a report is created
 *
 * Pure function
 * @modifies None
 */
const reportCreatedActionHandler = (
	report: Report,
	category: Category,
	community: Community,
	action: FDGLCategoryHandler,
	client: FDGLBot
): FDGLReportActionResponse[] => {
	const actions: FDGLReportActionResponse[] = []
	if (action.createAction.includes(FDGLCategoryAction.DiscordMessage)) {
		const embed = new EmbedBuilder()
			.setTitle("FDGL Report Created")
			.addFields(
				{
					name: "Playername",
					value: report.playername,
				},
				{
					name: "Category",
					value: `${category.name} (\`${report.categoryId}\`)`,
				},
				{
					name: "Community",
					value: `${community.name} (\`${report.communityId}\`)`,
				}
			)
		actions.push({
			type: FDGLCategoryAction.DiscordMessage,
			embed: embed,
		})
	}
	if (
		action.createAction.includes(FDGLCategoryAction.FactorioMessage) &&
		action.factorioMessage
	) {
		const formatted = action.factorioMessage
			.replaceAll("{PLAYERNAME}", report.playername)
			.replaceAll("{CATEGORYNAME}", category.name)
			.replaceAll("{CATEGORYID}", report.categoryId)
			.replaceAll("{COMMUNITYNAME}", community.name)
			.replaceAll("{COMMUNITYID}", report.communityId)
			.replaceAll("{REPORTID}", report.id)
			.replaceAll("{REPORTEDTIME}", report.reportCreatedAt.toDateString())
		actions.push({
			type: FDGLCategoryAction.FactorioMessage,
			message: formatted,
		})
	}
	if (action.createAction.includes(FDGLCategoryAction.FactorioBan)) {
		// ban in guilds that its supposed to
		const command = client.createBanCommand(report)
		if (command) {
			actions.push({
				type: FDGLCategoryAction.FactorioBan,
				command: command,
			})
		}
	}
	// TODO: eventually use custom commands
	// if (
	// 	action.createAction.includes(FDGLCategoryAction.CustomCommand) &&
	// 	action.createCustomCommand
	// ) {
	// 	const formatted = action.createCustomCommand
	// 		.replaceAll("{PLAYERNAME}", report.playername)
	// 		.replaceAll("{CATEGORYNAME}", category.name)
	// 		.replaceAll("{CATEGORYID}", report.categoryId)
	// 		.replaceAll("{COMMUNITYNAME}", community.name)
	// 		.replaceAll("{COMMUNITYID}", report.communityId)
	// 		.replaceAll("{REPORTID}", report.id)
	// 		.replaceAll("{REPORTEDTIME}", report.reportCreatedAt.toDateString())
	// 	actions.push({
	// 		type: FDGLCategoryAction.CustomCommand,
	// 		command: formatted,
	// 	})
	// }
	return actions
}
export default reportCreatedActionHandler
