import { Command } from "../../base/Command";
import { getConfirmationMessage, getMessageResponse } from "../../utils/responseGetter";
import { MessageEmbed } from "discord.js";

const SetPermissions: Command = {
	name: "setpermissions",
	aliases: ["setperms", "setperms", "setperms", "setperms"],
	description: "Set the permissions for a role",
	usage: "[setting] [permission] [role]",
	examples: ["setperms", "setperms reports", "setperms reports 429696038266208258"],
	category: "config",
	requiresRoles: true,
	requiredPermissions: ["setConfig"],
	requiresApikey: false,
	run: async ({ client, message, args, guildConfig }) => {
		const permStrings = ["reports", "webhooks", "setConfig", "setRules", "setCommunities"]

		if (!args[0]) {
			// set all perms at once
			message.channel.send("Process of setting roles has started.")
			
			const reportsMessage = await getMessageResponse(message, "Type in the ID or ping the role for the reports permission")
			const reportsRole = reportsMessage?.mentions.roles.first() || message.guild.roles.cache.get(reportsMessage?.content?.split(" ")[0] || "")
			if (!reportsRole) return message.channel.send(`${client.emotes.warn} \`${reportsMessage?.content?.split(" ")[0]}\` is not a valid role`)

			const webhooksMessage = await getMessageResponse(message, "Type in the ID or ping the role for the webhooks permission")
			const webhooksRole = webhooksMessage?.mentions.roles.first() || message.guild.roles.cache.get(webhooksMessage?.content?.split(" ")[0] || "")
			if (!webhooksRole) return message.channel.send(`${client.emotes.warn} \`${webhooksMessage?.content?.split(" ")[0]}\` is not a valid role`)

			const setConfigMessage = await getMessageResponse(message, "Type in the ID or ping the role for the setConfig permission")
			const setConfigRole = setConfigMessage?.mentions.roles.first() || message.guild.roles.cache.get(setConfigMessage?.content?.split(" ")[0] || "")
			if (!setConfigRole) return message.channel.send(`${client.emotes.warn} \`${setConfigMessage?.content?.split(" ")[0]}\` is not a valid role`)

			const setRulesMessage = await getMessageResponse(message, "Type in the ID or ping the role for the setRules permission")
			const setRulesRole = setRulesMessage?.mentions.roles.first() || message.guild.roles.cache.get(setRulesMessage?.content?.split(" ")[0] || "")
			if (!setRulesRole) return message.channel.send(`${client.emotes.warn} \`${setRulesMessage?.content?.split(" ")[0]}\` is not a valid role`)

			const setCommunitiesMessage = await getMessageResponse(message, "Type in the ID or ping the role for the setCommunities permission")
			const setCommunitiesRole = setCommunitiesMessage?.mentions.roles.first() || message.guild.roles.cache.get(setCommunitiesMessage?.content?.split(" ")[0] || "")
			if (!setCommunitiesRole) return message.channel.send(`${client.emotes.warn} \`${setCommunitiesMessage?.content?.split(" ")[0]}\` is not a valid role`)

			const embed = new MessageEmbed()
				.setTitle("FAGC Role Config")
				.setAuthor({name: client.config.embeds.author})
				.setFooter({text: client.config.embeds.footer})
				.setTimestamp()
				.setDescription("Your FAGC Role Configuration")
				.addFields([
					{ name: "Reports Management", value: `<@&${reportsRole.id}>` },
					{ name: "Webhook Management", value: `<@&${webhooksRole.id}>` },
					{ name: "Config Management", value: `<@&${setConfigRole.id}>` },
					{ name: "Rule Management", value: `<@&${setRulesRole.id}>` },
					{ name: "Communities Management", value: `<@&${setCommunitiesRole.id}>` },
				])
			message.channel.send({
				embeds: [embed],
			})
			const confirmation = await getConfirmationMessage(
				message,
				"Are you sure you want these settings applied?"
			)
			if (!confirmation) return message.channel.send("Role configuration cancelled")

			try {
				await client.saveGuildConfig({
					...guildConfig,
					roles: {
						reports: reportsRole.id,
						webhooks: webhooksRole.id,
						setConfig: setConfigRole.id,
						setRules: setRulesRole.id,
						setCommunities: setCommunitiesRole.id
					}
				})
				return message.channel.send(`${client.emotes.success} Successfully set all permissions!`)
			} catch (e) {
				message.channel.send(`${client.emotes.warn} An error occured. Please try again later`)
				throw e
			}
		} else if (!args[1]) {
			// has perm type, but not role ID
			const permType = args[0]
			if (!permStrings.includes(permType)) return message.reply(`${client.emotes.warn} \`${permType}\` is not a valid permission type`)

			const roleMessage = await getMessageResponse(message, "Type in the ID or ping the role for the permission")
			const role = roleMessage?.mentions.roles.first() || message.guild.roles.cache.get(roleMessage?.content?.split(" ")[0] || "")
			if (!role) return message.channel.send(`${client.emotes.warn} \`${roleMessage?.content?.split(" ")[0]}\` is not a valid role`)

			const confirmation = await getConfirmationMessage(
				message,
				`Are you sure you want to set the ${permType} permission to ${role.name}?`
			)
			if (!confirmation) return message.channel.send("Role configuration cancelled")

			try {
				await client.saveGuildConfig({
					guildId: message.guild.id,
					// this works but just needs to have the right types, maybe a SetGuilConfig type from fagc-api-types
					// @ts-ignore
					roles: {
						[permType]: role.id
					}
				})
				return message.channel.send(`${client.emotes.success} Successfully set the ${permType} permission to ${role.name}!`)
			} catch (e) {
				message.channel.send(`${client.emotes.warn} An error occured. Please try again later`)
				throw e
			}
		} else {
			// has both perm type and role ID
			const permType = args[0]
			if (!permStrings.includes(permType)) return message.reply(`${client.emotes.warn} \`${permType}\` is not a valid permission type`)
			const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1])
			if (!role) return message.channel.send(`${client.emotes.warn} \`${args[1]}\` is not a valid role`)

			const confirmation = await getConfirmationMessage(
				message,
				`Are you sure you want to set the ${permType} permission to ${role.name}?`
			)
			if (!confirmation) return message.channel.send("Role configuration cancelled")

			try {
				await client.saveGuildConfig({
					...guildConfig,
					// this works but just needs to have the right types, maybe a SetGuilConfig type from fagc-api-types
					// @ts-ignore
					roles: {
						[permType]: role.id
					}
				})
				return message.channel.send(`${client.emotes.success} Successfully set the ${permType} permission to ${role.name}!`)
			}
			catch (e) {
				message.channel.send(`${client.emotes.warn} An error occured. Please try again later`)
				throw e
			}
		}
	}
}

export default SetPermissions