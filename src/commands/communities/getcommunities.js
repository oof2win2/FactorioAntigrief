const fetch = require("node-fetch")
const { apiurl, embedColors } = require("../../config.json")
const { apitoken } = require("../../botconfig.json")
const { MessageEmbed } = require("discord.js")

module.exports = {
    config: {
        name: "getcommunities",
        aliases: [],
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
            .setColor(embedColors.info)
            .setTimestamp()
            .setAuthor("FAGC Community")
            .setDescription("All FAGC Communities")
        communities.forEach((community) => {
            communitiesEmbed.addField(`${community.name} | ${community._id}`, `Contact: ${community.contact}`)
        })
        message.channel.send(communitiesEmbed)
    },
};
