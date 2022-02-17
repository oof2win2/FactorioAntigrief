import FAGCBot from "../../base/fagcbot"
import ENV from "../../utils/env"
import Logger from "../../utils/logger"

export default (client: FAGCBot) => {
	Logger.log(
		`${client.user?.username} is online: ${new Date()
			.toString()
			.slice(4, 24)}`
	)
	const activities = [
		`${client.guilds.cache.size} servers!`,
		`${client.channels.cache.size} channels!`,
		`${client.users.cache.size} users!`,
	]
	let i = 0
	setInterval(
		() =>
			client.user?.setActivity(
				`${ENV.BOTPREFIX}help | ${activities[i++ % activities.length]}`,
				{ type: "WATCHING" }
			),
		15000
	)
}
