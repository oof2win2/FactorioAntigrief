const ConfigModel = require("../../database/schemas/config")
const { MessageEmbed } = require("discord.js")


module.exports = async (client, guild) => {
	client.logger.log(`${client.user.username} joined guild ${guild.name}. Setting up config`)
	const owner = guild.owner || await client.users.fetch(guild.ownerID)
	// create initial config only if it doesn't exist yet
	ConfigModel.findOne({ guildid: guild.id }).then((config) => {
		if (config) return
		console.log("Creating config")
		ConfigModel.create({
			communityname: guild.name,
			guildid: guild.id,
			contact: owner.id,
			apikey: "",
		})
	})
	let embed = new MessageEmbed()
		.setTitle("Welcome to FAGC")
		.setColor(client.config.embeds.color)
		.setFooter(client.config.embeds.footer)
		.setTimestamp()
	embed.addFields(
		{ name: "FAGC Invite", value: client.config.fagcInvite },
		{
			name: "Initial Setup",
			value: "We assume that you want to set your guild up. For now, your guild data has been set to a few defaults, " +
				"such as the guild contact being the guild's owner. To change this, you can always run `fagc!setup`. " +
				"Run `fagc!help` to view command help. Commands don't work in DMs!"
		},
		{ name: "Bot Prefix", value: "The bot prefix is, and always will be, `fagc!`. This is displayed in the bot's status" }
	)
	if (guild.systemChannel) {
		await guild.systemChannel.createOverwrite(client.user.id, {
			"SEND_MESSAGES": true,
			"EMBED_LINKS": true,
			"ATTACH_FILES": true,
		})
		guild.systemChannel.send(embed)
	} else {
		try {
			owner.send(embed)
		// eslint-disable-next-line no-empty
		} catch { }
	}
}