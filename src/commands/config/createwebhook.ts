import { Command } from "../../base/Command"

const CreateWebhook: Command = {
	name: "createwebhook",
	description:
		"Create a webhook in specified channel to send FAGC notifications to",
	aliases: [],
	usage: "(channel or current channel)",
	examples: ["createwebhook #notifications", "createwebhook"],
	category: "config",
	requiresRoles: true,
	requiredPermissions: ["webhooks"],
	requiresApikey: false,
	run: async ({ client, message }) => {
		const channel = message.mentions.channels.first() || message.channel
		if (!channel.isText())
			return message.channel.send(`${client.emotes.warn} Please specify a text channel`)
		if (channel.type === "DM")
			return message.channel.send(`${client.emotes.warn} You can't create webhooks in DMs`)
		if (channel.isThread())
			return message.channel.send(
				`${client.emotes.warn} You can't create a webhook in a thread`,
			)

		const confirmation = await client.getConfirmationMessage(
			message,
			`Are you sure you want to create a webhook in <#${channel.id}>?`,
		)
		if (!confirmation)
			return message.channel.send(
				`${client.emotes.warn} Webhook creation cancelled`,
			)

		const webhook = await channel.createWebhook("FAGC Notifier")

		try {
			await client.fagc.info.addWebhook({
				webhookId: webhook.id,
				webhookToken: webhook.token || "", // this should be available, but TS doesn't know that
			})

			return message.channel.send(
				"Webhook created successfully! A testing message from the FAGC API should be sent",
			)
		} catch {
			// there is a webhook in this guild already, so it can't be created
			await webhook.delete()
			return message.channel.send(
				`${client.emotes.warn} You already have a webhook in this guild`,
			)
		}
	},
}

export default CreateWebhook
