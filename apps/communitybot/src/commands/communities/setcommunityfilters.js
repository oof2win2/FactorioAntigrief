const { MessageEmbed } = require("discord.js")
const Command = require("../../base/Command")
const { createPagedEmbed } = require("../../utils/functions")
const { getConfirmationMessage } = require("../../utils/responseGetter")
const ConfigModel = require("../../database/schemas/config")

class SetFilters extends Command {
	constructor(client) {
		super(client, {
			name: "settrustedcommunities",
			description:
				"Sets trusted communities. [Explanation](https://gist.github.com/oof2win2/370050d3aa1f37947a374287a5e011c4#file-trusted-md)",
			aliases: [
				"setwhitelistcommunities",
				"setcommunityfilters",
				"settrusted",
			],
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
		const communities = await this.client.fagc.communities.fetchAll()

		let embed = new MessageEmbed()
			.setTitle("FAGC Communities")
			.setColor("GREEN")
			.setTimestamp()
			.setAuthor("FAGC Community")
			.setDescription(
				"Set Trusted Communities [Explanation](https://gist.github.com/oof2win2/370050d3aa1f37947a374287a5e011c4#file-trusted-md)"
			)

		const fields = await Promise.all(
			communities.map(async (community) => {
				const user = await this.client.users.fetch(community.contact)
				return {
					name: `${community.name} | \`${community.id}\``,
					value: `Contact: <@${user.id}> | ${user.tag}`,
				}
			})
		)
		createPagedEmbed(fields, embed, message, { maxPageCount: 5 })

		const messageFilter = (response) => {
			return response.author.id === message.author.id
		}
		message.channel.send(
			"Please type in IDs of communities you wish to trust. Type `stop` to stop. Will time out in 120s"
		)

		let trustedCommunities = []
		const onEnd = async () => {
			let embed = new MessageEmbed()
				.setTitle("FAGC Communities")
				.setColor("GREEN")
				.setTimestamp()
				.setAuthor("FAGC Community")
				.setDescription("Trusted Communities")
			const fields = await Promise.all(
				trustedCommunities.map(async (trustedCommunityID) => {
					let community = communities.find(
						(community) => community.id === trustedCommunityID
					)
					const user = await this.client.users.fetch(
						community.contact
					)
					return {
						name: `${community.name} | \`${community.id}\``,
						value: `Contact: <@${user.id}> | ${user.tag}`,
					}
				})
			)
			createPagedEmbed(fields, embed, message, { maxPageCount: 5 })
			const confirm = await getConfirmationMessage(
				message,
				"Are you sure you want to set your community filters to this?"
			)
			if (!confirm)
				return message.channel.send(
					"Setting of trusted communities has been cancelled"
				)

			if (config.apikey) {
				const request = await this.client.fagc.communities.setConfig(
					{ trustedCommunities },
					{ apikey: config.apikey }
				)
				if (request.guildId)
					return message.channel.send(
						"Trusted communities have successfully been set"
					)

				message.channel.send(
					"An error has occured. Please try again in some time"
				)
				throw request
			} else {
				const request = await ConfigModel.findOneAndUpdate(
					{ guildId: message.guild.id },
					{ trustedCommunities: trustedCommunities },
					{ new: true }
				)

				if (request.guildId === message.guild.id)
					return message.channel.send(
						"Rules have successfully been set"
					)
				throw request
			}
		}

		let collector = await message.channel.createMessageCollector(
			messageFilter,
			{ max: Object.keys(communities).length, time: 120000 }
		)
		collector.on("collect", (message) => {
			if (message.content === "stop") return collector.stop()
			trustedCommunities.push(message.content)
		})
		collector.on("end", () => {
			message.channel.send("End of collection")
			onEnd()
		})
	}
}
module.exports = SetFilters
