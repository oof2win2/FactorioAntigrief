const fetch = require("node-fetch")
const { MessageEmbed } = require("discord.js");

const Command = require("../../base/Command")

class GetAllOffenses extends Command {
    constructor(client) {
        super(client, {
            name: "getalloffenses",
            description: "Gets all offenses of a player",
            aliases: [],
            usage: "[playername]",
            examples: ["{{p}}getalloffenses Windsinger"],
            category: "offenses",
            dirname: __dirname,
            enabled: true,
            guildOnly: true,
            memberPermissions: [],
            botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
            ownerOnly: false,
            cooldown: 3000,
            requiredConfig: false,
        })
    }
    async run (message, args) {
        if (!args[0]) return message.reply("Provide a player name to get offenses of")
        const playername = args.shift()
        const offensesRaw = await fetch(`${this.client.config.apiurl}/offenses/getall?playername=${playername}`)
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

            const violations = offense.violations.map((violation) => { return violation._id })
            embed.addField(offense._id, `Community name: ${offense.communityname}, Violation ID(s): ${violations.join(", ")}`)
        })
        message.channel.send(embed)
    }
}
module.exports = GetAllOffenses