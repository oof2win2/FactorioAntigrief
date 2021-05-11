const fetch = require("node-fetch")
const { MessageEmbed } = require("discord.js")
const ConfigModel = require("../../database/schemas/config")
const Command = require("../../base/Command")

class GetViolations extends Command {
    constructor(client) {
        super(client, {
            name: "getfilteredviolations",
            description: "Gets violations of a player from only trusted communities and rules",
            aliases: ["check", "getviolations"],
            category: "violations",
            usage: "[playername]",
            examples: ["{{p}}getfilteredviolations Windsinger"],
            dirname: __dirname,
            enabled: true,
            guildOnly: true,
            memberPermissions: [],
            botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
            ownerOnly: false,
            cooldown: 3000,
            requiredConfig: true
        })
    }
    async run(message, args) {
        if (!args[0]) return message.reply("Provide a player name to get violations of")
        const config = await ConfigModel.findOne({ guildid: message.guild.id })
        if (config.trustedCommunities === undefined) return message.reply("No filtered communities set")
        const violationsRaw = await fetch(`${this.client.config.apiurl}/violations/getall?playername=${args[0]}`)
        const violations = await violationsRaw.json()
        const communities = await (await fetch(`${this.client.config.apiurl}/communities/getall`)).json()

        let embed = new MessageEmbed()
            .setTitle("FAGC Violations")
            .setColor("GREEN")
            .setTimestamp()
            .setAuthor("FAGC Community")
            .setDescription(`FAGC Violations of player \`${args[0]}\``)

        const trustedCommunities = communities.filter((community) => {
            if (config.trustedCommunities.some((trustedID) => { return trustedID === community._id })) return community
        })
        let i = 0;
        violations.forEach((violation) => {
            if (i == 25) {
                message.channel.send(embed)
                embed.fields = []
            }
            if (trustedCommunities.some((community) => community.name === violation.communityname)) {
                embed.addField(violation._id,
                    `By: ${violation.admin_name}\nCommunity name: ${violation.communityname}\n` +
                    `Broken rule: ${violation.broken_rule}\nProof: ${violation.proof}\n` +
                    `Description: ${violation.description}\nAutomated: ${violation.automated}` +
                    `Violated time: ${(new Date(violation.violated_time)).toUTCString()}`,
                    true
                )
                i++
            }
        })
        message.channel.send(embed)
    }
}
module.exports = GetViolations