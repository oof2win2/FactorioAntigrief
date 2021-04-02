const fetch = require("node-fetch")
const { apiurl } = require("../../../config.json")
const { MessageEmbed } = require("discord.js")

module.exports = {
    config: {
        name: "getrules",
        aliases: [],
        usage: "",
        category: "rules",
        description: "Gets all rules",
        accessibility: "Member",
    },
    run: async (client, message, args) => {
        const resRaw = await fetch(`${apiurl}/rules/getall`)
        const rules = await resRaw.json()

        let embed = new MessageEmbed()
            .setTitle("FAGC Rules")
            .setColor("GREEN")
            .setTimestamp()
            .setAuthor("FAGC Community")
            .setDescription("All FAGC Rules")
        rules.forEach((rule, i) => {
            if (i == 25) {
                message.channel.send(embed)
                embed.fields = []
            }
            embed.addField(`#${i+1}/${rule._id}: ${rule.shortdesc}`, rule.longdesc)
        })
        message.channel.send(embed)
    },
};
