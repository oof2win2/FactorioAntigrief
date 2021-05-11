const fetch = require("node-fetch")
const { MessageEmbed } = require("discord.js")
const ConfigModel = require("../../database/schemas/config")
const Command = require("../../base/Command")

class GetRulesFiltered extends Command {
    constructor(client) {
        super(client, {
            name: "getrulesfiltered",
            description: "Gets rules that this community follows",
            aliases: ["getfilteredrules", "getrules"],
            category: "rules",
            dirname: __dirname,
            enabled: true,
            memberPermissions: [],
            botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
            ownerOnly: false,
            cooldown: 3000,
            requiredConfig: true,
        })
    }
    async run(message) {
        const config = await ConfigModel.findOne({ guildid: message.guild.id })
        if (config.ruleFilters === undefined)
            return message.reply("No rules filtered")
        const resRaw = await fetch(`${this.client.config.apiurl}/rules/getall`)
        const rules = await resRaw.json()

        let embed = new MessageEmbed()
            .setTitle("FAGC Rules")
            .setColor("GREEN")
            .setTimestamp()
            .setAuthor("FAGC Community")
            .setDescription("Filtered FAGC Rules")

        let sent = 0
        rules.forEach((rule, i) => {
            if (sent == 25) {
                message.channel.send(embed)
                embed.fields = []
            }
            if (config.ruleFilters.some(id => id === rule._id)) {
                embed.addField(`#${i + 1}/${rule._id}: ${rule.shortdesc}`, rule.longdesc)
                sent++
            }
        })
        message.channel.send(embed)
    }
}
module.exports = GetRulesFiltered