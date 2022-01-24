import FAGCBot from "../base/FAGCBot"

export default function handler(client: FAGCBot) {
	console.log(`${client.user?.tag} is online since ${new Date().toUTCString()}`)

	client.guilds.cache.map((guild => {
		// send info to backend about guilds, get configs through WS
		client.fagc.websocket.addGuildId(guild.id)

		// create bot configs if they dont exist
		const config = client.getBotConfig(guild.id)
		if (!config) client.setBotConfig({
			guildID: guild.id,
			owner: guild.ownerId,
		})
	}))
}