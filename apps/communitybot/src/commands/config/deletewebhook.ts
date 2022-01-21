import { Command } from "../../base/Command";

const DeleteWebhook: Command = {
	name: "deletewebhook",
	description: "Remove a webhook from a specified channel to stop sending FAGC notifications to",
	aliases: [],
	usage: "[channel]",
	examples: [ "deletewebhook", "deletewebhook #notifications", ],
	category: "config",
	requiresRoles: true,
	requiredPermissions: ["webhooks"],
	requiresApikey: false,
	run: async ({client, message}) => {
		const channel = message.mentions.channels.first() || message.channel
		if (!channel.isText()) return message.channel.send("Please specify a text channel")
		if (channel.type === "DM") return message.channel.send("Please specify a text channel")
		if (channel.isThread()) return message.channel.send("You cannot have a webhook in a thread")

		const webhooks = await channel.fetchWebhooks()
		webhooks
			// TODO: change when https://github.com/discordjs/discord.js/pull/7317 is merged
			.filter((webhook) => webhook.owner?.id == client.user?.id)
			.filter((webhook) => Boolean(webhook.token))
			.map((webhook) => {
				// there should be only one removeWebhook call, as guilds are limited to 1 webhook / guild
				client.fagc.info.removeWebhook({
					webhookid: webhook.id,
					webhooktoken: webhook.token!,
				})
				webhook.delete()
			})
		return message.channel.send("Attempted at removing webhooks")
	}
}
export default DeleteWebhook