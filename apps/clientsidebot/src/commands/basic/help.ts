import { Message, MessageEmbed } from "discord.js"
import Command from "../../base/Command"
import { TextChannel } from "discord.js"
import { PermissionResolvable } from "discord.js"
import path from "path"

export const command: Command<Message> = {
	name: "help",
	description: "Displays all available commands",
	aliases: ["h"],
	usage: "(command)",
	examples: ["{{p}}help", "{{p}}help ping"],
	dirname: __dirname,
	enabled: true,
	memberPermissions: [],
	botPermissions: [],
	ownerOnly: false,
	cooldown: 3000,
	requiredConfig: false,
	run: async (client, message, args, botconfig) => {
		const channel = message.channel as TextChannel
		const prefix = client.config.prefix
		if (args[0]) {
			const cmd = client.commands.get(args[0]) || client.commands.get(client.aliases.get(args[0]))
			if (!cmd) {
				return message.error(`\`${args[0]}\` is not a valid command\nType \`${client.config.prefix}help\` to see a list of available commands!`)
			}

			const description = cmd.description ? cmd.description : "No description"
			const usage = cmd.usage ? "```\n" + prefix + cmd.name + " " + cmd.usage + "\n```" : prefix + cmd.name
			const examples = cmd.examples ? `\`\`\`${cmd.examples.join("\n").replace(/\{\{p\}\}/g, prefix)}\`\`\`` : `\`\`\`${prefix}${cmd.name}\`\`\``
			// Creates the help embed
			const groupEmbed = new MessageEmbed()
				.setAuthor(`${prefix}${cmd.name} help`)
				.addField("Description", description)
				.addField("Usage", usage)
				.addField("Examples", examples)
				.addField("Aliases", cmd.aliases.length > 0
					? cmd.aliases.map(a => `\`${a}\``).join(",")
					: "No aliases"
				)
				.addField("Member permissions requried", cmd.memberPermissions.length > 0
					? cmd.memberPermissions.map((p) => "`" + p + "`").join("\n")
					: "No specific permission is required to execute this command"
				)
				.setColor(client.config.embeds.color)
				.setFooter(client.config.embeds.footer)
			if (botconfig) {
				const neededPermissions: PermissionResolvable[] = []
				cmd.memberPermissions.forEach((perm) => {
					message.channel = message.channel as TextChannel
					if (!channel.permissionsFor(message.member).has(perm))
						neededPermissions.push(perm)
				})
				const neededRoles: string[] = []
				if (botconfig) {
					cmd.customPermissions.forEach(perm => {
						if (perm && botconfig[`${perm}Role`])
							if (!message.member.roles.cache.has(botconfig[`${perm}Role`]))
								neededRoles.push(botconfig[`${perm}Role`])
					})
				}
				if (neededRoles.length > 0)
					groupEmbed.addField("Roles that can be used instead of the permissions", `<@&${neededRoles.join(">, <@&")}>`)
			}
			// and send the embed in the current channel
			return message.channel.send(groupEmbed)
		}

		const categories = []
		const commands = client.commands

		commands.forEach((command) => {
			const category = command.dirname.split(path.sep).pop()
			if (!categories.includes(category)) {
				if (category === "Owner" && message.author.id !== client.config.owner.id) {
					return
				}
				categories.push(category)
			}
		})

		const embed = new MessageEmbed()
			.setDescription(`● To get help on a specific command type\`${prefix}help <command>\`!`)
			.setColor(client.config.embeds.color)
			.setFooter(client.config.embeds.footer)
			.setAuthor(`${client.user.username} | Commands`, client.user.displayAvatarURL())
		categories.sort().forEach((cat) => {
			const tCommands = commands.filter((cmd) => cmd.dirname.split(path.sep).pop() === cat)
			embed.addField(cat + " - (" + tCommands.size + ")", tCommands.map((cmd) => "`" + cmd.name + "`").join(", "))
		})
		return message.channel.send(embed)
	}
}