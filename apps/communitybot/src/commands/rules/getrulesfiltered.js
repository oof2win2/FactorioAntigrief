const fetch = require("node-fetch")
const { apiurl, embedColors } = require("../../config.json")
const { MessageEmbed } = require("discord.js")
const globalConfig = require("../../utils/globalconfig")

module.exports = {
    config: {
        name: "getrulesfiltered",
        aliases: ["getfilteredrules"],
        usage: "",
        category: "rules",
        description: "Gets all rules",
        accessibility: "Member",
    },
    run: async (client, message, args) => {
        if (globalConfig.config.filteredRules === undefined)
            return message.reply("No rules filtered")
        const resRaw = await fetch(`${apiurl}/rules/getall`)
        const rules = await resRaw.json()

        let embed = new MessageEmbed()
            .setTitle("FAGC Rules")
            .setColor(embedColors.info)
            .setTimestamp()
            .setAuthor("FAGC Community")
            .setDescription("All FAGC Rules")

        let sent = 0
        rules.forEach((rule, i) => {
            if (sent == 25) {
                message.channel.send(embed)
                embed.fields = []
            }
            if (globalConfig.config.filteredRules.some(id => id === rule._id)) {
                embed.addField(`#${i + 1}/${rule._id}: ${rule.shortdesc}`, rule.longdesc)
                sent++
            }
        })
        message.channel.send(embed)
    },
}
