const fetch = require("node-fetch")
const ConfigModel = require("../../database/schemas/config")
const { MessageEmbed } = require("discord.js")
const { getMessageResponse } = require("../../utils/responseGetter")
const { handleErrors } = require("../../utils/functions")

module.exports = {
    config: {
        name: "createadvanced",
        aliases: [],
        usage: "",
        category: "violations",
        description: "Creates a violation for a player",
        accessibility: "Moderator",
    },
    run: async (client, message, args) => {
        if (!message.guild.member(message.author).hasPermission('BAN_MEMBERS')) return message.reply("Nice try! You need the `BAN_MEMBERS` permission!")

        const config = await ConfigModel.findOne({ guildid: message.guild.id })
        if (config === null) return message.reply("Community invalid")
        if (!config.apikey) return message.reply("No API key set")
        const messageFilter = response => {
            return response.author.id === message.author.id
        }
        const reactionFilter = (reaction, user) => {
            return user.id == message.author.id
        }

        const playername = (await getMessageResponse(message.channel.send("Please type in a playername for the violation"), messageFilter))?.content
        if (playername === undefined) return message.channel.send("Didn't send playername in time")

        const admin_name = (await getMessageResponse(message.channel.send("Please type in admin name for the violation"), messageFilter))?.content
        if (admin_name === undefined) return message.channel.send("Didn't send admin_name in time")

        const ruleid = (await getMessageResponse(message.channel.send("Please type in ObjectID of rule that has been broken"), messageFilter))?.content
        if (ruleid === undefined) return message.channel.send("Didn't send rule ObjectID in time")

        let desc = (await getMessageResponse(message.channel.send("Please type in description of the violation or `none` if you don't want to set one"), messageFilter))?.content
        if (desc.toLowerCase() === 'none') desc = undefined

        let proof = (await getMessageResponse(message.channel.send("Please send a link to proof of the violation or `none` if there is no proof"), messageFilter))?.content
        if (proof.toLowerCase() === 'none') proof = undefined

        let timestamp = (await getMessageResponse(message.channel.send("Please send a value representing the date of the violation. Type in `now` to set the current time"), messageFilter))?.content
        if (timestamp.toLowerCase() === 'now') timestamp = (new Date).toISOString()
        else {
            if (isNaN(Date.parse(timestamp))) timestamp = (new Date).toISOString()
            else timestamp = Date.parse(timestamp).toISOString()
        }

        let embed = new MessageEmbed()
            .setTitle("FAGC Violations")
            .setColor("RED")
            .setTimestamp()
            .setAuthor("FAGC Community")
            .setDescription(`Create FAGC violation for \`${playername}\``)
        embed.addFields(
            { name: "Admin name", value: admin_name, inline: true },
            { name: "Player name", value: playername, inline: true },
            { name: "Rule ID", value: ruleid, inline: true },
            { name: "Violation description", value: desc, inline: true },
            { name: "Proof", value: proof },
            { name: "Violated At (ISO)", value: timestamp }
        )
        message.channel.send(embed)
        const confirm = await message.channel.send("Do you wish to create this rule violation?")
        confirm.react("✅")
        confirm.react("❌")
        let reactions
        try {
            reactions = (await confirm.awaitReactions(reactionFilter, { max: 1, time: 120000, errors: ['time'] }))
        } catch {
            return message.channel.send("Timed out.")
        }
        let reaction = reactions.first()
        if (reaction.emoji.name === "❌")
            return message.channel.send("Violation creation cancelled")
        try {
            const responseRaw = await fetch(`${client.config.apiurl}/violations/create`, {
                method: "POST",
                body: JSON.stringify({
                    playername: playername,
                    admin_name: admin_name,
                    broken_rule: ruleid,
                    proof: proof,
                    description: desc,
                    automated: false,
                    violated_time: timestamp
                }),
                headers: { 'apikey': config.apikey, 'content-type': 'application/json' }
            })
            const response = await responseRaw.json()
            if (response._id && response.broken_rule && response.violated_time) {
                return message.channel.send(`Violation created! _id: \`${response._id}\``)
            } else if (response.error && response.description === 'Rule must be a RuleID') {
                return message.channel.send("RuleID is an invalid rule ObjectID. Please check rules")
            } else {
                return handleErrors(message, response)
            }
        } catch (error) {
            console.error(error)
            return message.channel.send("Error creating violation. Please check logs.")
        }
    },
};
