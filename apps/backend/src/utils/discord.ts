import { Client, User } from "discord.js"
import { REST } from "@discordjs/rest"
import ENV from "./env"

// this is so that the client can be accessed from any file
export const client = new Client({
	intents: ["GUILDS"],
})

// this is so that the discord api can be accessed from any file
export const rest = new REST({ version: "10" }).setToken(ENV.DISCORD_BOTTOKEN)

/**
 * Checks if a string is a valid Discord user ID. Returns false if the user is not in a server with the bot
 */
export async function validateDiscordUser(
	userId: string
): Promise<false | User> {
	try {
		const user = await client.users.fetch(userId)
		return user
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
