import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import {
	Formatters,
	MessageActionRow,
	Modal,
	TextInputComponent,
} from "discord.js"
import { SubCommand } from "../../../base/Command"

const ConfigSetApikey: SubCommand<false, false> = {
	type: "SubCommand",
	data: new SlashCommandSubcommandBuilder()
		.setName("apikey")
		.setDescription("Set API key"),
	requiredPermissions: [],
	requiresRoles: true,
	requiresApikey: false,
	fetchFilters: false,
	execute: async ({ interaction, client, guildConfig }) => {
		// if the person doesn't have sufficient permissions, throw an error
		if (
			!interaction.member.permissions.has("ADMINISTRATOR") &&
			interaction.guild.ownerId !== interaction.user.id &&
			!interaction.member.roles.cache.has(guildConfig.roles.setConfig)
		) {
			const role = await interaction.guild.roles.fetch(
				guildConfig.roles.setConfig
			)
			return interaction.reply(
				`${client.config.emotes.error} You do not have permission to run this command. ` +
					`You need to either be the guild owner, have the \`ADMINISTRATOR\` permission, or have the \`${
						role ? role.name : "unknown role"
					}\` role.`
			)
		}

		const row = new MessageActionRow<TextInputComponent>().addComponents(
			new TextInputComponent()
				.setCustomId("apikey")
				.setLabel("API key")
				.setRequired(true)
				.setStyle("SHORT")
				.setMinLength(10)
				.setMaxLength(2048)
		)

		try {
			await interaction.showModal(
				new Modal()
					.setCustomId("apikeyModal")
					.setTitle("API Key")
					.addComponents(row)
			)

			const modal = await interaction.awaitModalSubmit({
				time: 30000,
				filter: (m) => m.user.id === interaction.user.id,
			})

			const key = modal.fields.getTextInputValue("apikey")

			const community = await client.fagc.communities
				.fetchOwnCommunity({
					reqConfig: {
						apikey: key,
					},
				})
				.catch(() => null)
			if (!community)
				return modal.reply(
					"That API key is not associated with a community"
				)
			if (community.contact !== interaction.user.id) {
				const contact = await client.users
					.fetch(community.contact)
					.catch(() => null)
				if (contact)
					contact.send(
						`User ${interaction.user.tag} has attempted to use your API key in ${interaction.guild.name}`
					)
				return modal.reply(
					"That API key is not associated with your Discord user ID"
				)
			}

			await client.fagc.communities.setGuildConfigMaster({
				config: {
					communityId: community.id,
					guildId: interaction.guild.id,
					apikey: key,
				},
			})

			return modal.reply(
				`API key set by ${Formatters.userMention(interaction.user.id)}`
			)
		} catch (err) {
			console.log(err)
		}
	},
}

export default ConfigSetApikey
