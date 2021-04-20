const fetch = require("node-fetch")
const { apiurl } = require("../../../config.json")
const { MessageEmbed } = require("discord.js")

module.exports = {
    config: {
        name: "getallcommunities",
        aliases: ["getcommunities"],
        usage: "",
        category: "communities",
        description: "Gets all communities",
        accessibility: "Member",
    },
    run: async (client, message, args) => {
        const rawCommunities = await fetch(`${apiurl}/communities/getall`)
        const communities = await rawCommunities.json()

        let communitiesEmbed = new MessageEmbed()
            .setTitle("FAGC Communities")
            .setColor("GREEN")
            .setTimestamp()
            .setAuthor("FAGC Community")
            .setDescription("All FAGC Communities")
        communities.forEach((community, i) => {
            if (i == 25) {
                message.channel.send(embed)
                embed.fields = []
            }
            communitiesEmbed.addField(`${community.name} | ${community._id}`, `Contact: ${community.contact}`)
        })
        message.channel.send(communitiesEmbed)
    },
};
