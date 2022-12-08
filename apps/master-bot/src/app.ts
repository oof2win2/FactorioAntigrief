process.chdir(__dirname)

import { Intents } from "discord.js"
import FDGLBot from "./utils/FDGLBot.js"
import ENV from "./utils/env.js"

const bot = new FDGLBot({
	intents: [Intents.FLAGS.GUILDS],
	fdgl: {
		apiurl: ENV.API_URL,
		masterapikey: ENV.MASTERAPIKEY,
	},
})

bot.login(ENV.DISCORD_BOTTOKEN)
