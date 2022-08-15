import { Guild } from "discord.js"
import FAGCBot from "../base/FAGCBot.js"
import sendGuildMessage from "../utils/functions/sendGuildMessage.js"

export default async (client: FAGCBot, [guild]: [Guild]) => {
	console.log(`Bot has now entered guild ${guild.name}`)

	const fagcconfig = await client.fagc.communities.fetchGuildConfig({
		guildId: guild.id,
	})
	if (!fagcconfig) {
		return sendGuildMessage(
			guild,
			`You do not have an existing FAGC configuration in the guild ${guild.name}, so none has been saved or synchronized`
		)
	}

	client.fagc.websocket.addGuildId(guild.id)
	await client.setBotConfig({
		guildId: guild.id,
		owner: guild.ownerId,
	})
}
