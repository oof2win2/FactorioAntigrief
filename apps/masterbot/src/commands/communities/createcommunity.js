const { MessageEmbed } = require("discord.js")
const { apiurl, apikey } = require("../../../config.json")
const fetch = require("node-fetch")

module.exports = {
    config: {
        name: "createcommunity",
        aliases: [],
        usage: "",
        category: "communities",
        description: "Creates a FAGC Community (with API key)",
    },
    run: async (client, message, args) => {
        const messageFilter = (m) => m.author.id === message.author.id
        message.channel.send("Process of creating a new community has started")
        message.channel.send("Please type in community name")
        const name = (await message.channel.awaitMessages(messageFilter, { max: 1, time: 30000 })).first()?.cleanContent
        if (!name)
            return message.reply("No valid community name entered")
        message.channel.send("Please type in the contact for this community")
        const contact = (await message.channel.awaitMessages(messageFilter, { max: 1, time: 30000 })).first()?.cleanContent
        if (!contact)
            return message.reply("No valid contact entered")
        let embed = new MessageEmbed()
            .setTitle("FAGC Community Setup")
            .setAuthor("FAGC Community")
            .setTimestamp()
            .addFields(
                {name: "Community name", value: name},
                {name: "Contact", value: contact}
            )
        message.channel.send(embed)
        const confirm = await message.channel.send("Are you sure you want these settings applied?")
        confirm.react("✅")
        confirm.react("❌")
        const reactionFilter = (reaction, user) => {
            return user.id == message.author.id
        }
        let reactions
        try {
            reactions = await confirm.awaitReactions(reactionFilter, { max: 1, time: 120000, errors: ['time'] })
        } catch (error) {
            return message.channel.send("Timed out.")
        }
        let reaction = reactions.first()
        if (reaction.emoji.name === "❌")
            return message.channel.send("Community creation cancelled")
        try {
            const communityRaw = await fetch(`${apiurl}/communities/create`, {
                method: "POST",
                body: JSON.stringify({
                    name: name,
                    contact: contact
                }),
                headers: { 'apikey': apikey, 'content-type': 'application/json' }
            })
            const community = await communityRaw.json()
            if (community.key && community.community._id) {
                message.author.send(`API key for community ${name}, contacted at ${contact}`)
                message.author.send(`||${community.key}||`)
                return message.channel.send(`Community created successfully! API key has been sent to your DMs`)
            } else {
                console.error({ community })
                return message.channel.send("Error creating community. Please check logs.")
            }
        } catch (error) {
            console.error({ error })
            return message.channel.send("Error creating community. Please check logs.")
        }
    },
};
