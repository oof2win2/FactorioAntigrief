const fetch = require("node-fetch")
const { apiurl, embedColors } = require("../../config.json")
const { apitoken } = require("../../botconfig.json")
const { MessageEmbed } = require("discord.js")

module.exports = {
    config: {
        name: "removerule",
        aliases: [],
        usage: "<rule object ID>",
        category: "rules",
        description: "Removes a rule",
    },
    run: async (client, message, args) => {
        if (!args[0]) return message.reply("Please specify rule ID")
        const reactionFilter = (reaction, user) => {
            return user.id == message.author.id
        }
        
        const ruleRaw = await fetch(`${apiurl}/rules/getid?id=${args[0]}`)
        const rule = await ruleRaw.json()
        if (rule === null || rule.shortdesc === undefined || rule.longdesc === undefined) {
            if (rule !== null) console.error({rule})
            return message.reply("Error getting rule. Check ID")
        }
        let checkEmbed = new MessageEmbed()
            .setTitle("FAGC Rules")
            .setColor(embedColors.info)
            .setTimestamp()
            .setAuthor("FAGC Community")
            .setDescription("Remove FAGC Rule")
        checkEmbed.addField("Rule Short Description", rule.shortdesc)
        checkEmbed.addField("Rule Long Description", rule.longdesc)
        await message.channel.send(checkEmbed)
        const confirm = await message.channel.send("Are you sure you want to remove this rule?")
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
            return message.channel.send("Rule removal cancelled")
        try {
            const responseRaw = await fetch(`${apiurl}/rules/remove`, {
                method: "DELETE",
                body: JSON.stringify({
                    id: args[0]
                }),
                headers: { 'apikey': apitoken, 'content-type': 'application/json' }
            })
            const response = await responseRaw.json()
            if (response._id && response.shortdesc && response.longdesc) {
                return message.channel.send(`Rule removed!`)
            } else {
                console.error({response})
                return message.channel.send("Error removing rule. Please check logs.")
            }
        } catch (error) {
            console.error({error})
            return message.channel.send("Error removing rule. Please check logs.")
        }
    },
};
