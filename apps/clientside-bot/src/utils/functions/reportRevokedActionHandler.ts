import { Category, Community, Revocation } from "@fdgl/types"
import { EmbedBuilder } from "discord.js"
import FDGLBot from "../../base/FDGLBot"
import ActionLog from "../../database/ActionLog"
import {
	FDGLCategoryAction,
	FDGLCategoryHandler,
	FDGLReportActionResponse,
} from "../../types"

const reportRevokedActionHandler = (
	revocation: Revocation,
	category: Category,
	community: Community,
	action: FDGLCategoryHandler,
	client: FDGLBot
): FDGLReportActionResponse[] => {
	const actions: FDGLReportActionResponse[] = []
	if (action.createAction.includes(FDGLCategoryAction.DiscordMessage)) {
		const embed = new EmbedBuilder()
			.setTitle("FDGL Report Revoked")
			.addFields(
				{
					name: "Playername",
					value: revocation.playername,
				},
				{
					name: "Category",
					value: `${category.name} (\`${revocation.categoryId}\`)`,
				},
				{
					name: "Community",
					value: `${community.name} (\`${revocation.communityId}\`)`,
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
			.replaceAll("{PLAYERNAME}", revocation.playername)
			.replaceAll("{CATEGORYNAME}", category.name)
			.replaceAll("{CATEGORYID}", revocation.categoryId)
			.replaceAll("{COMMUNITYNAME}", community.name)
			.replaceAll("{COMMUNITYID}", revocation.communityId)
			.replaceAll("{REPORTID}", revocation.id)
			.replaceAll(
				"{REPORTEDTIME}",
				revocation.reportCreatedAt.toDateString()
			)
			.replaceAll("{REVOKEDTIME}", revocation.revokedAt.toDateString())
		actions.push({
			type: FDGLCategoryAction.FactorioMessage,
			message: formatted,
		})
	}
	if (action.createAction.includes(FDGLCategoryAction.FactorioBan)) {
		// ban in guilds that its supposed to
		const command = client.createUnbanCommand(revocation.playername)
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
	// 		.replaceAll("{PLAYERNAME}", revocation.playername)
	// 		.replaceAll("{CATEGORYNAME}", category.name)
	// 		.replaceAll("{CATEGORYID}", revocation.categoryId)
	// 		.replaceAll("{COMMUNITYNAME}", community.name)
	// 		.replaceAll("{COMMUNITYID}", revocation.communityId)
	// 		.replaceAll("{REPORTID}", revocation.id)
	// 		.replaceAll(
	// 			"{REPORTEDTIME}",
	// 			revocation.reportCreatedAt.toDateString()
	// 		)
	// 		.replaceAll("{REVOKEDTIME}", revocation.revokedAt.toDateString())
	// 	actions.push({
	// 		type: FDGLCategoryAction.CustomCommand,
	// 		command: formatted,
	// 	})
	// }
	return actions
}
export default reportRevokedActionHandler
