import { Guild } from "discord.js"
import FAGCBot from "../base/FAGCBot.js"
import { sendGuildMessage } from "../utils/functions.js"

export default async (client: FAGCBot, [ guild ]: [Guild]) => {
	console.log(`Bot has now entered guild ${guild.name}`)
	
	const fagcconfig = await client.fagc.communities.fetchGuildConfig(guild.id)
	if (!fagcconfig) {
		return sendGuildMessage(guild, `You do not have an existing FAGC configuration in the guild ${guild.name}, so none has been saved or synchronized`)
	}
	client.guildConfigs.push(fagcconfig)
	await client.setGuildAction({
		guildID: guild.id,
		report: "none",
		revocation: "none"
	})
}