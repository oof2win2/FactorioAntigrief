const fetch = require("node-fetch")
const globalConfig = require("../../utils/globalconfig")


module.exports = {
    config: {
        name: "removeinfochannel",
        aliases: [],
        usage: "<channel ping/channel ID>",
        category: "informatics",
        description: "Removes a channel to send FAGC notifications to",
    },
    run: async (client, message, args) => {
        if (!args[0]) return message.reply("Provide a channel ping or ID to stop sending notifications to")
        const channel = message.mentions.channels.first() || client.channels.cache.get(args[0])
        globalConfig.config.infoChannels = globalConfig.config.infoChannels.filter((channelID) => {
            return channelID !== channel.id
        })
        console.log(globalConfig.config.infoChannels)
        globalConfig.saveGlobalConfig()
        message.reply(`Channel ${channel} will recieve FAGC notifications from now on!`)
    },
};
