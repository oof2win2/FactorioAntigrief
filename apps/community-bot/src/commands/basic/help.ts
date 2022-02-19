import { Command } from "../../base/Command"

const Help: Command = {
	name: "help",
	aliases: ["h"],
	category: "basic",
	description: "Get help on a command",
	usage: "[command]",
	examples: ["help", "help ping"],
	requiresRoles: false,
	requiresApikey: false,
	run: ({ message, client, args, guildConfig }) => {
		if (!args.length) {
			// no specific command to help with
			const categories: Map<string, string[]> = new Map()
			client.commands.forEach((command) => {
				const existing = categories.get(command.category)
				if (!existing) {
					categories.set(command.category, [command.name])
				} else {
					if (!existing.includes(command.name))
						existing.push(command.name)
				}
			})
			const embed = client
				.createBaseEmbed()
				.setDescription(
					`● To get help on a specific command type\`${client.env.BOTPREFIX}help <command>\`!`
				)

			categories.forEach((value, key) => {
				embed.addField(
					`${key} - (${value.length})`,
					`\`${value.join("`, `")}\``
				)
			})
			return message.channel.send({
				embeds: [embed],
			})
		}
		const command = client.commands.get(args[0])
		if (!command) {
			return message.channel.send(`Command \`${args[0]}\` not found!`)
		}

		const requiredRoles: string[] = []
		const needToSetRoles: string[] = []

		if (command.requiresRoles && guildConfig) {
			command.requiredPermissions.forEach((permname) => {
				const roleid = guildConfig.roles[permname] // get the role which has this perm
				if (!roleid) needToSetRoles.push(permname) // if there is no role, it needs to be set
				requiredRoles.push(
					message.guild.roles.cache.get(roleid)?.name ??
						"Unknown role"
				) // add the role name to the list
			})
		}

		const embed = client
			.createBaseEmbed()
			.setTitle(command.name)
			.setDescription(command.description)
			.addField(
				"Usage",
				`\`${client.env.BOTPREFIX}${command.name} ${command.usage}\``
			)
			.addField(
				"Examples",
				`\`\`\`\n${command.examples
					.map((x) => `${client.env.BOTPREFIX}${x}`)
					.join("\n")}\`\`\`` || "No examples"
			)
			.addField("Category", `${command.category}`)
			.addField(
				"Aliases",
				`${
					command.aliases.length > 0
						? command.aliases.join(", ")
						: "No aliases"
				}`
			)
			.addField(
				"Roles required",
				requiredRoles.length
					? `\`${requiredRoles.join("`, `")}\``
					: "No specific permission is required to execute this command"
			)
		return message.channel.send({
			embeds: [embed],
		})
	},
}
export default Help
