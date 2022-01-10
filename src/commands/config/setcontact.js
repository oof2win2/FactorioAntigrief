const Command = require("../../base/Command")

class SetContact extends Command {
	constructor(client) {
		super(client, {
			name: "setcontact",
			description: "Set your community's contact",
			aliases: [],
			usage: [ "{{p}}setcontact [user]" ],
			examples: [
				"{{p}}setcontact oof2win2#3149",
				"{{p}}setcontact 429696038266208258",
			],
			category: "config",
			dirname: __dirname,
			enabled: true,
			memberPermissions: [ "ADMINISTRATOR" ],
			botPermissions: [ "SEND_MESSAGES", "EMBED_LINKS" ],
			ownerOnly: false,
			cooldown: 3000,
			requiredConfig: true,
			customPermissions: [ "setConfig" ],
		})
	}
	async run(message, args, config) {
		if (!config.apikey)
			return message.channel.send(
				`${this.client.emotes.warn} You must have an API key set for this command`
			)
		if (!args[0]) return message.channel.send(`${this.client.emotes.warn} No user provided`)
		const user =
			message.mentions.users.first() ||
			(await this.client.users.fetch(args[0]))
		if (!user) return message.channel.send(`${this.client.emotes.warn} Provided user is invalid`)

		await this.client.fagc.communities.setCommunityConfig({
			config: {
				contact: user.id
			},
			reqConfig: {
				apikey: config.apikey
			}
		})
		return message.channel.send(
			"Contact saved successfully. Changes may take a few minutes to take effect"
		)
	}
}
module.exports = SetContact
