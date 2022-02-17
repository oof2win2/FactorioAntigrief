import FAGCBot from "../../base/fagcbot"
import Logger from "../../utils/logger"

export default (client: FAGCBot) => {
	Logger.log(
		`${client.user?.username} is invalidated: ${new Date()
			.toString()
			.slice(4, 24)}`,
		"error"
	)
}
