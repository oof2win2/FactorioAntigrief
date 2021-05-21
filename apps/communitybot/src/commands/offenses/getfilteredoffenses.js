const fetch = require("node-fetch")
const { MessageEmbed, Collection } = require("discord.js")
const Command = require("../../base/Command")

class GetOffenses extends Command {
	constructor(client) {
		super(client, {
			name: "getfilteredoffenses",
			description: "Gets offenses of a player, filtered by trusted communities and rules",
			aliases: ["getoffenses"],
			usage: "[playername]",
			examples: ["{{p}}getfilteredoffenses Windsinger"],
			category: "offenses",
			dirname: __dirname,
			enabled: true,
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			ownerOnly: false,
			cooldown: 3000,
			requiredConfig: true,
		})
	}
	async run(message, args, config) {
		if (!args[0]) return message.reply("Provide a player name to get offenses of")
		if (!config.trustedCommunities || !config.trustedCommunities[0])
			return message.reply("Please set trusted communities first")

		const playername = args.shift()
		const offensesRaw = await fetch(`${this.client.config.apiurl}/offenses/getall?playername=${playername}`)
		const offenses = await offensesRaw.json()
		if (!offenses || !offenses[0])
			return message.channel.send(`User \`${playername}\` has no offenses that correspond to your filters!`)

		let embed = new MessageEmbed()
			.setTitle("FAGC Offenses")
			.setColor("GREEN")
			.setTimestamp()
			.setAuthor("FAGC Community")
			.setDescription(`FAGC Offense of player \`${playername}\``)
		const communities = await (await fetch(`${this.client.config.apiurl}/communities/getall`)).json()

		const CachedCommunities = new Collection()
		const getOrFetchCommunity = async (communityid) => {
			if (CachedCommunities.get(getOrFetchCommunity)) return CachedCommunities.get(getOrFetchCommunity)
			const community = await fetch(`${this.client.config.apiurl}/communities/getid?id=${communityid}`).then((c) => c.json())
			CachedCommunities.set(communityid, community)
			return community
		}

		let i = 0
		await Promise.all(offenses.map(async (offense) => {
			if (i && i % 25 == 0) {
				message.channel.send(embed)
				embed.fields = []
			}

			let checkedCommunity = communities.find(community => community.name == offense.communityname)
			if (checkedCommunity && config.trustedCommunities.includes(checkedCommunity.readableid)) {
				const violations = offense.violations.map((violation) => violation.readableid)
				const community = await getOrFetchCommunity(offense.communityid)
				embed.addField(`Community ${community.name} (\`${offense.communityid}\`): ${offense.readableid}`, `Violation ID(s): ${violations.join(", ")}`)
				i++
			}
		}))
		if (embed.fields[0])
			message.channel.send(embed)
		if (!i)
			message.channel.send("No offenses correspond to your filters")
	}
}

module.exports = GetOffenses