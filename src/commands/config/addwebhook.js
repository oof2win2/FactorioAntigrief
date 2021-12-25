const Command = require("../../base/Command")

class AddWebhook extends Command {
	constructor(client) {
		super(client, {
			name: "addwebhook",
			description: "Adds a webhook to send FAGC notifications to",
			aliases: [],
			usage: "[webhook ID] [webhook token]",
			examples: [ "{{p}}addwebhook 9945 ThisIsMyToken" ],
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
		if (!args[0]) return message.reply(`${this.client.emotes.warn} Provide a Webhook URL`)
		message.delete()
		message.reply("Message removed to prevent unauthorized webhook access")

		// discord webhook link to id and token separately
		const [ webhookID, webhookToken ] = args[0]
			.slice(args[0].indexOf("/api/webhooks") + 14)
			.split("/")

		try {
			await this.client.fetchWebhook(webhookID, webhookToken)
		} catch (e) {
			console.error(e)
			return message.channel.send(`${this.client.emotes.warn} Invalid webhook`)
		}
		const webhook = await this.client.fagc.info.addWebhook({
			webhookid: webhookID,
			webhooktoken: webhookToken
		})
		if (webhook.guildId)
			return message.reply(
				"The webhook will recieve FAGC notifications from now on! Testing message has been sent"
			)
		else {
			return message.reply(
				`${this.client.emotes.warn} You already have a webhook running in your server. You cannot have more than 1 webhook per server`
			)
		}
	}
}
module.exports = AddWebhook
