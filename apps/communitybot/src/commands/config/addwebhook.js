const Command = require("../../base/Command")

class AddWebhook extends Command {
	constructor(client) {
		super(client, {
			name: "addwebhook",
			description: "Adds a webhook to send FAGC notifications to",
			aliases: [],
			usage: "[webhook ID] [webhook token]",
			examples: ["{{p}}addwebhook 9945 ThisIsMyToken"],
			category: "config",
			dirname: __dirname,
			enabled: true,
			memberPermissions: ["MANAGE_WEBHOOKS"],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			ownerOnly: false,
			cooldown: 3000,
			requiredConfig: false,
			customPermissions: ["webhooks"],
		})
	}
	async run(message, args) {
		if (!args[0]) return message.reply("Provide a Webhook ID")
		if (!args[1]) return message.reply("Provide a Webhook token")
		message.delete()
		message.reply("Message removed to prevent unauthorized webhook access")

		try {
			await this.client.fetchWebhook(args[0], args[1])
		} catch (e) {
			console.error(e)
			return message.channel.send("Invalid webhook")
		}
		const webhook = await this.client.fagc.info.addWebhook(args[0], args[1])
		if (webhook.guildId)
			return message.reply("The webhook will recieve FAGC notifications from now on! Testing message has been sent")
		else if (webhook.error && webhook.error == "Forbidden")
			return message.reply("You already have a webhook running in your server. You cannot have more than 1 webhook per server")
		else {
			console.error(webhook, Date.now())
			return message.reply("Error creating webhook")
		}
	}
}
module.exports = AddWebhook