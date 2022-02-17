import { Command } from "../../base/Command"

const Setapikey: Command = {
	name: "setapikey",
	description: "Set API key",
	aliases: [],
	usage: "[API KEY]",
	examples: ["setapikey potatoKey"],
	category: "config",
	requiresRoles: true,
	requiredPermissions: ["setConfig"],
	requiresApikey: false,
	run: async ({ client, message, args }) => {
		const key = args.shift()
		if (!key)
			return message.channel.send(
				"You must provide your API key as a parameter"
			)

		message.delete()
		message.channel.send(
			"Your message has been removed to prevent unauthorized API access"
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
}

export default Setapikey
