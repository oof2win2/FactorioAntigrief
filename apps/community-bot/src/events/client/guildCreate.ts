import { Guild } from "discord.js"
import FDGLBot from "../../base/fdglbot"
import { afterJoinGuild } from "../../utils/functions"
import Logger from "../../utils/logger"

export default async (client: FDGLBot, guild: Guild) => {
	Logger.log(
		`${client.user?.username} joined guild ${guild.name}. Setting up config`
	)
	afterJoinGuild(guild, client)
}
