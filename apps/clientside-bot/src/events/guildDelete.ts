import { Guild } from "discord.js"
import FDGLBot from "../base/FDGLBot.js"

export default async (client: FDGLBot, [guild]: [Guild]) => {
	console.log(`Bot has now left guild ${guild.name}, removing their config`)

	client.fdgl.websocket.removeGuildId(guild.id)
}
