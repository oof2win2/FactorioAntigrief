const { MessageEmbed } = require("discord.js");
const ConfigModel = require("../../database/schemas/config")

module.exports = {
    config: {
        name: "setapikey",
        aliases: [],
        usage: "",
        category: "basic",
        description: "Set API key",
        accessibility: "Moderator",
    },
    run: async (client, message, args) => {
        const config = ConfigModel.findOne({guildid: message.guild.id})
        if (!config)
            return message.reply("Your community does not exist!")
        const messageFilter = response => {
            return response.author.id === message.author.id
        }
        message.channel.send("Please type in your API key")
        let apimsg = (await message.channel.awaitMessages(messageFilter, { max: 1, time: 30000 })).first()
        apimsg.delete()
        const apikey = apimsg.content
        
        try {
            const config = await ConfigModel.findOneAndUpdate({guildid: message.guild.id}, {
                $set: {"apikey": apikey}
            }, {new: true})
            if (config.apikey && config.guildid === message.guild.id) {
                return message.channel.send(`API key set successfully!`)
            } else {
                console.error({ config })
                return message.channel.send("Error setting API key. Please check logs.")
            }
        } catch (error) {
            console.error({ error })
            return message.channel.send("Error setting API key. Please check logs.")
        }
    },
};
