import { MessageEmbed } from "discord.js"
import { Command } from "../../base/Command"
import { createPagedEmbed } from "../../utils/functions"
import {
	getConfirmationMessage,
	getMessageResponse,
} from "../../utils/responseGetter"

const AddCommunity: Command = {
	name: "addcommunity",
	description: "Add communities to your community filter",
	aliases: ["addcommunities"],
	usage: "[...ids]",
	examples: ["addcommunity XuciBx7", "addcommunity XuciBx7 XuciBx9 XuciBx/"],
	category: "communities",
	requiresRoles: true,
	requiredPermissions: ["setCommunities"],
	requiresApikey: false,
	run: async ({ client, message, args, guildConfig }) => {
		const allCommunities = await client.fagc.communities.fetchAll({})

		// if there are no args, show the current communities and ask for new args
		if (!args.length) {
			const embed = new MessageEmbed()
				.setTitle("FAGC Communities")
				.setColor("GREEN")
				.setTimestamp()
				.setAuthor({ name: client.config.embeds.author })
				.setFooter({ text: client.config.embeds.footer })
				.setDescription("All FAGC Communities")
			const fields = await Promise.all(
				allCommunities
					.filter((r) => !guildConfig.trustedCommunities.includes(r.id))
					.map(async (community) => {
						const user = await client.users
							.fetch(community.contact)
							.catch(() => null)
						return {
							name: `${community.name} | \`${community.id}\``,
							value: `Contact: <@${user?.id}> | ${user?.tag}`,
							inline: false,
						}
					}),
			)
			createPagedEmbed(fields, embed, message, { maxPageCount: 10 })
			const newIDsMessage = await getMessageResponse(
				message,
				`${client.emotes.type} No communities provided. Please provide IDs in a single message, separated with spaces:`,
			)
			if (!newIDsMessage || !newIDsMessage.content)
				return message.channel.send("No IDs were provided")
			args = newIDsMessage.content.split(" ")
		}

		const communitiesToAdd = args
			// check if the community exists
			.filter((id) => Boolean(allCommunities.find((c) => c.id === id)))
			// check if the community is already in the filter
			.filter((id) => !guildConfig.trustedCommunities.includes(id))

		if (!communitiesToAdd.length)
			return message.channel.send("No valid or new communities to add")

		const confirmationEmbed = new MessageEmbed()
			.setTitle("FAGC Communities")
			.setColor("GREEN")
			.setTimestamp()
			.setAuthor({ name: client.config.embeds.author })
			.setFooter({ text: client.config.embeds.footer })
			.setDescription("All FAGC Communities")
		const fields = await Promise.all(
			communitiesToAdd.map(async (id) => {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const community = allCommunities.find((c) => c.id === id)!
				const user = await client.users
					.fetch(community.contact)
					.catch(() => null)
				return {
					name: `${community.name} | \`${community.id}\``,
					value: `Contact: <@${user?.id}> | ${user?.tag}`,
					inline: false,
				}
			}),
		)
		createPagedEmbed(fields, confirmationEmbed, message, { maxPageCount: 10 })
		const confirm = await getConfirmationMessage(
			message,
			"Are you sure you want to add these communities to your communities filters?",
		)
		if (!confirm) return message.channel.send("Adding communities cancelled")

		communitiesToAdd.forEach((id) => {
			guildConfig.trustedCommunities.push(id)
		})
		await client.saveGuildConfig(guildConfig)
		return message.channel.send("Successfully added community filters")
	},
}
export default AddCommunity
