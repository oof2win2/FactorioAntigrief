const fetch = require("node-fetch")
const { MessageEmbed } = require("discord.js")
const Command = require("../../base/Command")

class GetAll extends Command {
    constructor(client) {
        super(client, {
            name: "getallcommunities",
            description: "Gets all communities",
            aliases: [],
            usage: ["{{p}}getallcommunities"],
            category: "communities",
            dirname: __dirname,
            enabled: true,
            guildOnly: true,
            memberPermissions: [],
            botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
            nsfw: false,
            ownerOnly: false,
            args: false,
            cooldown: 3000,
            requiredConfig: false,
        })
    }
    async run(message) {
        const rawCommunities = await fetch(`${this.client.config.apiurl}/communities/getall`)
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
    }
}
module.exports = GetAll