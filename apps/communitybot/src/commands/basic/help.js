const Discord = require("discord.js");
const { readdirSync } = require("fs");
const { stripIndents } = require("common-tags");
const Command = require("../../base/Command")

class Help extends Command {
  constructor(client) {
    super(client, {
      name: "help",
      description: "Displays all available commands",
      aliases: ["h", "commands"],
      usage: "(command)",
      examples: ["{{p}}help", "{{p}}help ping"],
      category: "basic",
      dirname: __dirname,
      enabled: true,
      guildOnly: true,
      memberPermissions: [],
      accessLevel: "Member",
      botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
      nsfw: false,
      ownerOnly: false,
      args: false,
      cooldown: 3000,
      requiredConfig: false,
    })
  }
  async run(message, args) {
    const prefix = this.client.config.prefix
    if (args[0]) {
      const cmd = this.client.commands.get(args[0]) || this.client.commands.get(this.client.aliases.get(args[0]));
      if (!cmd) {
        return message.error(`\`${args[0]}\` is not a valid command\nType \`${this.client.config.prefix}help\` to see a list of available commands!`);
      }

      const description = cmd.help.description ? cmd.help.description : "No description";
      const usage = cmd.help.usage ? "```\n" + prefix + cmd.help.name + " " + cmd.help.usage + "\n```" : prefix + cmd.help.name;
      const examples = cmd.help.examples ? `\`\`\`${cmd.help.examples.join("\n").replace(/\{\{p\}\}/g, prefix)}\`\`\`` : `\`\`\`${prefix}${cmd.help.name}\`\`\``;
      // Creates the help embed
      const groupEmbed = new Discord.MessageEmbed()
        .setAuthor(`${prefix}${cmd.help.name} help`)
        .addField("Description", description)
        .addField("Usage", usage)
        .addField("Examples", examples)
        .addField("Aliases", cmd.help.aliases.length > 0
          ? cmd.help.aliases.map(a => `\`${a}\``).join(",")
          : "No aliases"
        )
        .addField("Member permissions requried", cmd.conf.memberPermissions.length > 0
          ? cmd.conf.memberPermissions.map((p) => "`" + p + "`").join("\n")
          : "No specific permission is required to execute this command"
        )
        .setColor(this.client.config.embeds.color)
        .setFooter(this.client.config.embeds.footer);

      // and send the embed in the current channel
      return message.channel.send(groupEmbed);
    }

    const categories = [];
    const commands = this.client.commands;

    commands.forEach((command) => {
      if (!categories.includes(command.help.category)) {
        if (command.help.category === "Owner" && message.author.id !== this.client.config.owner.id) {
          return;
        }
        categories.push(command.help.category);
      }
    });

    const embed = new Discord.MessageEmbed()
      .setDescription(`● To get help on a specific command type\`${prefix}help <command>\`!`)
      .setColor(this.client.config.embeds.color)
      .setFooter(this.client.config.embeds.footer);
    categories.sort().forEach((cat) => {
      const tCommands = commands.filter((cmd) => cmd.help.category === cat);
      embed.addField(cat + " - (" + tCommands.size + ")", tCommands.map((cmd) => "`" + cmd.help.name + "`").join(", "));
    });
  }
}

module.exports = Help