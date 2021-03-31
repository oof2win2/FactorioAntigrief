const fetch = require("node-fetch")
const { apiurl } = require("../../config.json")

module.exports = {
  config: {
    name: "ping",
    aliases: ["alias"],
    usage: "",
    category: "basic",
    description: "Pings the bot",
  },
  run: async (client, message, args) => {
    let wsPing = client.ws.ping;

    message.channel.send("Pinging...").then(async (m) => {
      let ping = m.createdTimestamp - message.createdTimestamp;
      await fetch(apiurl)
      const apilatency = Date.now() - m.createdTimestamp
      m.edit(`Bot Latency: \`${ping}ms\`\nDiscord API Latency: \`${wsPing}ms\`\nFAGC API Latency: \`${apilatency}ms\``);
    });
  },
};
