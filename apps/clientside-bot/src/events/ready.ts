import FDGLBot from "../base/FDGLBot"
import ENV from "../utils/env"

export default async function handler(client: FDGLBot) {
	console.log(
		`${client.user?.tag} is online since ${new Date().toUTCString()}`
	)

	// send info to backend about guilds, get configs through WS
	client.fdgl.websocket.addGuildId(ENV.GUILDID)
	client.fdgl.websocket.addFilterObjectId(ENV.FILTEROBJECTID)
}
