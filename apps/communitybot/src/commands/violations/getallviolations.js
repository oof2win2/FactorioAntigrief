const fetch = require("node-fetch")
const { MessageEmbed } = require("discord.js")
const Command = require("../../base/Command")

class GetAllViolations extends Command {
    constructor(client) {
        super(client, {
            name: "getallviolations",
            description: "Gets all violations of a player",
            aliases: ["checkall"],
            category: "violations",
            usage: "[playername]",
            examples: ["{{p}}getallviolations Windsinger"],
            dirname: __dirname,
            enabled: true,
            guildOnly: true,
            memberPermissions: [],
            botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
            nsfw: false,
            ownerOnly: false,
            args: false,
            cooldown: 3000,
            requiredConfig: false
        })
    }
    async run (message, args) {
        if (!args[0]) return message.reply("Provide a player name to get violations of")
        const violationsRaw = await fetch(`${this.client.config.apiurl}/violations/getall?playername=${args[0]}`)
        const violations = await violationsRaw.json()

        let embed = new MessageEmbed()
            .setTitle("FAGC Violations")
            .setColor("ORANGE")
            .setTimestamp()
            .setAuthor("FAGC Community")
            .setDescription(`FAGC Violations of player \`${args[0]}\``)

        violations.forEach((violation, i) => {
            if (i == 25) {
                message.channel.send(embed)
                embed.fields = [];
            }
            embed.addField(violation._id,
                `By: ${violation.admin_name}\nCommunity name: ${violation.communityname}\n` +
                `Broken rule: ${violation.broken_rule}\nProof: ${violation.proof}\n` +
                `Description: ${violation.description}\nAutomated: ${violation.automated}\n` +
                `Violated time: ${(new Date(violation.violated_time)).toUTCString()}`,
                true
            )
        })
        message.channel.send(embed)
    }
}
module.exports = GetAllViolations
