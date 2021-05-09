const fetch = require("node-fetch")

module.exports = {
  config: {
    name: "ping",
    aliases: ["alias"],
    usage: "",
    category: "basic",
    description: "Pings the bot and API",
    accessibility: "Member",
  },
  run: async (client, message, args) => {
    let wsPing = client.ws.ping;

    message.channel.send("Pinging...").then(async (m) => {
      let ping = m.createdTimestamp - message.createdTimestamp;
      const beforeFetch = Date.now()
      await fetch(client.config.apiurl)
      const apilatency = Date.now() - beforeFetch
      m.edit(`Bot Latency: \`${ping}ms\`\nDiscord API Latency: \`${wsPing}ms\`\nFAGC API Latency: \`${apilatency}ms\``);
    });
  },
};
