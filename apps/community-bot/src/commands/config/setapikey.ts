import { Command } from "../../base/Command"

const Setapikey = Command({
	name: "setapikey",
	description: "Set API key",
	aliases: [],
	usage: "[API KEY]",
	examples: ["setapikey potatoKey"],
	category: "config",
	requiresRoles: true,
	requiredPermissions: [],
	requiresApikey: false,
	fetchFilters: false,
	run: async ({ client, message, args, guildConfig }) => {
		message.delete()
		message.channel.send(
			"Your message has been removed to prevent unauthorized API access"
		)

		// if the person doesn't have sufficient permissions, throw an error
		if (
			!message.member!.permissions.has("ADMINISTRATOR") &&
			message.guild.ownerId !== message.author.id &&
			!message.member!.roles.cache.has(guildConfig.roles.setConfig)
		) {
			const role = await message.guild.roles.fetch(
				guildConfig.roles.setConfig
			)
			return message.channel.send(
				`${client.config.emotes.error} You do not have permission to run this command. ` +
					`You need to either be the guild owner, have the \`ADMINISTRATOR\` permission, or have the \`${
						role ? role.name : "unknown role"
					}\` role.`
			)
		}

		const key = args.shift()
		if (!key)
			return message.channel.send(
				"You must provide your API key as a parameter"
			)

		const community = await client.fagc.communities
			.fetchOwnCommunity({
				reqConfig: {
					apikey: key,
				},
			})
			.catch(() => null)
		if (!community)
			return message.channel.send(
				"That API key is not associated with a community"
			)
		if (community.contact !== message.author.id) {
			const contact = await client.users
				.fetch(community.contact)
				.catch(() => null)
			if (contact)
				contact.send(
					`User ${message.author.tag} has attempted to use your API key in ${message.guild.name}`
				)
			return message.channel.send(
				"That API key is not associated with your Discord user ID"
			)
		}

		await client.fagc.communities.setGuildConfigMaster({
			config: {
				communityId: community.id,
				guildId: message.guild.id,
				apikey: key,
			},
		})

		return message.channel.send(`API key set by <@${message.author.id}>`)
	},
})

export default Setapikey
