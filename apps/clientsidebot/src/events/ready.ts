import FAGCBot from "../base/FAGCBot"

export default function handler(client: FAGCBot) {
	console.log(`${client.user?.tag} is online since ${new Date().toUTCString()}`)

	// load guild configs
	client.guilds.cache.forEach(async (guild) => {
		const config = await client.fagc.communities.fetchGuildConfig(guild.id)
		if (config) client.guildConfigs.set(guild.id, config)
	})
}