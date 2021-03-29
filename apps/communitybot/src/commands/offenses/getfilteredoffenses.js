const fetch = require("node-fetch")
const { apiurl, embedColors } = require("../../config.json")
const { MessageEmbed } = require("discord.js")
const globalConfig = require("../../utils/globalconfig")


module.exports = {
    config: {
        name: "getfilteredoffenses",
        aliases: [],
        usage: "<playername>",
        category: "offenses",
        description: "Gets all offenses of a player from only trusted communities",
    },
    run: async (client, message, args) => {
        if (!args[0]) return message.reply("Provide a player name to get violations of")
        const playername = args.shift()
        const offensesRaw = await fetch(`${apiurl}/offenses/getall?playername=${playername}`)
        const offenses = await offensesRaw.json()
        if (offenses === null)
            return message.channel.send(`User \`${playername}\` has no offenses!`)

        let embed = new MessageEmbed()
            .setTitle("FAGC Offenses")
            .setColor(embedColors.info)
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
                if (globalConfig.config.trustedCommunities.some(id => {
                        return community.name === offense.communityname && community._id === id
                    })) {
                    const violations = offense.violations.map((violation) => { return violation._id })
                    embed.addField(offense._id, `Community name: ${offense.communityname}, Violation ID(s): ${violations.join(", ")}`)
                    i++
                }
            })
        })
        message.channel.send(embed)
    },
};
