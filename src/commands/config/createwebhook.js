const Command = require("../../base/Command")

class AddWebhook extends Command {
	constructor(client) {
		super(client, {
			name: "createwebhook",
			description:
				"Create a webhook in specified channel to send FAGC notifications to",
			aliases: [],
			usage: "(channel or current channel)",
			examples: [
				"{{p}}createwebhook #notifications",
				"{{p}}createwebhook",
			],
			category: "config",
			dirname: __dirname,
			enabled: true,
			memberPermissions: [ "MANAGE_WEBHOOKS" ],
			botPermissions: [ "SEND_MESSAGES", "EMBED_LINKS" ],
			ownerOnly: false,
			cooldown: 3000,
			requiredConfig: false,
			customPermissions: [ "webhooks" ],
		})
	}
	async run(message) {
		const channel = message.mentions.channels.first() || message.channel
		const webhook = await channel.createWebhook("FAGC Notifier")
		try {
			await this.client.fagc.info.addWebhook(webhook.id, webhook.token)
			message.channel.send("Webhook created successfully!")
		} catch (e) {
			await webhook.delete()
			if (e.message.includes("Forbidden"))
				return message.channel.send(
					`${this.client.emotes.warn} You already have a webhook in this guild`
				)
			console.error(e)
			return message.channel.send(
				`${this.client.emotes.error} An error occured. Please contact developers`
			)
		}
	}
}
module.exports = AddWebhook
