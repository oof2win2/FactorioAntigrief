const { createGuildConfig } = require("../../utils/functions")

module.exports = async (client, guild) => {
	client.logger.log(
		`${client.user.username} joined guild ${guild.name}. Setting up config`
	)
	createGuildConfig(guild, client)
}
