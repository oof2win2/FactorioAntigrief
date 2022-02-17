import { Command } from "../../base/Command"

const GetUserById: Command = {
	name: "getuserbyid",
	description: "Gets a Discord user by their ID",
	aliases: [ "getuser", "viewuserbyid", "viewuser" ],
	category: "basic",
	usage: "[user]",
	examples: [ "getuserbyid 429696038266208258" ],
	requiresRoles: false,
	requiresApikey: false,
	run: async ({ message, client, args }) => {
		const uid = args.shift()
		if (!uid) return message.reply("No user ID provided")
		try {
			const user = await client.users.fetch(uid)
			const embed = client.createBaseEmbed()
				.setImage(user.avatarURL() || "")
				.addFields([
					{ name: "User's ID", value: user.id, inline: true },
					{ name: "User's tag", value: user.tag, inline: true },
					{
						name: "User created at",
						value: `<t:${Math.round(user.createdAt.valueOf() / 1000)}>`,
						inline: true,
					},
				])
			message.reply({
				embeds: [ embed ],
			})
		} catch {
			return message.reply(`User with the ID ${uid} could not be found`)
		}
	},
}
export default GetUserById
