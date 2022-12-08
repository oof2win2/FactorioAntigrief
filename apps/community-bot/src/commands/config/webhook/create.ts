import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { GuildTextBasedChannel } from "discord.js"
import { SubCommand } from "../../../base/Command"

const ConfigWebhookCreate: SubCommand<false, false> = {
	type: "SubCommand",
	data: new SlashCommandSubcommandBuilder()
		.setName("create")
		.setDescription(
			"Create a webhook in specified channel to send FDGL notifications to"
		)
		.addChannelOption(
			(option) =>
				option
					.setName("channel")
					.setDescription("Channel to create webhook in")
					.setRequired(false)
			// TODO this has a typing error
			// .addChannelTypes(ChannelType.GuildText)
		),
	requiredPermissions: ["webhooks"],
	requiresRoles: true,
	requiresApikey: false,
	fetchFilters: false,
	execute: async ({ interaction, client }) => {
		if (!interaction.guild)
			return interaction.reply(
				`${client.emotes.warn} You can't create webhooks in DMs`
			)

		const channel =
			(interaction.options.getChannel(
				"channel"
			) as GuildTextBasedChannel) || interaction.channel

		if (!channel.isText())
			return interaction.reply(
				`${client.emotes.warn} Please specify a text channel`
			)

		if (channel.isThread())
			return interaction.reply(
				`${client.emotes.warn} You can't create a webhook in a thread`
			)

		const confirmation = await client.getConfirmation(
			interaction,
			`Are you sure you want to create a webhook in <#${channel.id}>?`,
			interaction.user
		)
		if (!confirmation)
			return interaction.followUp(
				`${client.emotes.warn} Webhook creation cancelled`
			)

		const webhook = await channel.createWebhook("FDGL Notifier")

		try {
			await client.fdgl.info.addWebhook({
				webhookId: webhook.id,
				webhookToken: webhook.token || "", // this should be available, but TS doesn't know that
			})

			return interaction.followUp(
				"Webhook created successfully! A testing message from the FDGL API should be sent"
			)
		} catch {
			// there is a webhook in this guild already, so it can't be created
			await webhook.delete()
			return interaction.followUp(
				`${client.emotes.warn} You already have a webhook in this guild`
			)
		}
	},
}

export default ConfigWebhookCreate
