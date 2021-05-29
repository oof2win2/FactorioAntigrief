import * as path from "path"
// eslint-disable-next-line no-unused-vars
import FAGCBot from "./fagcbot"

interface commandConfig {
	enabled: boolean,
	memberPermissions: string[],
	botPermissions: string[],
	ownerOnly: boolean,
	cooldown: number,
	requiredConfig: boolean,
	customPermissions: string[]
}
interface commandHelp {
	name: string,
	category: string,
	aliases: string[],
	description: string | boolean,
	usage: string | boolean,
	examples: string[] | boolean,
}

class Command {
	public client: FAGCBot
	public config: commandConfig
	public help: commandHelp
	public run: Function
	constructor(client, {
		name = null, // name of command
		description = false, // description
		usage = "", // usage of command, command and prefix included
		examples = [], // examples, command and prefix **not** included
		dirname = "potato", // where the command is
		enabled = true, // if its enabled
		aliases = new Array(), // an array of aliases
		botPermissions = new Array(), // an array of bot permissions, checked before command is run
		memberPermissions = new Array(), // an array of user permissions, checked before command is run
		ownerOnly = false, // owner only, checked before command is run
		cooldown = 5000, // gap between commands
		requiredConfig = false, // if guild config is required or not
		customPermissions = [] // custom role permissions
	}) {
		const category = (dirname ? dirname.split(path.sep)[(dirname.split("/")).length - 1] : "Other") // what command category the commands live in
		this.client = client // bind client to this.client
		this.config = { enabled, memberPermissions, botPermissions, ownerOnly, cooldown, requiredConfig, customPermissions } // some config options
		this.help = { name, category, aliases, description, usage, examples } // used for help command
	}
}

export default Command
module.exports = Command