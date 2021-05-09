const fetch = require("node-fetch")
const { MessageEmbed } = require("discord.js")
const ConfigModel = require("../../database/schemas/config")

module.exports = {
    config: {
        name: "setrulefilters",
        aliases: [],
        usage: "",
        category: "rules",
        description: "Sets rule filters",
        accessibility: "Administrator",
    },
    run: async (client, message, args) => {
        const resRaw = await fetch(`${client.config.apiurl}/rules/getall`)
        const rules = await resRaw.json()

        let embed = new MessageEmbed()
            .setTitle("FAGC Rules")
            .setColor("GREEN")
            .setTimestamp()
            .setAuthor("FAGC Community")
            .setDescription("Set Filtered Rules")

        rules.forEach((rule, i) => {
            if (i == 25) {
                message.channel.send(embed)
                embed.fields = []
            }
            embed.addField(`#${i + 1}/${rule._id}: ${rule.shortdesc}`, rule.longdesc)
        })
        message.channel.send(embed)

        
        const messageFilter = response => {
            return response.author.id === message.author.id
        }
        message.channel.send("Please type in ObjectIDs of rules you wish to use. Type `stop` to stop")

        let ruleFilters = []
        const onEnd = async () => {
            const config = await ConfigModel.findOneAndUpdate({guildid: message.guild.id}, {
                $set: { "ruleFilters": ruleFilters}
            }, {new: true})
            let ruleEmbed = new MessageEmbed()
                .setTitle("FAGC Rules")
                .setColor("GREEN")
                .setTimestamp()
                .setAuthor("FAGC Community")
                .setDescription("Filtered Rules")
            config.ruleFilters.forEach((filteredRuleID, i) => {
                if (i === 25) {
                    message.channel.send(ruleEmbed)
                    embed.fields = []
                }
                let rule = rules.find(rule => rule._id === filteredRuleID)
                ruleEmbed.addField(rule.shortdesc, rule.longdesc)
            })
            message.channel.send(ruleEmbed)
        }
        
        let collector = await message.channel.createMessageCollector(messageFilter, { max: Object.keys(rules).length, time: 120000 })
        collector.on('collect', (message) => {
            if (message.content === "stop") collector.stop()
            else ruleFilters.push(message.content)
        })
        collector.on('end', () => {
            message.channel.send("End of collection")
            onEnd()
        })
    },
}
