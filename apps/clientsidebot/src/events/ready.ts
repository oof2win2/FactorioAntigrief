import FAGCBot from "../base/FAGCBot"

export default function handler(bot: FAGCBot) {
	console.log(`${bot.user?.tag} is online since ${new Date().toUTCString()}`)
}