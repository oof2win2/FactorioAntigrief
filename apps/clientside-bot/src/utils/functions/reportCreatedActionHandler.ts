import { ReportCreatedMessage } from "@fdgl/types"
import { EmbedBuilder } from "discord.js"
import FDGLBot from "../../base/FDGLBot"
import {
	FDGLCategoryAction,
	FDGLCategoryHandler,
	FDGLReportActionResponse,
} from "../../types"

const reportCreatedActionHandler = (
	event: ReportCreatedMessage,
	action: FDGLCategoryHandler,
	client: FDGLBot
): FDGLReportActionResponse[] => {
	const report = event.report
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
					value: `${event.extraData.category.name} (\`${report.categoryId}\`)`,
				},
				{
					name: "Community",
					value: `${event.extraData.community.name} (\`${report.communityId}\`)`,
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
			.replaceAll("{CATEGORYNAME}", event.extraData.category.name)
			.replaceAll("{CATEGORYID}", report.categoryId)
			.replaceAll("{COMMUNITYNAME}", event.extraData.community.name)
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
		const command = client.createBanCommand(event.report)
		if (command)
			actions.push({
				type: FDGLCategoryAction.FactorioBan,
				command: command,
			})
	}
	if (
		action.createAction.includes(FDGLCategoryAction.CustomCommand) &&
		action.createCustomCommand
	) {
		const formatted = action.createCustomCommand
			.replaceAll("{PLAYERNAME}", report.playername)
			.replaceAll("{CATEGORYNAME}", event.extraData.category.name)
			.replaceAll("{CATEGORYID}", report.categoryId)
			.replaceAll("{COMMUNITYNAME}", event.extraData.community.name)
			.replaceAll("{COMMUNITYID}", report.communityId)
			.replaceAll("{REPORTID}", report.id)
			.replaceAll("{REPORTEDTIME}", report.reportCreatedAt.toDateString())
		actions.push({
			type: FDGLCategoryAction.CustomCommand,
			command: formatted,
		})
	}
	return actions
}
export default reportCreatedActionHandler
