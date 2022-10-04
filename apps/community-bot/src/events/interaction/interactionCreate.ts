import { Interaction } from "discord.js"
import FAGCBot from "../../base/fagcbot"
import { afterJoinGuild, sendToGuild } from "../../utils/functions"

export default async (client: FAGCBot, interaction: Interaction) => {
	console.log(interaction)
	// if interaction is not a command or not in a guild then we dont care
	if (!interaction.isCommand() || !interaction.inGuild()) return

	const { commandName } = interaction
	const command = client.commands.get(commandName)
	if (!command) return

	const botConfig = client.config

	// idk but this shouldnt happen
	if (!interaction.inCachedGuild()) return

	// this temp var is required due to TS being TS
	// fetch the guild config for the guild, or create one if it doesn't exist yet
	let tmpGuildConfig = await client.fagc.communities.fetchGuildConfigMaster({
		guildId: interaction.guild.id,
	})
	if (!tmpGuildConfig) {
		tmpGuildConfig = await client.fagc.communities.createGuildConfig({
			guildId: interaction.guild.id,
		})
		// this creates a guild config if it doesn't exist yet, so it runs after
		afterJoinGuild(interaction.guild, client)
	}
	const guildConfig = tmpGuildConfig

	// check if the command requires api key
	if (command.requiresApikey && !guildConfig.apikey)
		return interaction.reply(
			`${client.config.emotes.warn} API key must be set for use of this command`
		)

	const filters = command.fetchFilters
		? await client.fagc.communities.getFiltersById({
			id: guildConfig.filterObjectId,
		})
		: null
	if (!filters && command.fetchFilters)
		return interaction.reply(
			`${client.emotes.error} An error occured whilst fetching your filters`
		)

	// if command doesnt require guild config (like help, ping etc), it can be ran
	if (!command.requiresRoles) {
		try {
			return await command.execute({
				interaction,
				client,
				guildConfig,
				filters,
			})
		} catch (e) {
			const message = "An error occured while running this command!"
			if (interaction.deferred || interaction.replied)
				interaction.editReply(message)
			else interaction.reply(message)

			throw e
		}
	}

	// if any of the roles are not present on the guild config, they must be filled first
	if (
		// TODO update the setpermissions command to use the new command system
		commandName !== "setpermissions" &&
		(!guildConfig.roles.reports ||
			!guildConfig.roles.setCommunities ||
			!guildConfig.roles.setConfig ||
			!guildConfig.roles.setCategories ||
			!guildConfig.roles.webhooks)
	)
		return interaction.reply(
			// TODO use a command mention
			`You need to run the \`${client.env.BOTPREFIX}setpermissions\` command and set all roles before you can run any other commands!`
		)

	// check which roles the user doesnt have
	const doesntHaveRoles = command.requiredPermissions.filter((permname) => {
		const roleid = guildConfig.roles[permname] // get the role which has this perm
		return !interaction.member?.roles.cache.has(roleid) // if the user does not have the role, return true to keep it in the array
	})
	// if the user doesnt have any of the roles, is not the guild owner, or has the ADMINISTRATOR, return
	if (
		doesntHaveRoles.length > 0 &&
		interaction.guild.ownerId !== interaction.user.id &&
		!interaction.member!.permissions.has("ADMINISTRATOR")
	) {
		// list of roles that are set on the guild config but have since been deleted
		const nonexistentRoles: string[] = []
		const roles = doesntHaveRoles
			.map((permname) => [permname, guildConfig.roles[permname]]) // get the role ID of the perm
			.map((permname): [string, string | undefined] => [
				permname[0],
				interaction.guild.roles.cache.get(permname[1])?.name,
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
				interaction.guild,
				`The following roles are not set on the guild config: \`${nonexistentRoles.join(
					"`, `"
				)}\``
			)
		return interaction.reply(
			`You need the following roles to execute this command: \`${roles.join(
				"`, `"
			)}\``
		)
	}

	// the user now has any sufficient roles, so the command can be ran
	try {
		return await command.execute({
			interaction,
			client,
			guildConfig,
			filters,
		})
	} catch (e) {
		const message = "Something went wrong... Please try again later!";
		if (interaction.deferred || interaction.replied)
			interaction.editReply(message)
		else interaction.reply(message)

		throw e
	}
}
