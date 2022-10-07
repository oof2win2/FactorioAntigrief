import { SlashCommandSubcommandGroupBuilder } from "@discordjs/builders"
import {
	executeCommandInteraction,
	SubCommand,
	SubCommandGroup,
} from "../../base/Command"
import { loadSubcommands } from "../../utils/functions"

const commands = loadSubcommands("config", "webhook") as SubCommand<
	boolean,
	boolean
>[]

const Webhook: SubCommandGroup = {
	data: new SlashCommandSubcommandGroupBuilder()
		.setName("webhook")
		.setDescription("Webhook"),
	execute: (args) => executeCommandInteraction(args, commands),
	type: "SubCommandGroup",
	commands,
}

commands.forEach((command) => {
	if (command.type === "SubCommand") Webhook.data.addSubcommand(command.data)
})

export default Webhook
