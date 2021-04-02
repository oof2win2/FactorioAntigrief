const fetch = require("node-fetch")
const { apiurl } = require("../../config.json")
const { MessageEmbed } = require("discord.js")
const ConfigModel = require("../../database/schemas/config")

module.exports = {
    config: {
        name: "getfilteredviolations",
        aliases: ["check"],
        usage: "<playername>",
        category: "violations",
        description: "Gets violations of a player from trusted communities",
        accessibility: "Member",
    },
    run: async (client, message, args) => {
        if (!args[0]) return message.reply("Provide a player name to get violations of")
        const config = await ConfigModel.findOne({guildid: message.guild.id})
        if (config.trustedCommunities === undefined) return message.reply("No filtered communities set")
        const violationsRaw = await fetch(`${apiurl}/violations/getall?playername=${args[0]}`)
        const violations = await violationsRaw.json()
        const communities = await (await fetch(`${apiurl}/communities/getall`)).json()

        let embed = new MessageEmbed()
            .setTitle("FAGC Violations")
            .setColor("GREEN")
            .setTimestamp()
            .setAuthor("FAGC Community")
            .setDescription(`FAGC Violations of player \`${args[0]}\``)

        const trustedCommunities = communities.filter((community) => {
            if (config.trustedCommunities.some((trustedID) => {return trustedID === community._id})) return community
        })
        violations.forEach((violation, i) => {
            if (i == 25) {
                message.channel.send(embed)
                embed.fields = []
            }
            if (trustedCommunities.some((community) => {return community.name === violation.communityname})) {
                embed.addField(violation._id,
                    `By: ${violation.adminname}\nCommunity name: ${violation.communityname}\n` +
                    `Broken rule: ${violation.brokenRule}\nProof: ${violation.proof}\n` +
                    `Description: ${violation.description}\nAutomated: ${violation.automated}\nViolated time: ${(new Date(violation.violatedTime)).toUTCString()}`,
                    inline = true
                )
            }
        })
        message.channel.send(embed)
    },
};
