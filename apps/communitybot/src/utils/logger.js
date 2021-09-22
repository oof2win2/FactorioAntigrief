const { bgBlue, black, green } = require("chalk")
const dateformat = require("dateformat")

// makes logs look pretty and uniform

module.exports = class Logger {
	static log(content, type = "log") {
		const date = `[${dateformat(Date.now(), "yyyy-mm-dd hh:MM:ss.l")}]`
		switch (type) {
			case "log":
				return console.log(
					`${date} ${bgBlue(type.toUpperCase())} ${content}`
				)
			case "warn":
				return console.log(
					`${date} ${black.bgYellow(type.toUpperCase())} ${content}`
				)
			case "error":
				return console.log(
					`${date} ${black.bgRed(type.toUpperCase())} ${content}`
				)
			case "debug":
				return console.log(
					`${date} ${green(type.toUpperCase())} ${content}`
				)
			case "cmd":
				return console.log(
					`${date} ${black.bgWhite(type.toUpperCase())} ${content}`
				)
			case "ready":
				return console.log(
					`${date} ${black.bgGreen(type.toUpperCase())} ${content}`
				)
			default:
				throw new TypeError(
					"Logger type must be either warn, debug, log, ready, cmd or error."
				)
		}
	}
}
