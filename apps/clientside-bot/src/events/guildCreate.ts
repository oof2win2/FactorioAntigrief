import { Guild } from "discord.js"
import FDGLBot from "../base/FDGLBot.js"
import sendGuildMessage from "../utils/functions/sendGuildMessage.js"

export default async (client: FDGLBot, [guild]: [Guild]) => {
	console.log(`Bot has now entered guild ${guild.name}`)

	const fdglconfig = await client.fdgl.communities.fetchGuildConfig({
		guildId: guild.id,
	})
	if (!fdglconfig) {
		return sendGuildMessage(
			guild,
			`You do not have an existing FDGL configuration in the guild ${guild.name}, so none has been saved or synchronized`
		)
	}

	client.fdgl.websocket.addGuildId(guild.id)
	await client.setBotConfig({
		guildId: guild.id,
		owner: guild.ownerId,
	})
}
