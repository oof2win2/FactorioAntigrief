import fetch from "node-fetch"
import Command from "../../base/Command"
import {Message, MessageEmbed} from "discord.js"

export const command: Command<Message | MessageEmbed> = {
	name: "xkcd",
	description: "xkcd comics, get the latest or certain comic",
	aliases: [],
	usage: "(Comic ID)",
	examples: ["{{p}}xkcd", "{{p}}xkcd search 2286"],
	dirname: __dirname,
	enabled: true,
	memberPermissions: [],
	botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
	ownerOnly: false,
	cooldown: 3000,
	requiredConfig: false,
	run: async (client, message, args) => {
		let search = args[0] && args[1]
			? `http://xkcd.com/${args[1]}/info.0.json`
			: "http://xkcd.com/info.0.json"
		const res = await fetch(search).then(r => r.json())

		if (!res)
			return message.channel.send("No results found for this comic, sorry!")

		let { safe_title, img, day, month, year, num, alt } = res

		let embed = new MessageEmbed()
			.setColor("GREEN")
			.setDescription(alt ? alt : "*crickets* - No Description")
			.setAuthor(`XKCD | ${safe_title} [${num}]`)
			.setImage(img)
			.setFooter(`Published ${day}/${month}/${year}`)

		message.channel.send(embed)
	}
}