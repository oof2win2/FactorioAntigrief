const fetch = require("node-fetch")
const { apiurl } = require("../../../config.json")
const { MessageEmbed } = require("discord.js")
const ConfigModel = require("../../database/schemas/config")


module.exports = {
    config: {
        name: "getfilteredoffenses",
        aliases: ["getoffenses"],
        usage: "<playername>",
        category: "offenses",
        description: "Gets all offenses of a player from only trusted communities",
        accessibility: "Member",
    },
    run: async (client, message, args) => {
        if (!args[0]) return message.reply("Provide a player name to get offenses of")
        const playername = args.shift()
        const offensesRaw = await fetch(`${apiurl}/offenses/getall?playername=${playername}`)
        const offenses = await offensesRaw.json()
        if (offenses === null)
            return message.channel.send(`User \`${playername}\` has no offenses!`)

        const config = await ConfigModel.findOne({ guildid: message.guild.id })
        if (!config)
            return message.reply("No server config!")
        
        let embed = new MessageEmbed()
            .setTitle("FAGC Offenses")
            .setColor("GREEN")
            .setTimestamp()
            .setAuthor("FAGC Community")
            .setDescription(`FAGC Offense of player \`${playername}\``)
        const communities = await (await fetch(`${apiurl}/communities/getall`)).json()
        let i = 0
        offenses.forEach((offense) => {
            if (i == 25) {
                message.channel.send(embed)
                embed.fields = []
            }
            communities.forEach((community) => {
                if (config.trustedCommunities.find(communityID => community._id != communityID)) return // if the community is not trusted, go to the next one from the API
                if (community.name != offense.communityname) return // if the name of the community is not the name of the community in the offense, then go to the next community
                const violations = offense.violations.map((violation) => violation._id)
                embed.addField(offense._id, `Community name: ${offense.communityname}, Violation ID(s): ${violations.join(", ")}`)
                i++
            })
        })
        message.channel.send(embed)
    },
};
