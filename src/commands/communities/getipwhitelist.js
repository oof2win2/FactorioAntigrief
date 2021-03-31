const fetch = require("node-fetch")
const { apiurl, embedColors } = require("../../config.json")
const { apitoken } = require("../../botconfig.json")
const { MessageEmbed } = require("discord.js")

module.exports = {
    config: {
        name: "getipwhitelist",
        aliases: [],
        usage: "",
        category: "communities",
        description: "Gets your community's IP whitelists",
    },
    run: async (client, message, args) => {
        const whitelistRaw = await fetch(`${apiurl}/communities/getwhitelist`, {
            method: "GET",
            headers: { 'apikey': apitoken, 'content-type': 'application/json' }
        })
        const whitelist = await whitelistRaw.json()
        message.channel.send(`IP whitelists for your community are \`${whitelist.allowedIPs.join("`, `")}\``)
    },
};
