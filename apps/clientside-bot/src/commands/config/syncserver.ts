import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { ChannelType } from "discord-api-types"
import { SubCommand } from "../../base/Commands.js"
import splitIntoGroups from "../../utils/functions/splitIntoGroups.js"
import FAGCBan from "../../database/FAGCBan.js"
import PrivateBan from "../../database/PrivateBan.js"
import dayjs from "dayjs"

const Syncserver: SubCommand = {
	data: new SlashCommandSubcommandBuilder()
		.setName("syncserver")
		.setDescription("Synchronize a server's banlist")
		.addChannelOption((option) =>
			option
				.setName("serverchannel")
				.setDescription(
					"Channel paired to the server which to synchronize the banlist of"
				)
				.setRequired(true)
				.addChannelTypes([ChannelType.GuildNews, ChannelType.GuildText])
		),
	execute: async ({ client, interaction }) => {
		const serverchannel = interaction.options.getChannel(
			"serverchannel",
			true
		)

		const server = client.servers.find(
			(server) => server.discordChannelId === serverchannel.id
		)
		if (!server)
			return interaction.reply({
				content: "The provided channel is not paired to any server",
				ephemeral: true,
			})

		await interaction.reply("Compiling banlist for the server...")

		const alreadyBanned = new Set<string>()
		const banCommands: string[] = []

		// handle private bans first, so that they are not overriden by FAGC bans
		const privatebans = await client.db.getRepository(PrivateBan).find()
		for (const ban of privatebans) {
			const admin = await client.users.fetch(ban.adminId)
			banCommands.push(
				`game.ban_player("${ban.playername}", "${ban.reason} by ${
					admin.username
				}#${admin.discriminator} on ${dayjs().format(
					"YYYY-MM-DD HH:mm:ss"
				)}")`
			)
			alreadyBanned.add(ban.playername)
		}

		const filter = client.filterObject
		if (filter) {
			const allFAGCBans = await client.db.getRepository(FAGCBan).find()
			for (const ban of allFAGCBans) {
				if (alreadyBanned.has(ban.playername)) continue
				if (
					filter.categoryFilters.includes(ban.categoryId) &&
					filter.communityFilters.includes(ban.communityId)
				) {
					const report = await client.fagc.reports.fetchReport({
						reportId: ban.id,
					})
					banCommands.push(client.createBanCommand(report!))
					alreadyBanned.add(ban.playername)
				}
			}
		}

		await interaction.followUp("Banlist generated, sending to server...")

		await client.rcon.rconCommand("/banlist clear", server.discordChannelId)
		for (const group of splitIntoGroups(banCommands, 500)) {
			await client.rcon.rconCommand(
				"/c ".concat(group.join("; ")),
				server.discordChannelId
			)
		}
		await interaction.followUp("Banlist synchronized with server.")
	},
}
export default Syncserver
