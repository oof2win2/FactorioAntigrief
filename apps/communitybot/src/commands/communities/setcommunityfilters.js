const fetch = require("node-fetch")
const { apiurl } = require("../../../config.json")
const { MessageEmbed } = require("discord.js")
const ConfigModel = require("../../database/schemas/config")
const ObjectId = require('mongoose').Types.ObjectId

module.exports = {
    config: {
        name: "setcommunityfilters",
        aliases: ["whitelistcommunities", "settrustedcommunities"],
        usage: "",
        category: "communities",
        description: "Sets community filters",
        accessibility: "Moderator",
    },
    run: async (client, message, args) => {
        const communitiesRaw = await fetch(`${apiurl}/communities/getall`)
        const communities = await communitiesRaw.json()

        let embed = new MessageEmbed()
            .setTitle("FAGC Communities")
            .setColor("GREEN")
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
        const onEnd = async () => {
            let config = await ConfigModel.findOne({ guildid: message.guild.id })
            const replaced = await ConfigModel.findOneAndUpdate({guildid: message.guild.id}, {
                $set: {"trustedCommunities": trustedCommunities}
            }, {new:true})
            let embed = new MessageEmbed()
                .setTitle("FAGC Communities")
                .setColor("GREEN")
                .setTimestamp()
                .setAuthor("FAGC Community")
                .setDescription("Trusted Communities")
            trustedCommunities.forEach((trustedCommunityID, i) => {
                if (i === 25) {
                    message.channel.send(embed)
                    embed.fields = []
                }
                communities.forEach((community) => {
                    if (community._id === trustedCommunityID)
                        embed.addField(`${community.name} | ${community._id}`, `Contact: ${community.contact}`)
                })
            })
            message.channel.send(embed)
        }

        let collector = await message.channel.createMessageCollector(messageFilter, { max: Object.keys(communities).length, time: 120000 })
        collector.on('collect', (message) => {
            if (message.content === "stop") collector.stop()
            else {
                if (ObjectId.isValid(message.content)) {
                    trustedCommunities.push(message.content)
                } else
                    message.channel.send("Message is not ObjectID. Content disregarded")
            }
        })
        collector.on('end', () => {
            message.channel.send("End of collection")
            onEnd()
        })
    },
}
