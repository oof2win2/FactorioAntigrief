import FAGCBot from "../../base/fagcbot"
import { Guild } from "discord.js"
import Logger from "../../utils/logger"

export default async (client: FAGCBot, guild: Guild) => {
	Logger.log(`${client.user?.username} left guild ${guild.name}`)
	client.fagc.communities.guildLeave({
		guildId: guild.id,
	})
}
