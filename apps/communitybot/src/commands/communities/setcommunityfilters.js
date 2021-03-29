const fetch = require("node-fetch")
const { apiurl, embedColors } = require("../../config.json")
const { MessageEmbed } = require("discord.js")
const globalConfig = require("../../utils/globalconfig")

module.exports = {
    config: {
        name: "setcommunityfilters",
        aliases: ["whitelistcommunities", "settrustedcommunities"],
        usage: "",
        category: "communities",
        description: "Sets community filters",
    },
    run: async (client, message, args) => {
        const communitiesRaw = await fetch(`${apiurl}/communities/getall`)
        const communities = await communitiesRaw.json()

        let embed = new MessageEmbed()
            .setTitle("FAGC Communities")
            .setColor(embedColors.info)
            .setTimestamp()
            .setAuthor("FAGC Community")
            .setDescription("Set Community Filters")

        communities.forEach((community, i) => {
            if (i == 25) {
                message.channel.send(embed)
                embed.fields = []
            }
            embed.addField(`${community.name} | ${community._id}`, `Contact: ${community.contact}`)
        })
        message.channel.send(embed)
        

        const messageFilter = response => {
            return response.author.id === message.author.id
        }
        message.channel.send("Please type in ObjectIDs of communities you wish to trust. Type `stop` to stop")

        let trustedCommunities = []
        const onEnd = () => {
            globalConfig.config.trustedCommunities = trustedCommunities
            globalConfig.saveGlobalConfig()
            let ruleEmbed = new MessageEmbed()
                .setTitle("FAGC Communities")
                .setColor(embedColors.info)
                .setTimestamp()
                .setAuthor("FAGC Community")
                .setDescription("Trusted Communities")
            trustedCommunities.forEach((trustedCommunityID, i) => {
                if (i === 25) {
                    message.channel.send(ruleEmbed)
                    embed.fields = []
                }
                communities.forEach((community) => {
                    if (community._id === trustedCommunityID)
                        ruleEmbed.addField(`${community.name} | ${community._id}`, `Contact: ${community.contact}`)
                })
            })
            message.channel.send(ruleEmbed)
        }

        let collector = await message.channel.createMessageCollector(messageFilter, { max: Object.keys(communities).length, time: 120000 })
        collector.on('collect', (message) => {
            if (message.content === "stop") collector.stop()
            else trustedCommunities.push(message.content)
        })
        collector.on('end', () => {
            message.channel.send("End of collection")
            onEnd()
        })
    },
}
