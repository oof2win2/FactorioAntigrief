const fetch = require("node-fetch")
const { apiurl } = require("../../../config.json")
const { MessageEmbed } = require("discord.js")

module.exports = {
    config: {
        name: "getallviolations",
        aliases: ["checkall"],
        usage: "<playername>",
        category: "violations",
        description: "Gets all violations of a player",
        accessibility: "Member",
    },
    run: async (client, message, args) => {
        if (!args[0]) return message.reply("Provide a player name to get violations of")
        const violationsRaw = await fetch(`${apiurl}/violations/getall?playername=${args[0]}`)
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
                embed.fields = []
            }
            embed.addField(violation._id, 
                `By: ${violation.adminname}\nCommunity name: ${violation.communityname}\n`+
                `Broken rule: ${violation.brokenRule}\nProof: ${violation.proof}\n`+
                `Description: ${violation.description}\nAutomated: ${violation.automated}\nViolated time: ${(new Date(violation.violatedTime)).toUTCString()}`,
                inline=true
            )
        })
        message.channel.send(embed)
    },
};
