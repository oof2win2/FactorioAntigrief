const Command = require("../../base/Command")

class BanPlayer extends Command {
	constructor(client) {
		super(client, {
			name: "ban",
			description: "Set role permissions for command access",
			aliases: ["setroleperms", "setperms"],
			category: "basic",
			usage: "[username] (reason)",
			examples: ["{{p}}ban Cooldude2606 hackerman"],
			dirname: __dirname,
			enabled: true,
			memberPermissions: ["BAN_MEMBERS"],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			ownerOnly: false,
			cooldown: 3000,
			requiredConfig: false,
			customPermissions: ["BAN"],
		})
	}
	async run(message, args) {
		if (!args[0]) return message.channel.send("Please provide a user to ban")
		const user = args.shift()
		const reason = args.join(" ") || "No reason provided"
		
		const confirm = await message.channel.send(`\`${user}\` will be banned for \`${reason}\``)
		confirm.react("✅")
		confirm.react("❌")
		const reactionFilter = (reaction, user) => user.id == message.author.id
		let reactions
		try {
			reactions = await confirm.awaitReactions(reactionFilter, { max: 1, time: 120000, errors: ["time"] })
		} catch (error) {
			return message.channel.send("Timed out.")
		}
		let reaction = reactions.first()
		if (reaction.emoji.name === "❌")
			return message.channel.send("Banning cancelled")

		try {
			// set to database
			const ban = await this.client.prisma.privateBans.create({data: {
				admin: message.author.id,
				playername: user,
				reason: reason
			}})
			if (ban.id) return message.channel.send(`\`${user}\` has been banned for \`${reason}\``)
			message.channel.send("An error has occured whilst banning. Please check logs")
			console.error({ban})
		} catch (error) {
			console.error({ error })
			return message.channel.send("Error banning. Please check logs.")
		}

	}
}
module.exports = BanPlayer