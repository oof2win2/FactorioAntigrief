const fetch = require("node-fetch")
const { apiurl, embedColors } = require("../../config.json")
const { apitoken } = require("../../botconfig.json")
const { MessageEmbed } = require("discord.js")

module.exports = {
    config: {
        name: "createrule",
        aliases: [],
        usage: "",
        category: "rules",
        description: "Creates a rule",
    },
    run: async (client, message, args) => {
        const messageFilter = response => {
            return response.author.id === message.author.id
        }
        const reactionFilter = (reaction, user) => {
            return user.id == message.author.id
        }
        message.channel.send("Please type in rule short description")
        try {
            shortdesc = (await message.channel.awaitMessages(messageFilter, { max: 1, time: 60000, errors: ['time'] })).first()
        } catch {
            return message.channel.send("Timed out.")
        }

        message.channel.send("Please type in rule long description")
        try {
            longdesc = (await message.channel.awaitMessages(messageFilter, { max: 1, time: 120000, errors: ['time'] })).first()
        } catch {
            return message.channel.send("Timed out.")
        }
        let checkEmbed = new MessageEmbed()
            .setTitle("FAGC Rules")
            .setColor(embedColors.info)
            .setTimestamp()
            .setAuthor("FAGC Community")
            .setDescription("Create FAGC Rule")
        checkEmbed.addField("Rule Short Description", shortdesc)
        checkEmbed.addField("Rule Long Description", longdesc)
        await message.channel.send(checkEmbed)
        const confirm = await message.channel.send("Are you sure you want this to be the rule?")
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
            const responseRaw = await fetch(`${apiurl}/rules/create`, {
                method: "POST",
                body: JSON.stringify({
                    shortdesc: shortdesc.content,
                    longdesc: longdesc.content
                }),
                headers: { 'apikey': apitoken, 'content-type': 'application/json' }
            })
            const response = await responseRaw.json()
            if (response._id && response.shortdesc && response.longdesc) {
                return message.channel.send(`Rule created! _id: \`${response._id}\``)
            } else {
                console.error(response)
                return message.channel.send("Error creating rule. Please check logs.")
            }
        } catch (error) {
            console.error(error)
            return message.channel.send("Error creating rule. Please check logs.")
        }
    },
};
