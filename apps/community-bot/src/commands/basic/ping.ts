import { Command } from "../../base/Command"

const Ping: Command = {
	name: "ping",
	description: "Shows ping to related services",
	usage: "",
	aliases: [],
	examples: [],
	category: "basic",
	requiresRoles: false,
	requiresApikey: false,
	run: async ({ message, client }) => {
		const msg = await message.channel.send("Pinging...")
		const ping = msg.createdTimestamp - message.createdTimestamp

		return msg.edit(
			`My ping: ${ping}ms\nDiscord API ping: ${client.ws.ping}ms`
		)
	},
}

export default Ping
