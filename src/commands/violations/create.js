const fetch = require("node-fetch")
const { apiurl } = require("../../config.json")
const ConfigModel = require("../../database/schemas/config")
const { MessageEmbed } = require("discord.js")

module.exports = {
    config: {
        name: "create",
        aliases: ["createviolation", "ban", "banhammer"],
        usage: "",
        category: "violations",
        description: "Creates a violation for a player",
        accessibility: "Moderator",
    },
    run: async (client, message, args) => {
        const config = await ConfigModel.findOne({ guildid: message.guild.id })
        if (config === null) return message.reply("Community invalid")
        if (!config.apikey) return message.reply("No API key set")
        const messageFilter = response => {
            return response.author.id === message.author.id
        }
        const reactionFilter = (reaction, user) => {
            return user.id == message.author.id
        }

        message.channel.send("Please type in a playername for the violation")
        const playername = (await message.channel.awaitMessages(messageFilter, { max: 1, time: 30000 })).first()?.content
        if (playername === undefined)
            return message.channel.send("Didn't send playername in time")
        message.channel.send("Please type in admin name for the violation")
        const adminname = (await message.channel.awaitMessages(messageFilter, { max: 1, time: 30000 })).first()?.content
        if (adminname === undefined)
            return message.channel.send("Didn't send adminname in time")
        message.channel.send("Please type in ObjectID of rule that has been broken")
        const ruleid = (await message.channel.awaitMessages(messageFilter, { max: 1, time: 30000 })).first()?.content
        if (ruleid === undefined)
            return message.channel.send("Didn't send rule ObjectID in time")
        message.channel.send("Please type in description of the violation or `none` if you don't want to set one")
        let desc = (await message.channel.awaitMessages(messageFilter, { max: 1, time: 30000 })).first()?.content
        if (desc.toLowerCase() === 'none') desc = undefined
        message.channel.send("Please send a link to proof of the violation or `none` if there is no proof")
        let proof = (await message.channel.awaitMessages(messageFilter, { max: 1, time: 30000 })).first()?.content
        if (proof.toLowerCase() === 'none') proof = undefined
        message.channel.send("Please send a value representing the date of the violation. Type in `now` to set the current time")
        let timestamp = (await message.channel.awaitMessages(messageFilter, { max: 1, time: 30000 })).first()?.content
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
            { name: "Admin name", value: adminname, inline: true },
            { name: "Player name", value: playername, inline: true },
            { name: "Rule ID", value: ruleid, inline: true },
            { name: "Violation description", value: desc, inline: true },
            { name: "Proof", value: proof},
            { name: "Violated At (ISO)", value: timestamp}
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
            return message.channel.send("Rule creation cancelled")
        try {
            const responseRaw = await fetch(`${apiurl}/violations/create`, {
                method: "POST",
                body: JSON.stringify({
                    playername: playername,
                    adminname: adminname,
                    brokenRule: ruleid,
                    proof: proof,
                    description: desc,
                    automated: false,
                }),
                headers: { 'apikey': config.apikey, 'content-type': 'application/json' }
            })
            const response = await responseRaw.json()
            if (response._id && response.brokenRule && response.violatedTime) {
                return message.channel.send(`Violation created! _id: \`${response._id}\``)
            } else if (response.error && response.description === 'Rule must be a RuleID') {
                return message.channel.send("RuleID is an invalid rule ObjectID. Please check rules")
            } else {
                console.error(response)
                return message.channel.send("Error creating violation. Please check logs.")
            }
        } catch (error) {
            console.error(error)
            return message.channel.send("Error creating violation. Please check logs.")
        }
    },
};
