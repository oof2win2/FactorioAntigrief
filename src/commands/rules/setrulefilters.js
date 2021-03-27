const fetch = require("node-fetch")
const { apiurl, embedColors } = require("../../config.json")
const { MessageEmbed } = require("discord.js")
const globalConfig = require("../../utils/globalconfig")

module.exports = {
    config: {
        name: "setrulefilters",
        aliases: [],
        usage: "",
        category: "rules",
        description: "Gets all rules",
    },
    run: async (client, message, args) => {
        const resRaw = await fetch(`${apiurl}/rules/getall`)
        const rules = await resRaw.json()

        let embed = new MessageEmbed()
            .setTitle("FAGC Rules")
            .setColor(embedColors.info)
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
        const onEnd = () => {
            globalConfig.config.filteredRules = ruleFilters
            console.log(globalConfig.config)
            globalConfig.saveGlobalConfig()
            let ruleEmbed = new MessageEmbed()
                .setTitle("FAGC Rules")
                .setColor(embedColors.info)
                .setTimestamp()
                .setAuthor("FAGC Community")
                .setDescription("Filtered Rules")
            ruleFilters.forEach((filteredRuleID, i) => {
                if (i === 25) {
                    message.channel.send(ruleEmbed)
                    embed.fields = []
                }
                rules.forEach((rule) => {
                    if (rule._id === filteredRuleID)
                        ruleEmbed.addField(rule.shortdesc, rule.longdesc)
                })
            })
            message.channel.send(ruleEmbed)
        }
        
        let collector = await message.channel.createMessageCollector(messageFilter, { maxProcessed: Object.keys(rules).length, time: 120000 })
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
