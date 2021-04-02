const fetch = require("node-fetch")
// const globalConfig = require("../../utils/globalconfig")


module.exports = {
    config: {
        name: "addinfochannel",
        aliases: [],
        usage: "<channel ping/channel ID>",
        category: "informatics",
        description: "Adds a channel to send FAGC notifications to",
        accessibility: "Moderator",
    },
    run: async (client, message, args) => {
        if (!args[0]) return message.reply("Provide a channel ping or ID to send notifications to")
        const channel = message.mentions.channels.first() || client.channels.cache.get(args[0])
        globalConfig.config.infoChannels.push(channel.id)
        globalConfig.saveGlobalConfig()
        message.reply(`Channel ${channel} will recieve FAGC notifications from now on!`)
    },
};
