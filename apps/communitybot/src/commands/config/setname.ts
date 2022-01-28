import { AuthError } from "fagc-api-wrapper"
import { Command } from "../../base/Command"

const SetName: Command = {
	name: "setname",
	description: "Set your community's name",
	aliases: [],
	usage: "setname [name]",
	examples: ["setname AwF"],
	category: "config",
	requiresRoles: true,
	requiresApikey: true, // community is required, api key is given with community
	requiredPermissions: ["setConfig"],
	run: async ({ client, message, args, guildConfig }) => {
		if (!guildConfig.apiKey)
			return message.channel.send(
				`${client.emotes.warn} You must have an API key set for this command`,
			)
		const name = args.join(" ")
		if (!name)
			return message.channel.send(`${client.emotes.warn} No name provided`)
		const confirmation = await client.getConfirmationMessage(
			message,
			`Are you sure you want to set your community's name to ${name}?`,
			120000,
		)
		if (!confirmation)
			return message.channel.send(`${client.emotes.warn} Cancelled`)

		try {
			await client.fagc.communities.setCommunityConfig({
				config: {
					name: name,
				},
				reqConfig: {
					apikey: guildConfig.apiKey,
				},
			})
			return message.channel.send(
				`Community name set to ${name} successfully. Changes may take a few minutes to take effect`,
			)
		} catch (e) {
			if (e instanceof AuthError) {
				return message.channel.send(`${client.emotes.warn} Your API key is not recognized by FAGC`)
			}
			throw e
		}
	},
}
export default SetName
