const fetch = require("node-fetch")
const { apiurl } = require("../../../config.json")
const { MessageEmbed } = require("discord.js")
const ConfigModel = require("../../database/schemas/config")
const { handleErrors } = require("../../utils/functions")

module.exports = {
    config: {
        name: "revoke",
        aliases: ["revokeid"],
        usage: "<offenseid>",
        category: "violations",
        description: "Revokes a player's violation with the violation ID",
        accessibility: "Moderator",
    },
    run: async (client, message, args) => {
        if (!args[0]) return message.reply("Provide a ObjectID for the violation to revoke")
        const violationID = args.shift()

        const config = await ConfigModel.findOne({guildid: message.guild.id})
        if (config.apikey === undefined)
            return message.reply("No API key set, operation not available!")
        
        const violationRaw = await fetch(`${apiurl}/violations/getbyid?id=${violationID}`)
        const violation = await violationRaw.json()
        if (violation === null)
            return message.channel.send(`Violation with ID \`${violationID}\` doesn't exist`)
        if (violation.error && violation.description.startsWith('id expected ObjectID'))
            return message.reply(`\`${violationID}\` is not a proper Mongo ObjectID`)
        
        let embed = new MessageEmbed()
            .setTitle("FAGC Violation Revocation")
            .setColor("GREEN")
            .setTimestamp()
            .setAuthor("FAGC Community")
            .setDescription(`FAGC Violation \`${violation._id}\` of player \`${violation.playername}\` in community ${config.communityname}`)
        embed.addFields(
            { name: "Admin name", value: violation.admin_name },
            { name: "Broken rule ID", value: violation.broken_rule },
            { name: "Proof", value: violation.proof },
            { name: "Description", value: violation.description },
            { name: "Automated", value: violation.automated },
            { name: "Violated time", value: Date(violation.violated_time) }
        )
        message.channel.send(embed)
        
        const reactionFilter = (reaction, user) => {
            return user.id == message.author.id
        }
        const confirm = await message.channel.send("Are you sure you want to revoke this violation?")
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
            return message.channel.send("Violation revocation cancelled")
        
        try {
            const responseRaw = await fetch(`${apiurl}/violations/revoke`, {
                method: "DELETE",
                body: JSON.stringify({
                    id: violationID,
                    admin_name: message.author.tag
                }),
                headers: { 'apikey': config.apikey, 'content-type': 'application/json' }
            })

            const response = await responseRaw.json()
            
            if (response._id && response.revokedBy && response.revokedTime) {
                return message.channel.send(`Violation revoked!`)
            } else {
                return handleErrors(message, response)
            }
        } catch (error) {
            console.error({ error })
            return message.channel.send("Error revoking violation. Please check logs.")
        }
    },
};
