const fetch = require("node-fetch")
const { MessageEmbed } = require("discord.js")
const Command = require("../../base/Command")
const { getConfirmationMessage } = require("../../utils/responseGetter")

class SetFilters extends Command {
	constructor(client) {
		super(client, {
			name: "settrustedcommunities",
			description: "Sets trusted communities. [Explanation](https://gist.github.com/oof2win2/370050d3aa1f37947a374287a5e011c4#file-trusted-md)",
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
	async run(message, _, config) {
		const communitiesRaw = await fetch(`${this.client.config.apiurl}/communities/getall`)
		const communities = await communitiesRaw.json()

		let embed = new MessageEmbed()
			.setTitle("FAGC Communities")
			.setColor("GREEN")
			.setTimestamp()
			.setAuthor("FAGC Community")
			.setDescription("Set Trusted Communities [Explanation](https://gist.github.com/oof2win2/370050d3aa1f37947a374287a5e011c4#file-trusted-md)")

		await Promise.all(communities.map(async (community, i) => {
			if (i == 25) {
				message.channel.send(embed)
				embed.fields = []
			}
			
			const user = await this.client.users.fetch(community.contact)
			embed.addField(`${community.name} | ${community.id}`, `Contact: <@${user.id}> | ${user.tag}`)
		}))
		message.channel.send(embed)


		const messageFilter = response => {
			return response.author.id === message.author.id
		}
		message.channel.send("Please type in IDs of communities you wish to trust. Type `stop` to stop. Will time out in 120s")

		let trustedCommunities = []
		const onEnd = async () => {
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
				let community = communities.find((community) => community.id === trustedCommunityID)
				const user = await this.client.users.fetch(community.contact)
				embed.addField(`${community.name} | ${community.id}`, `Contact: <@${user.id}> | ${user.tag}`)
			}))
			message.channel.send(embed)
			const confirm = await getConfirmationMessage(message, "Are you sure you want to set your community filters to this?")
			if (!confirm) return message.channel.send("Setting of trusted communities has been cancelled")

			const request = await fetch(`${this.client.config.apiurl}/communities/setconfig`, {
				method: "POST",
				body: JSON.stringify({
					trustedCommunities: trustedCommunities
				}),
				headers: { "apikey": config.apikey, "content-type": "application/json" }
			}).then(r => r.json())
			if (request.guildId) return message.channel.send("Trusted communities have successfully been set")

			message.channel.send("An error has occured. Please try again in some time")
			throw request
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