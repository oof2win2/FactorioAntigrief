import FDGLBot from "../../base/fdglbot"
import { Guild } from "discord.js"
import Logger from "../../utils/logger"

export default async (client: FDGLBot, guild: Guild) => {
	Logger.log(`${client.user?.username} left guild ${guild.name}`)
	client.fdgl.communities.guildLeave({
		guildId: guild.id,
	})
}
