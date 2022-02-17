import path from "node:path"
const __dirname = path.dirname(new URL(import.meta.url).pathname)
process.chdir(__dirname)

import { Intents } from "discord.js"
import FAGCBot from "./utils/FAGCBot.js"
import ENV from "./utils/env.js"


const bot = new FAGCBot({
	intents: [ Intents.FLAGS.GUILDS ],
	fagc: {
		apiurl: ENV.API_URL,
		masterapikey: ENV.MASTERAPIKEY
	}
})

bot.login(ENV.DISCORD_BOTTOKEN)