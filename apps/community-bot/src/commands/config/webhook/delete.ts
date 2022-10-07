import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { GuildTextBasedChannel } from "discord.js"
import { SubCommand } from "../../../base/Command"

const ConfigWebhookDelete: SubCommand<false, false> = {
	type: "SubCommand",
	data: new SlashCommandSubcommandBuilder()
		.setName("delete")
		.setDescription(
			"Remove a webhook from a specified channel to stop sending FAGC notifications to"
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

		const statusMessage = await interaction.reply({
			content: "Attempting to remove webhooks...",
			fetchReply: true,
		})

		const webhooks = await channel.fetchWebhooks()
		webhooks
			// TODO: change when https://github.com/discordjs/discord.js/pull/7317 is merged
			.filter((webhook) => webhook.owner?.id == client.user?.id)
			.filter((webhook) => Boolean(webhook.token))
			.filter((webhook): webhook is typeof webhook & { token: string } =>
				Boolean(webhook.token)
			)
			.map(async (webhook) => {
				// there should be only one removeWebhook call, as guilds are limited to 1 webhook / guild
				await client.fagc.info.removeWebhook({
					webhookId: webhook.id,
					webhookToken: webhook.token,
				})
				statusMessage.edit(`Removed webhook from <#${channel.id}>`)
				webhook.delete()
			})
	},
}

export default ConfigWebhookDelete
