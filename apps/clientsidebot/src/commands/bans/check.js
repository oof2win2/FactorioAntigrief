const Command = require("../../base/Command")

class IsBanned extends Command {
	constructor(client) {
		super(client, {
			name: "isbanned",
			description: "Check if a user is banned localy",
			aliases: ["check"],
			category: "bans",
			usage: "[username]",
			examples: ["{{p}}isbanned Cooldude2606"],
			dirname: __dirname,
			enabled: true,
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			ownerOnly: false,
			cooldown: 3000,
			requiredConfig: false,
		})
	}
	async run(message, args) {
		const player = args.shift()
		if (!player) return message.reply("No player provided!")
		const ban = await this.client.prisma.privateBans.findFirst({
			where: {playername: player}
		})
		if (ban) return message.channel.send(`Player \`${player}\` has been banned by ${await this.client.users.fetch(ban.admin).then(a => `\`${a.tag}\``)} for reason ${ban.reason} at ${ban.bannedAt}`)
		return message.channel.send(`Player \`${player}\` is not banned`)
	}
}
module.exports = IsBanned