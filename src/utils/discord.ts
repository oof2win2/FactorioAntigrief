import { Client } from "discord.js"
import ENV from "./env.js"

// this is so that the client can be accessed from any file
const client = new Client({
	intents: ["GUILD_MEMBERS", "GUILDS"]
})
client.login(ENV.DISCORD_BOTTOKEN)
export default client

/**
 * Checks if a string is a valid Discord user ID. Returns false if the user is not in a server with the bot
 */
export async function validateDiscordUser(userId: string): Promise<boolean> {
	try {
		await client.users.fetch(userId)
		return true
	} catch {
		return false
	}
}

/**
 * Checks if a string is a valid Discord guild ID. Returns false if the bot is not in this guild
 */
export async function validateDiscordGuild(guildId: string): Promise<boolean> {
	try {
		await client.guilds.fetch(guildId)
		return true
	} catch {
		return false
	}
}