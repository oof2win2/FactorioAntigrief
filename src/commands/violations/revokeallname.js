const fetch = require("node-fetch")
const { MessageEmbed } = require("discord.js")
const ConfigModel = require("../../database/schemas/config")
const { handleErrors } = require("../../utils/functions")

module.exports = {
    config: {
        name: "revokeallname",
        aliases: ["revokeoffense"],
        usage: "<playername>",
        category: "violations",
        description: "Revokes all violations of a player by ID",
        accessibility: "Moderator",
    },
    run: async (client, message, args) => {
        if (!args[0]) return message.reply("Provide a player name to get violations of")
        const playername = args.shift()

        const config = await ConfigModel.findOne({guildid: message.guild.id })
        if (config === null) return message.reply("Community invalid")
        if (!config.apikey) return message.reply("No API key set")

        const offenseRaw = await fetch(`${client.config.apiurl}/offenses/getcommunity?playername=${playername}&communityname=${ownCommunity.name}`)
        const offense = await offenseRaw.json()
        if (offense === null)
            return message.reply(`Player \`${playername}\` has no offenses in community ${config.communityname}`)
        
        let embed = new MessageEmbed()
            .setTitle("FAGC Offense Revocation")
            .setColor("GREEN")
            .setTimestamp()
            .setAuthor("FAGC Community")
            .setDescription(`FAGC Offense of player \`${playername}\` in community ${ownCommunity.name}`)
        
        offense.violations.forEach((violation, i) => {
            if (i == 25) {
                message.channel.send(embed)
                embed.fields = []
            }
            embed.addField(violation._id,
                `By: ${violation.admin_name}\nBroken rule: ${violation.broken_rule}\n` +
                `Proof: ${violation.proof}\nDescription: ${violation.description}\n` +
                `Automated: ${violation.automated}\nViolated time: ${(new Date(violation.violated_time)).toUTCString()}`,
                inline = true
            )
        })
        message.channel.send(embed)

        const reactionFilter = (reaction, user) => {
            return user.id == message.author.id
        }
        const confirm = await message.channel.send("Are you sure you want to revoke this player's offense?")
        confirm.react("✅")
        confirm.react("❌")
        let reactions
        try {
            reactions = (await confirm.awaitReactions(reactionFilter, { max: 1, time: 120000, errors: ['time'] }))
        } catch (error) {
            return message.channel.send("Timed out.")
        }

        let reaction = reactions.first()
        if (reaction.emoji.name === "❌")
            return message.channel.send("Offense revocation cancelled")
        
        try {
            const responseRaw = await fetch(`${client.config.apiurl}/violations/revokeallname`, {
                method: "DELETE",
                body: JSON.stringify({
                    playername: playername,
                    admin_name: message.author.tag
                }),
                headers: { 'apikey': config.apikey, 'content-type': 'application/json' }
            })
            const response = await responseRaw.json()
            
            if (response._id && response.violations && response.playername && response.communityname) {
                return message.channel.send(`Offense revoked!`)
            } else {
                return handleErrors(message, response)
            }
        } catch (error) {
            console.error({ error })
            return message.channel.send("Error removing offense. Please check logs.")
        }
    },
};
