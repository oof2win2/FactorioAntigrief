import { Client } from "discord.js"
import ENV from "./env"

// this is so that the client can be accessed from any file
const client = new Client()
client.login(ENV.DISCORD_BOTTOKEN)
export default client