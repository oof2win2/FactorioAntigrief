const { MessageEmbed } = require("discord.js")
const { getMessageResponse } = require("../../utils/responseGetter")
const Command = require("../../base/Command")

class Setup extends Command {
	constructor(client) {
		super(client, {
			name: "test",
			description: "Setup your guild",
			aliases: [],
			usage: ["{{p}}setup"],
			category: "basic",
			dirname: __dirname,
			enabled: true,
			memberPermissions: ["ADMINISTRATOR"],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			ownerOnly: false,
			cooldown: 3000,
			requiredConfig: false,
			customPermissions: ["config"],
		})
	}
	async run() {
		const res = await this.client.getConfig()
		console.log(res)
	}
}
module.exports = Setup