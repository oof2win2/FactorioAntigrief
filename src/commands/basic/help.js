const { MessageEmbed } = require("discord.js");
const { readdirSync } = require("fs");
const { stripIndents } = require("common-tags");
const Command = require("../../base/Command")
class Help extends Command {
  constructor(client) {
    super(client, {
      name: "help",
      description: "Displays all available commands",
      aliases: ["h", "commands"],
      usage: ["{{p}}help", "{{p}}help ping"],
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
    const embed = new MessageEmbed()
      .setColor(this.client.config.embeds.color)
      .setAuthor(`${message.guild.me.displayName} Help`, message.guild.iconURL)
      .setThumbnail(this.client.user.displayAvatarURL());

    if (!args[0]) {
      const categories = readdirSync("./commands/");

      embed.setDescription(
        `These are the avaliable commands for ${message.guild.me.displayName}\nThe bot prefix is: **${this.client.config.prefix}**`
      );
      embed.setFooter(
        `© ${message.guild.me.displayName} | Developed by DistroByte | Total Commands: ${this.client.commands.size}`,
        this.client.user.displayAvatarURL()
      );

      categories.forEach((category) => {
        const dir = this.client.commands.filter(
          (c) => c.help.category === category
        );
        const capitalise =
          category.slice(0, 1).toUpperCase() + category.slice(1);
        try {
          embed.addField(
            `${capitalise} [${dir.size}]:`,
            dir.map((c) => `\`${c.help.name}\``).join(" ")
          );
        } catch (e) {  }
      });

      return message.channel.send(embed);
    } else {
      let command = this.client.commands.get(
        this.client.aliases.get(args[0].toLowerCase()) || args[0].toLowerCase()
      );
      if (!command)
        return message.channel.send(
          embed
            .setTitle("Invalid Command.")
            .setDescription(
              `Do \`${this.client.config.prefix}help\` for the list of the commands.`
            )
        );
      command = command.config;

      embed.setDescription(stripIndents`The bot's prefix is: \`${this.client.config.prefix}\`\n
            **Command:** ${command.name.slice(0, 1).toUpperCase() + command.name.slice(1)
        }
            **Description:** ${command.description || "No Description provided."
        }
            **Usage:** ${command.usage
          ? `\`${this.client.config.prefix}${command.name} ${command.usage}\``
          : `\`${this.client.config.prefix}${command.name}\``
        }
            **Accessible by:** ${command.accessableby || "Members"}
            **Aliases:** ${command.aliases ? command.aliases.join(", ") : "None"
        }`);
      embed.setFooter(
        `© ${message.guild.me.displayName} | Developed by DistroByte`,
        this.client.user.displayAvatarURL()
      );

      return message.channel.send(embed);
    }
  }
}

module.exports = Help