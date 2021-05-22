const fetch = require("node-fetch")
const { MessageEmbed } = require("discord.js")
const ConfigModel = require("../../database/schemas/config")
const Command = require("../../base/Command")

class SetFilters extends Command {
	constructor(client) {
		super(client, {
			name: "settrustedcommunities",
			description: "Sets trusted communities",
			aliases: ["setwhitelistcommunities", "setcommunityfilters", "settrusted"],
			category: "communities",
			dirname: __dirname,
			enabled: true,
			memberPermissions: ["ADMINISTRATOR"],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			ownerOnly: false,
			cooldown: 3000,
			requiredConfig: true,
			customPermissions: ["setCommunities"],
		})
	}
	async run(message) {
		const communitiesRaw = await fetch(`${this.client.config.apiurl}/communities/getall`)
		const communities = await communitiesRaw.json()

		let embed = new MessageEmbed()
			.setTitle("FAGC Communities")
			.setColor("GREEN")
			.setTimestamp()
			.setAuthor("FAGC Community")
			.setDescription("Set Trusted Communities")

		await Promise.all(communities.map(async (community, i) => {
			if (i == 25) {
				message.channel.send(embed)
				embed.fields = []
			}
			
			const user = await this.client.users.fetch(community.contact)
			embed.addField(`${community.name} | ${community.readableid}`, `Contact: <@${user.id}> | ${user.tag}`)
		}))
		message.channel.send(embed)


		const messageFilter = response => {
			return response.author.id === message.author.id
		}
		message.channel.send("Please type in IDs of communities you wish to trust. Type `stop` to stop. Will time out in 120s")

		let trustedCommunities = []
		const onEnd = async () => {
			await ConfigModel.findOneAndUpdate({ guildid: message.guild.id }, {
				$set: { "trustedCommunities": trustedCommunities }
			}, { new: true }).then(() => { })
			let embed = new MessageEmbed()
				.setTitle("FAGC Communities")
				.setColor("GREEN")
				.setTimestamp()
				.setAuthor("FAGC Community")
				.setDescription("Trusted Communities")
			await Promise.all(trustedCommunities.map(async (trustedCommunityID, i) => {
				if (i === 25) {
					message.channel.send(embed)
					embed.fields = []
				}
				let community = communities.find((community) => community.readableid === trustedCommunityID)
				const user = await this.client.users.fetch(community.contact)
				embed.addField(`${community.name} | ${community.readableid}`, `Contact: <@${user.id}> | ${user.tag}`)
			}))
			message.channel.send(embed)
		}

		let collector = await message.channel.createMessageCollector(messageFilter, { max: Object.keys(communities).length, time: 120000 })
		collector.on("collect", (message) => {
			if (message.content === "stop") collector.stop()
			trustedCommunities.push(message.content)
		})
		collector.on("end", () => {
			message.channel.send("End of collection")
			onEnd()
		})
	}
}
module.exports = SetFilters