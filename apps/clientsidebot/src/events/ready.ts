import FAGCBot from "../base/fagcbot"

export default async (client: FAGCBot): Promise<void> => {
	client.logger(`${client.user.username} is online: ${new Date().toString().slice(4, 24)}`)
	const activities = [
		`${client.guilds.cache.size} servers!`,
		`${client.channels.cache.size} channels!`,
		`${client.users.cache.size} users!`,
	]
	let i = 0
	setInterval(
		() =>
			client.user.setActivity(
				`${client.config.prefix}help | ${activities[i++ % activities.length]}`,
				{ type: "WATCHING" }
			),
		15000
	)
}