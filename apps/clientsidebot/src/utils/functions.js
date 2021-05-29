module.exports = {
	handleErrors,
}

/**
 * 
 * @param {Object} msg - Discord message
 * @param {Object} response - API error message
 * @param {string} response.error - API error name
 * @param {string} response.description - API error description
 */
async function handleErrors(msg, response) {
	if (!msg.channel) return
	switch (response.error) {
	case "AuthenticationError": {
		switch (response.description) {
		case "API key is wrong":
			return msg.channel.send("Error: API key has been set incorrectly.")
		}
		break
	}
	default:
		msg.channel.send(`Error \`${response.error}\`: \`${response.description}\``)
	}
}