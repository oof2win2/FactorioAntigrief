import { Guild } from "discord.js"
import FAGCBot from "../../base/fagcbot"
import { afterJoinGuild } from "../../utils/functions"
import Logger from "../../utils/logger"

export default async (client: FAGCBot, guild: Guild) => {
	Logger.log(
		`${client.user?.username} joined guild ${guild.name}. Setting up config`,
	)
	afterJoinGuild(guild, client)
}
