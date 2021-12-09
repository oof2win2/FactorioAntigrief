import { Guild } from "discord.js"
import FAGCBot from "../base/FAGCBot.js"
import { sendGuildMessage } from "../utils/functions.js"

export default async (client: FAGCBot, [ guild ]: [Guild]) => {
	console.log(`Bot has now left guild ${guild.name}, removing their config`)

	client.guildConfigs = client.guildConfigs.filter(config => config.guildId !== guild.id)
}