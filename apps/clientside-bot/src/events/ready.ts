import FAGCBot from "../base/FAGCBot"
import ENV from "../utils/env"

export default async function handler(client: FAGCBot) {
	console.log(
		`${client.user?.tag} is online since ${new Date().toUTCString()}`
	)

	await client.guilds.fetch()
	await client.getAllGuildConfigs()

	client.guilds.cache.map(async (guild) => {
		// send info to backend about guilds, get configs through WS
		client.fagc.websocket.addGuildId(guild.id)

		// create bot configs if they dont exist
		const config = await client.getBotConfig(guild.id)
		if (!config)
			client.setBotConfig({
				guildId: guild.id,
				owner: guild.ownerId,
			})
	})
	client.fagc.websocket.addFilterObjectId(ENV.FILTEROBJECTID)
}
