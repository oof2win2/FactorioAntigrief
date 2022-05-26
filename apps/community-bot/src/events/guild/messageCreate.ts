import { Message } from "discord.js"
import FAGCBot from "../../base/fagcbot"
import { afterJoinGuild, sendToGuild } from "../../utils/functions"

export default async (client: FAGCBot, message: Message) => {
	if (message.author.bot) return
	if (!message.inGuild()) return
	const prefix = client.env.BOTPREFIX
	if (!message.content.startsWith(prefix)) return

	const args = message.content.slice(prefix.length).split(/ +/g)
	const cmd = args.shift()
	if (!cmd) return message.reply("Invalid command!")

	const command =
		client.commands.get(cmd) ||
		client.commands.get(client.aliases.get(cmd) || "")
	if (!command) return message.reply("Invalid command!")

	// TODO: add user to rate limit

	// this temp var is required due to TS being TS
	// fetch the guild config for the guild, or create one if it doesn't exist yet
	let tmpGuildConfig = await client.fagc.communities.fetchGuildConfigMaster({
		guildId: message.guild.id,
	})
	if (!tmpGuildConfig) {
		tmpGuildConfig = await client.fagc.communities.createGuildConfig({
			guildId: message.guild.id,
		})
		// this creates a guild config if it doesn't exist yet, so it runs after
		afterJoinGuild(message.guild, client)
	}
	const guildConfig = tmpGuildConfig

	// check if the command requires api key
	if (command.requiresApikey && !guildConfig.apikey)
		return message.channel.send(
			`${client.config.emotes.warn} API key must be set for use of this command`
		)

	const filters = command.fetchFilters
		? await client.fagc.communities.getFiltersById({
				id: guildConfig.filterObjectId,
		  })
		: null
	if (!filters && command.fetchFilters)
		return message.channel.send(
			`${client.emotes.error} An error occured whilst fetching your filters`
		)

	// if command doesnt require guild config (like help, ping etc), it can be ran
	if (!command.requiresRoles) {
		try {
			return await command.run({
				message,
				args,
				client,
				guildConfig,
				filters,
			})
		} catch (e) {
			message.channel.send("An error occured while running this command!")
			throw e
		}
	}

	// if any of the roles are not present on the guild config, they must be filled first
	if (
		command.name !== "setpermissions" &&
		(!guildConfig.roles.reports ||
			!guildConfig.roles.setCommunities ||
			!guildConfig.roles.setConfig ||
			!guildConfig.roles.setCategories ||
			!guildConfig.roles.webhooks)
	)
		return message.reply(
			"You need to run the setup command and set all roles before you can run any other commands!"
		)

	// check which roles the user doesnt have
	const doesntHaveRoles = command.requiredPermissions.filter((permname) => {
		const roleid = guildConfig.roles[permname] // get the role which has this perm
		return !message.member?.roles.cache.has(roleid) // if the user does not have the role, return true to keep it in the array
	})
	// if the user doesnt have any of the roles, is not the guild owner, or has the ADMINISTRATOR, return
	if (
		doesntHaveRoles.length > 0 &&
		message.guild.ownerId !== message.author.id &&
		!message.member!.permissions.has("ADMINISTRATOR")
	) {
		// list of roles that are set on the guild config but have since been deleted
		const nonexistentRoles: string[] = []
		const roles = doesntHaveRoles
			.map((permname) => [permname, guildConfig.roles[permname]]) // get the role ID of the perm
			.map((permname): [string, string | undefined] => [
				permname[0],
				message.guild.roles.cache.get(permname[1])?.name,
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
				message.guild,
				`The following roles are not set on the guild config: \`${nonexistentRoles.join(
					"`, `"
				)}\``
			)
		return message.reply(
			`You need the following roles to execute this command: \`${roles.join(
				"`, `"
			)}\``
		)
	}

	// the user now has any sufficient roles, so the command can be ran
	try {
		return await command.run({
			message,
			args,
			client,
			guildConfig,
			filters,
		})
	} catch (e) {
		message.reply("Something went wrong... Please try again later!")
		throw e
	}
}
