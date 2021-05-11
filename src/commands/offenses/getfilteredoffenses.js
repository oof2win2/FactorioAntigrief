const fetch = require("node-fetch")
const { MessageEmbed } = require("discord.js")
const ConfigModel = require("../../database/schemas/config")
const Command = require("../../base/Command")

class GetOffenses extends Command {
    constructor(client) {
        super(client, {
            name: "getfilteredoffenses",
            description: "Gets offenses of a player, filtered by trusted communities and rules",
            aliases: ["getoffenses"],
            usage: "[playername]",
            examples: ["{{p}}getfilteredoffenses Windsinger"],
            category: "offenses",
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
        if (!args[0]) return message.reply("Provide a player name to get offenses of")
        const playername = args.shift()
        const offensesRaw = await fetch(`${this.client.config.apiurl}/offenses/getall?playername=${playername}`)
        const offenses = await offensesRaw.json()
        if (offenses === null)
            return message.channel.send(`User \`${playername}\` has no offenses!`)

        const config = await ConfigModel.findOne({ guildid: message.guild.id })
        if (!config)
            return message.reply("No server config!")

        let embed = new MessageEmbed()
            .setTitle("FAGC Offenses")
            .setColor("GREEN")
            .setTimestamp()
            .setAuthor("FAGC Community")
            .setDescription(`FAGC Offense of player \`${playername}\``)
        const communities = await (await fetch(`${this.client.config.apiurl}/communities/getall`)).json()
        let i = 0
        offenses.forEach((offense) => {
            if (i == 25) {
                message.channel.send(embed)
                embed.fields = []
            }

            let community = communities.find(community => community.name == offense.communityname)
            if (config.trustedCommunities.includes(community._id)) {
                const violations = offense.violations.map((violation) => violation._id)
                embed.addField(offense._id, `Community name: ${offense.communityname}, Violation ID(s): ${violations.join(", ")}`)
                i++
            }
        })
        message.channel.send(embed)
    }
}

module.exports = GetOffenses