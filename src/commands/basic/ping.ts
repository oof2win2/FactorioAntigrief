import { Command } from "../../base/Command";

const Ping: Command = {
	name: "ping",
	description: "Shows ping to related services",
	usage: "ping",
	aliases: [],
	examples: [],
	category: "basic",
	requiresRoles: true,
	requiredPermissions: ["reports"],
	run: async ({message, client}) => {
		const msg = await message.channel.send("Pinging...")
		const ping = msg.createdTimestamp - message.createdTimestamp

		return msg.edit(`My ping: ${ping}ms\nDiscord API ping: ${client.ws.ping}ms`)
	}
}

export default Ping