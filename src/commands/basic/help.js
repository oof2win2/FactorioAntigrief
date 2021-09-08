const Discord = require("discord.js")
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
			memberPermissions: [],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			ownerOnly: false,
			cooldown: 3000,
			requiredConfig: false,
		})
	}
	async run(message, args, config) {
		const prefix = this.client.env.BOTPREFIX
		if (args[0]) {
			const cmd = this.client.commands.get(args[0]) || this.client.commands.get(this.client.aliases.get(args[0]))
			if (!cmd) {
				return message.error(`\`${args[0]}\` is not a valid command\nType \`${this.client.env.BOTPREFIX}help\` to see a list of available commands!`)
			}

			const description = cmd.help.description ? cmd.help.description : "No description"
			const usage = cmd.help.usage ? "```\n" + prefix + cmd.help.name + " " + cmd.help.usage + "\n```" : prefix + cmd.help.name
			const examples = cmd.help.examples ? `\`\`\`${cmd.help.examples.join("\n").replace(/\{\{p\}\}/g, prefix)}\`\`\`` : `\`\`\`${prefix}${cmd.help.name}\`\`\``
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
				.addField("Member permissions requried", cmd.config.memberPermissions.length > 0
					? cmd.config.memberPermissions.map((p) => "`" + p + "`").join("\n")
					: "No specific permission is required to execute this command"
				)
				.setColor(this.client.config.embeds.color)
				.setFooter(this.client.config.embeds.footer)
			if (config && config.roles) {
				let neededRoles = []
				cmd.config.customPermissions.forEach(perm => {
					if (perm && config.roles[perm] !== "")
						neededRoles.push(config.roles[perm])
				})
				if (neededRoles.length > 0)
					groupEmbed.addField("The following roles can always use this command", `<@&${neededRoles.join(">, <@&")}>`)
			}
			// and send the embed in the current channel
			return message.channel.send(groupEmbed)
		}

		const categories = []
		const commands = this.client.commands

		commands.forEach((command) => {
			if (!categories.includes(command.help.category)) {
				if (command.help.category === "Owner" && message.author.id !== this.client.config.owner.id) {
					return
				}
				categories.push(command.help.category)
			}
		})

		const embed = new Discord.MessageEmbed()
			.setDescription(`● To get help on a specific command type\`${prefix}help <command>\`!`)
			.setColor(this.client.config.embeds.color)
			.setFooter(this.client.config.embeds.footer)
			.setAuthor(`${this.client.user.username} | Commands`, this.client.user.displayAvatarURL())
		categories.sort().forEach((cat) => {
			const tCommands = commands.filter((cmd) => cmd.help.category === cat)
			embed.addField(cat + " - (" + tCommands.size + ")", tCommands.map((cmd) => "`" + cmd.help.name + "`").join(", "))
		})
		return message.channel.send(embed)
	}
}

module.exports = Help