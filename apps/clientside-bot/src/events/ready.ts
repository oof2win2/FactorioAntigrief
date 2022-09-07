import FAGCBot from "../base/FAGCBot"
import ENV from "../utils/env"

export default async function handler(client: FAGCBot) {
	console.log(
		`${client.user?.tag} is online since ${new Date().toUTCString()}`
	)

	// send info to backend about guilds, get configs through WS
	client.fagc.websocket.addGuildId(ENV.GUILDID)
	client.fagc.websocket.addFilterObjectId(ENV.FILTEROBJECTID)
}
