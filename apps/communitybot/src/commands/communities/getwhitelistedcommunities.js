const fetch = require("node-fetch")
const { apiurl, embedColors } = require("../../config.json")
const { apitoken } = require("../../botconfig.json")
const { MessageEmbed } = require("discord.js");
const globalConfig = require("../../utils/globalconfig");


module.exports = {
    config: {
        name: "gettrustedcommunities",
        aliases: ["getwhitelistedcommunities"],
        usage: "",
        category: "communities",
        description: "Gets trusted communities",
    },
    run: async (client, message, args) => {
        const rawCommunities = await fetch(`${apiurl}/communities/getall`)
        const communities = await rawCommunities.json()

        let communitiesEmbed = new MessageEmbed()
            .setTitle("FAGC Communities")
            .setColor(embedColors.info)
            .setTimestamp()
            .setAuthor("FAGC Community")
            .setDescription("Trusted FAGC Communities")

        let sent = 0
        communities.forEach((community) => {
            if (sent == 25) {
                message.channel.send(communitiesEmbed)
                communitiesEmbed.fields = []
            }
            if (globalConfig.config.trustedCommunities.some(id => id === community._id)) {
                communitiesEmbed.addField(`${community.name} | ${community._id}`, `Contact: ${community.contact}`)
                sent++
            }
        })
        message.channel.send(communitiesEmbed)
    },
};
