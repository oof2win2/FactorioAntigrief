module.exports = async (client, guild) => {
	client.logger.log(
		`${client.user.username} left guild ${guild.name}`
	)
	client.fagc.communities.guildLeave({
		guildID: guild.id,
	})
}
