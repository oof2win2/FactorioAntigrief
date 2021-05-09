const fetch = require("node-fetch")
const { MessageEmbed } = require("discord.js");


module.exports = {
    config: {
        name: "getalloffenses",
        aliases: [],
        usage: "<playername>",
        category: "offenses",
        description: "Gets all offenses of a player",
        accessibility: "Member",
    },
    run: async (client, message, args) => {
        if (!args[0]) return message.reply("Provide a player name to get offenses of")
        const playername = args.shift()
        const offensesRaw = await fetch(`${client.config.apiurl}/offenses/getall?playername=${playername}`)
        const offenses = await offensesRaw.json()
        if (offenses == null || offenses == [])
            return message.channel.send(`User \`${playername}\` has no offenses!`)
        let embed = new MessageEmbed()
            .setTitle("FAGC Offenses")
            .setColor("GREEN")
            .setTimestamp()
            .setAuthor("FAGC Community")
            .setDescription(`FAGC Offense of player \`${playername}\``)
        let i = 0
        offenses.forEach((offense, i) => {
            if (i == 25) {
                message.channel.send(embed)
                embed.fields = []
            }

            const violations = offense.violations.map((violation) => {return violation._id})
            embed.addField(offense._id,`Community name: ${offense.communityname}, Violation ID(s): ${violations.join(", ")}`)
        })
        message.channel.send(embed)
    },
};
