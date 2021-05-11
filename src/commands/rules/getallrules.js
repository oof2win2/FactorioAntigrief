const fetch = require("node-fetch")
const { MessageEmbed } = require("discord.js")
const Command = require("../../base/Command")

class GetAllRules extends Command {
    constructor(client) {
        super(client, {
            name: "getallrules",
            description: "Gets all rules",
            aliases: [],
            category: "rules",
            dirname: __dirname,
            enabled: true,
            guildOnly: true,
            memberPermissions: [],
            botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
            ownerOnly: false,
            cooldown: 3000,
            requiredConfig: true,
        })
    }
    async run(message, args) {
        const resRaw = await fetch(`${this.client.config.apiurl}/rules/getall`)
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
            embed.addField(`#${i + 1}/${rule._id}: ${rule.shortdesc}`, rule.longdesc)
        })
        message.channel.send(embed)
    }
}
module.exports = GetAllRules