const Command = require("../../base/Command")

class RemoveWebhook extends Command {
	constructor(client) {
		super(client, {
			name: "removewebhook",
			description: "Removes a webhook from getting FAGC notifications",
			aliases: [],
			usage: "[webhook ID] [webhook token]",
			examples: [ "{{p}}removewebhook 9945 ThisIsMyToken" ],
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
	async run(message, args) {
		message.delete()
		message.reply("Message removed to prevent unauthorized webhook access")

		if (!args[0]) return message.reply(`${this.client.emotes.warn} Provide a Webhook URL`)

		// discord webhook link to id and token separately
		const [ webhookID, webhookToken ] = args[0]
			.slice(args[0].indexOf("/api/webhooks") + 14)
			.split("/")

		try {
			await this.client.fetchWebhook(webhookID, webhookToken)
		} catch (e) {
			return message.channel.send(`${this.client.emotes.warn} Invalid webhook`)
		}

		const webhook = await this.client.fagc.info.removeWebhook(
			webhookID,
			webhookToken
		)
		if (webhook && webhook.guildId) {
			return message.reply(
				"The webhook will no longer be recieving FAGC notifications!"
			)
		} else if (webhook === null) {
			return message.reply("Webhook is not linked to FAGC!")
		} else {
			console.error(webhook, Date.now())
			return message.reply(`${this.client.emotes.error} Error removing webhook`)
		}
	}
}
module.exports = RemoveWebhook
