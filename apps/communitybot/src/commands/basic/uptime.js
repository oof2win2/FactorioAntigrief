const Command = require("../../base/Command")

class Uptime extends Command {
  constructor(client) {
    super(client, {
      name: "uptime",
      description: "Show bot uptime",
      aliases: [],
      category: "basic",
      dirname: __dirname,
      enabled: true,
      guildOnly: true,
      memberPermissions: [],
      botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
      nsfw: false,
      ownerOnly: false,
      args: false,
      cooldown: 3000,
      requiredConfig: false,
    })
  }
  async run(message) {
    function duration(ms) {
      const sec = Math.floor((ms / 1000) % 60).toString();
      const min = Math.floor((ms / (1000 * 60)) % 60).toString();
      const hrs = Math.floor((ms / (1000 * 60 * 60)) % 24).toString();
      const days = Math.floor((ms / (1000 * 60 * 60 * 24)) % 60).toString();
      return `\`${days.padStart(1, "0")}:${hrs.padStart(2, "0")}:${min.padStart(
        2,
        "0"
      )}:${sec.padStart(2, "0")}\``;
    }

    message.channel.send(`My uptime: ${duration(this.client.uptime)}`);
  }
}
module.exports = Uptime