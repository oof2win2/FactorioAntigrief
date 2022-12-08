import FDGLBot from "../../base/fdglbot"
import Logger from "../../utils/logger"

export default (client: FDGLBot) => {
	Logger.log(
		`${client.user?.username} is invalidated: ${new Date()
			.toString()
			.slice(4, 24)}`,
		"error"
	)
}
