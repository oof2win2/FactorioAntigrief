const fetch = require("node-fetch")
const Command = require("../../base/Command")

class RemoveWebhook extends Command {
	constructor(client) {
		super(client, {
			name: "removewebhook",
			description: "Removes a webhook from getting FAGC notifications",
			aliases: [],
			usage: "[webhook ID] [webhook token]",
			examples: ["{{p}}removewebhook 9945 ThisIsMyToken"],
			category: "informatics",
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
	async run (message, args) {
		message.delete()
		message.reply("Message removed to prevent unauthorized webhook access")
		if (!message.member.hasPermission("MANAGE_WEBHOOKS")) return message.reply("Nice try! You need the `MANAGE_WEBHOOKS` permission!")
		if (!args[0]) return message.reply("Provide a Webhook ID")
		if (!args[1]) return message.reply("Provide a Webhook token")

		try {
			await this.client.fetchWebhook(args[0], args[1])
		} catch (e) {
			return message.channel.send("Invalid webhook")
		}
		const webRaw = await fetch(`${this.client.config.apiurl}/informatics/removewebhook`, {
			method: "DELETE",
			body: JSON.stringify({
				id: args[0],
				token: args[1],
				guildid: message.guild.id
			}),
			headers: { "content-type": "application/json" }
		})
		const webhook = await webRaw.json()
		if (webhook && webhook.guildid) {
			return message.reply("The webhook will no longer be recieving FAGC notifications!")
		} else if (webhook === null) {
			return message.reply("Webhook is not linked to FAGC!")
		} else {
			console.error(webhook, Date.now())
			return message.reply("Error removing webhook")
		}
	}
}
module.exports = RemoveWebhook