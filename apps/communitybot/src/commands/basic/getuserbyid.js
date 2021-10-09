const { MessageEmbed } = require("discord.js")
const Command = require("../../base/Command")
const dateFormat = require("dateformat")

class GetUserById extends Command {
	constructor(client) {
		super(client, {
			name: "getuserbyid",
			description: "Gets a Discord user by their ID",
			aliases: ["getuser", "viewuserbyid", "viewuser"],
			category: "basic",
			usage: "[Discord User ID]",
			dirname: __dirname,
			enabled: true,
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			ownerOnly: false,
			cooldown: 5000,
		})
	}
	async run(message, args) {
		const uid = args.shift()
		const user = await this.client.users.fetch(uid)
		if (!user && !user.id)
			return message.reply(
				"This user could not be found. They may not exist"
			)
		let embed = new MessageEmbed()
			.setTitle("FAGC User Info")
			.setColor(this.client.config.embeds.color)
			.setFooter(this.client.config.embeds.footer)
			.setTimestamp()
			.setAuthor("FAGC Community")
			.setImage(user.avatarURL())
		embed.addFields(
			{ name: "User's ID", value: user.id, inline: true },
			{ name: "User's tag", value: user.tag, inline: true },
			{
				name: "Joined Discord at",
				value: dateFormat(user.createdAt, "yyyy-mm-dd hh:MM:ss.l"),
				inline: true,
			}
		)
		return message.reply(embed)
	}
}

module.exports = GetUserById
