const { Message } = require("discord.js")
const responses = require("./responses")

Message.prototype.error = function (string, options = {}) {
	// allows error messages to be sent with a standard response and emoji
	options.prefixEmoji = "error"
	string = responses.error[string] ? responses.error[string] : string
	return this.sendMessage(string, options)
}

Message.prototype.success = function (string, options = {}) {
	// allows success messages to be sent with a standard response and emoji
	options.prefixEmoji = "success"
	return this.sendMessage(string, options)
}

Message.prototype.sendMessage = function (string, options = {}) {
	// sends a message with options/edits the message
	if (options.prefixEmoji) {
		string = `${this.client.emotes[options.prefixEmoji]} | ${string}`
	}
	if (options.edit) {
		return this.edit(string)
	} else {
		return this.channel.send(string)
	}
}
