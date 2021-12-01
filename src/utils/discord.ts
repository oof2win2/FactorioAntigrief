import { Client } from "discord.js"
import OAuthClient from "discord-oauth2"
import ENV from "./env.js"

// this is so that the client can be accessed from any file
export const client = new Client({
	intents: [ "GUILD_MEMBERS", "GUILDS" ],
})
client.login(ENV.DISCORD_BOTTOKEN)

// some oauth stuff for the users, used for website. WIP.
export const OAuth2Client = new OAuthClient({
	clientId: ENV.APPID,
	clientSecret: ENV.APPSECRET,

	redirectUri: ENV.APPREDIRECTURI,
})

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
