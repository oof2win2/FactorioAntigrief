import FDGLBot from "../../base/fdglbot"
import Logger from "../../utils/logger"

export default (client: FDGLBot) => {
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
			client.user?.setActivity(activities[i++ % activities.length], {
				type: "WATCHING",
			}),
		15000
	)
}
