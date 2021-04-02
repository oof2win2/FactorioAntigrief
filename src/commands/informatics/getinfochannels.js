const fetch = require("node-fetch")
// const globalConfig = require("../../utils/globalconfig")


module.exports = {
    config: {
        name: "getinfochannels",
        aliases: [],
        usage: "",
        category: "informatics",
        description: "Gets channels that FAGC sends notifications to",
        accessibility: "Member",
    },
    run: async (client, message, args) => {
        message.reply(`Channels <#${globalConfig.config.infoChannels.join(">, <#")}> are recieving FAGC notifications`)
    },
};
