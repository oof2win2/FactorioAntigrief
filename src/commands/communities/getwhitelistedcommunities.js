const fetch = require("node-fetch")
const { apiurl } = require("../../../config.json")
const ConfigModel = require("../../database/schemas/config")
const { MessageEmbed } = require("discord.js");


module.exports = {
    config: {
        name: "getfilteredcommunities",
        aliases: ["getwhitelistedcommunities", "gettrustedcommunities", "getcommunities", "gettrusted"],
        usage: "",
        category: "communities",
        description: "Gets trusted communities",
        accessibility: "Member",
    },
    run: async (client, message, args) => {
        const rawCommunities = await fetch(`${apiurl}/communities/getall`)
        const communities = await rawCommunities.json()
        const config = await ConfigModel.findOne({guildid: message.guild.id})

        let communitiesEmbed = new MessageEmbed()
            .setTitle("FAGC Communities")
            .setColor("GREEN")
            .setTimestamp()
            .setAuthor("FAGC Community")
            .setDescription("Trusted FAGC Communities")

        let sent = 0
        communities.forEach((community) => {
            if (sent == 25) {
                message.channel.send(communitiesEmbed)
                communitiesEmbed.fields = []
            }
            if (config.trustedCommunities.some(id => id === community._id)) {
                communitiesEmbed.addField(`${community.name} | ${community._id}`, `Contact: ${community.contact}`)
                sent++
            }
        })
        message.channel.send(communitiesEmbed)
    },
};
