const { MessageEmbed } = require("discord.js")
const fetch = require("node-fetch")
const Command = require("../../base/Command")

class XKCD extends Command {
	constructor(client) {
		super(client, {
			name: "xkcd",
			description: "xkcd comics, get the latest or certain comic",
			aliases: [],
			usage: "(Comic ID)",
			examples: ["{{p}}xkcd", "{{p}}xkcd search 2286"],
			category: "basic",
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
		let search =
			args[0] && args[1]
				? `http://xkcd.com/${args[1]}/info.0.json`
				: "http://xkcd.com/info.0.json"
		try {
			fetch(search)
				.then((res) => res.json())
				.then((res) => {
					if (!res)
						return message.channel.send(
							"No results found for this comic, sorry!"
						)
					let { safe_title, img, day, month, year, num, alt } = res

					let embed = new MessageEmbed()
						.setColor("GREEN")
						.setDescription(
							alt ? alt : "*crickets* - No Description"
						)
						.setAuthor(`XKCD | ${safe_title} [${num}]`)
						.setImage(img)
						.setFooter(`Published ${day}/${month}/${year}`)

					message.channel.send(embed)
				})
		} catch (e) {
			console.error(e)
			return message.channel.send("looks like ive broken! Try again.")
		}
	}
}
module.exports = XKCD
