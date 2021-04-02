const { MessageEmbed } = require("discord.js");
const ConfigModel = require("../../database/schemas/config")

module.exports = {
    config: {
        name: "setup",
        aliases: ["config"],
        usage: "",
        category: "basic",
        description: "Bot Server setup",
        accessibility: "Moderator",
    },
    run: async (client, message, args) => {
        const messageFilter = response => {
            return response.author.id === message.author.id
        }
        message.channel.send("Hello! This is the bot setup process for this server")
        message.channel.send("Please type in a contact for this server or the server's owner")
        const contact = (await message.channel.awaitMessages(messageFilter, { max: 1, time: 30000 })).first()?.content
        if (contact === undefined) return message.channel.send("Didn't send contact in time")
        message.channel.send("Please ping (or type in the ID of) your role of people which can create violations")
        let role = (await message.channel.awaitMessages(messageFilter, { max: 1, time: 30000 })).first()
        if (role.mentions.roles.first()) role = role.mentions.roles.first().id
        else role = role.content
        if (message.guild.roles.cache.get(role) === undefined) return message.channel.send("Role is not correct")
        message.channel.send("Please type in your API key that you recieved from the FAGC team, if you did recieve one. Type `none` if you didn't")
        let apikey = (await message.channel.awaitMessages(messageFilter, { max: 1, time: 30000 })).first()
        apikey.delete()
        if (apikey.content === 'none') apikey = undefined
        else apikey = apikey.content
        console.log(apikey)
        
        let embed = new MessageEmbed()
            .setTitle("FAGC Config")
            .setAuthor("FAGC Community")
            .setTimestamp()
            .setDescription("Your FAGC Configuration")
        embed.addFields(
            {name: "Community name", value: message.guild.name},
            {name: "Contact", value: contact},
            {name: "Moderator role", value: `<@&${role}>`},
            {name: "API key", value: apikey ? "Hidden" : "None"}
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
            return message.channel.send("Community configuration cancelled")
        try {
            const originalData = await ConfigModel.findOne({
                guildid: message.guild.id
            })
            let config = {}
            if (originalData) {
                config = await ConfigModel.findOneAndReplace({guildid: originalData.guildid}, {
                    communityname: message.guild.name,
                    guildid: message.guild.id,
                    contact: contact,
                    moderatorroleId: role,
                    apikey: apikey,
                }, {new: true})
            } else {
                config = await ConfigModel.create({
                    communityname: message.guild.name,
                    guildid: message.guild.id,
                    contact: contact,
                    moderatorroleId: role,
                })
            }
            if (config.guildid && config.communityname) {
                return message.channel.send(`Community configured successfully!`)
            } else {
                console.error({ config })
                return message.channel.send("Error setting configuration. Please check logs.")
            }
        } catch (error) {
            console.error({ error })
            return message.channel.send("Error setting configuration. Please check logs.")
        }
    },
};
