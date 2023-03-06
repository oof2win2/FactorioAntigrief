import { CommandInteraction, GuildMember, Interaction } from "discord.js"
import { FilterObject, GuildConfig } from "@fdgl/types"
import { CommandConfig, SlashCommand } from "../../base/Command"
import FDGLBot from "../../base/fdglbot"
import { afterJoinGuild, sendToGuild } from "../../utils/functions"

const getKey = (
	key: keyof CommandConfig<boolean, boolean>,
	command: SlashCommand<boolean, boolean>,
	subcommandName: string | null,
	groupName: string | null
): unknown => {
	switch (command.type) {
		case "Command":
			return command[key]
		case "SubCommand":
			return command[key]
		case "SubCommandGroup": {
			const subcommand = command.commands.find(
				(subcommand) =>
					subcommand.data.name === groupName ||
					subcommand.data.name === subcommandName
			)

			if (!subcommand) throw new Error("Subcommand Group not found")
			return getKey(key, subcommand, subcommandName, groupName)
		}
		case "CommandWithSubcommands": {
			const subcommand = command.commands.find(
				(subcommand) =>
					subcommand.data.name === groupName ||
					subcommand.data.name === subcommandName
			)

			if (!subcommand) throw new Error("Subcommand not found")
			return getKey(key, subcommand, subcommandName, groupName)
		}
	}
}

export const checkCommandErrors = async (
	command: SlashCommand<boolean, boolean>,
	interaction: CommandInteraction<"cached">,
	client: FDGLBot,
	member: GuildMember,
	guildConfig: GuildConfig,
	filters: FilterObject | null
) => {
	// check if the command requires api key
	if (
		getKey(
			"requiresApikey",
			command,
			interaction.options.getSubcommand(false),
			interaction.options.getSubcommandGroup(false)
		) &&
		!guildConfig.apikey
	)
		return `${client.config.emotes.warn} API key must be set for use of this command`

	if (
		!filters &&
		getKey(
			"fetchFilters",
			command,
			interaction.options.getSubcommand(false),
			interaction.options.getSubcommandGroup(false)
		)
	)
		return `${client.emotes.error} An error occured whilst fetching your filters`

	// if command doesnt require guild config (like help, ping etc), it can be ran
	if (
		!getKey(
			"requiresRoles",
			command,
			interaction.options.getSubcommand(false),
			interaction.options.getSubcommandGroup(false)
		)
	)
		return null

	// if any of the roles are not present on the guild config, they must be filled first
	console.log(interaction.options.getSubcommand(false))
	if (
		// TODO update this to use the new command system
		interaction.options.getSubcommand(false) !== "permissions" &&
		interaction.options.getSubcommandGroup(false) !== "set" &&
		(!guildConfig.roles.reports ||
			!guildConfig.roles.setCommunities ||
			!guildConfig.roles.setConfig ||
			!guildConfig.roles.setCategories ||
			!guildConfig.roles.webhooks)
	)
		// TODO use a command mention
		return `You need to run the \`/config set permissions\` command and set all roles before you can run any other commands!`

	// check which roles the user doesnt have
	const doesntHaveRoles =
		// TODO solve this
		(command.type === "Command" || command.type === "SubCommand") &&
		command.requiresRoles &&
		command.requiredPermissions.filter((permname) => {
			const roleid = guildConfig.roles[permname] // get the role which has this perm
			return !member?.roles.cache.has(roleid) // if the user does not have the role, return true to keep it in the array
		})
	// if the user doesnt have any of the roles, is not the guild owner, or has the ADMINISTRATOR, return
	if (
		doesntHaveRoles &&
		doesntHaveRoles.length > 0 &&
		member.guild.ownerId !== member.id &&
		!member.permissions.has("ADMINISTRATOR")
	) {
		// list of roles that are set on the guild config but have since been deleted
		const nonexistentRoles: string[] = []
		const roles = doesntHaveRoles
			.map((permname) => [permname, guildConfig.roles[permname]]) // get the role ID of the perm
			.map((permname): [string, string | undefined] => [
				permname[0],
				member.guild.roles.cache.get(permname[1])?.name,
			])
			.filter((role: [string, string | undefined]) => {
				if (!role[1]) {
					// notify the guild owner if the role is not found
					nonexistentRoles.push(role[0])
					return false
				}
				return true
			})
			// get the names of the roles and make sure they are valid roles
			.map((x) => x[1])
			.filter((x): x is string => Boolean(x))
		if (nonexistentRoles.length)
			sendToGuild(
				member.guild,
				`The following roles are not set on the guild config: \`${nonexistentRoles.join(
					"`, `"
				)}\``
			)

		return `You need the following roles to execute this command: \`${roles.join(
			"`, `"
		)}\``
	}

	return null
}

export default async (client: FDGLBot, interaction: Interaction) => {
	// if interaction is not a command or not in a guild then we dont care
	if (!interaction.isCommand() || !interaction.inGuild()) return

	const { commandName } = interaction
	const command = client.commands.get(commandName)
	if (!command) return

	// idk but this shouldnt happen
	if (!interaction.inCachedGuild()) return

	// this temp var is required due to TS being TS
	// fetch the guild config for the guild, or create one if it doesn't exist yet
	let tmpGuildConfig = await client.fdgl.communities.fetchGuildConfigMaster({
		guildId: interaction.guild.id,
	})
	if (!tmpGuildConfig) {
		tmpGuildConfig = await client.fdgl.communities.createGuildConfig({
			guildId: interaction.guild.id,
		})
		// this creates a guild config if it doesn't exist yet, so it runs after
		afterJoinGuild(interaction.guild, client)
	}
	const guildConfig = tmpGuildConfig

	// fetch the filters for the guild if the command requires it
	console.log(interaction)
	const filters = getKey(
		"fetchFilters",
		command,
		interaction.options.getSubcommand(false),
		interaction.options.getSubcommandGroup(false)
	)
		? await client.fdgl.communities.getFiltersById({
				id: guildConfig.filterObjectId,
		  })
		: null

	const error = await checkCommandErrors(
		command,
		interaction,
		client,
		interaction.member,
		guildConfig,
		filters
	)

	// if filters is a string, it means there was an error
	// f.e. command requires apikey etc.
	if (error !== null) return await interaction.reply(error)

	try {
		return await command.execute({
			interaction,
			client,
			guildConfig,
			filters,
		})
	} catch (e) {
		const message = "Something went wrong... Please try again later!"
		if (interaction.deferred || interaction.replied)
			interaction.editReply(message)
		else interaction.reply(message)

		throw e
	}
}
