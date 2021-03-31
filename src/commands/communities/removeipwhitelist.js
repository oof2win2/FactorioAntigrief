const fetch = require("node-fetch")
const { apiurl, embedColors } = require("../../config.json")
const { apitoken } = require("../../botconfig.json")
const { MessageEmbed } = require("discord.js")

module.exports = {
    config: {
        name: "removeipwhitelist",
        aliases: [],
        usage: "<ip>",
        category: "communities",
        description: "Removes a IP whitelist",
        accessibility: "Moderator",
    },
    run: async (client, message, args) => {
        if (!args[0])
            return message.reply("Provide an IP to remove from your whitelist")
        const v4Regex = /(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}/g
        const v6Regex = / (([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))/g
        if (!args[0].match(v4Regex) && !args[0].match(v6Regex))
            return message.reply(`IP \`${args[0]}\` is invalid!`)
        const confirm = await message.reply(`From now on, this community will not be able to access the API from the IP ${args[0]}, unless this is your only IP whitelist`)
        confirm.react("✅")
        confirm.react("❌")
        const reactionFilter = (reaction, user) => {
            return user.id == message.author.id
        }
        let reactions
        try {
            reactions = await confirm.awaitReactions(reactionFilter, { max: 1, time: 120000, errors: ['time'] })
        } catch (error) {
            console.log(error)
            return message.channel.send("Timed out.")
        }
        let reaction = reactions.first()
        if (reaction.emoji.name === "❌")
            return message.channel.send("IP whitelist removal cancelled")
        try {
            const responseRaw = await fetch(`${apiurl}/communities/removewhitelist`, {
                method: "DELETE",
                body: JSON.stringify({
                    ip: args[0]
                }),
                headers: { 'apikey': apitoken, 'content-type': 'application/json' }
            })
            const response = await responseRaw.json()
            console.log(response)
            if (response._id && response.allowedIPs && response.communityname) {
                message.channel.send(`Whitelist of IP ${args[0]} removed!`)
                return message.channel.send(`IP whitelists for your community are \`${response.allowedIPs.join("`, `")}\``)
            } else {
                console.error({ response })
                return message.channel.send("Error removing whitelist. Please check logs.")
            }
        } catch (error) {
            console.error({ error })
            return message.channel.send("Error removing whitelist. Please check logs.")
        }
    },
};
