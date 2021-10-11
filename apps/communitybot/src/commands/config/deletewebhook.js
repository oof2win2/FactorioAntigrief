const Command = require("../../base/Command")

class AddWebhook extends Command {
	constructor(client) {
		super(client, {
			name: "deletewebhook",
			description:
				"Remove a webhook from a specified channel to stop sending FAGC notifications to",
			aliases: [],
			usage: "[channel]",
			examples: [
				"{{p}}deletewebhook #notifications",
				"{{p}}deletewebhook",
			],
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
	async run(message) {
		const channel = message.mentions.channels.first() || message.channel
		const webhooks = await channel
			.fetchWebhooks()
			.then((webhooks) =>
				webhooks.filter(
					(webhook) => webhook.owner.id == this.client.user?.id
				)
			)
		webhooks.map((webhook) =>
			this.client.fagc.info.removeWebhook(webhook.id, webhook.token)
		)
		webhooks.map((webhook) => webhook.delete())
		return message.channel.send("Attempted at removing webhooks")
	}
}
module.exports = AddWebhook
