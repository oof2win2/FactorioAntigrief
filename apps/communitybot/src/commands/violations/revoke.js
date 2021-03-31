const fetch = require("node-fetch")
const { apiurl, embedColors } = require("../../config.json")
const { apitoken } = require("../../botconfig.json")
const { MessageEmbed } = require("discord.js")

module.exports = {
    config: {
        name: "revoke",
        aliases: ["revokeid"],
        usage: "<playername> <offenseid>",
        category: "violations",
        description: "Revokes a player's violation with the violation ID",
        accessibility: "Moderator",
    },
    run: async (client, message, args) => {
        if (!args[0]) return message.reply("Provide a player name to get violations of")
        if (!args[1]) return message.reply("Provide a ObjectID for the violation to revoke")
        const playername = args.shift()
        const violationID = args.shift()
        const ownCommunity = await (await fetch(`${apiurl}/communities/getown`, {
            headers: { 'apikey': apitoken, 'content-type': 'application/json' }
        })).json()
        const violationRaw = await fetch(`${apiurl}/violations/getbyid?id=${violationID}`)
        const violation = await violationRaw.json()
        if (violation === null)
            return message.channel.send(`Violation with ID \`${violationID}\` doesn't exist`)
        if (violation.error && violation.description.startsWith('id expected ObjectID'))
            return message.reply(`\`${violationID}\` is not a proper Mongo ObjectID`)
        let embed = new MessageEmbed()
            .setTitle("FAGC Violation Revocation")
            .setColor(embedColors.info)
            .setTimestamp()
            .setAuthor("FAGC Community")
            .setDescription(`FAGC Violation \`${violation._id}\` of player \`${playername}\` in community ${ownCommunity.name}`)
        embed.addFields(
            { name: "Admin name", value: violation.adminname },
            { name: "Broken rule ID", value: violation.brokenRule },
            { name: "Proof", value: violation.proof },
            { name: "Description", value: violation.description },
            { name: "Automated", value: violation.automated },
            { name: "Violated time", value: Date(violation.violatedTime) }
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
            console.log(error)
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
                    adminname: message.author.tag
                }),
                headers: { 'apikey': apitoken, 'content-type': 'application/json' }
            })
            const response = await responseRaw.json()
            if (response._id && response.revokedBy && response.revokedTime) {
                return message.channel.send(`Violation revoked!`)
            } else {
                console.error({ response })
                return message.channel.send("Error revoking violation. Please check logs.")
            }
        } catch (error) {
            console.error({ error })
            return message.channel.send("Error revoking violation. Please check logs.")
        }
    },
};
