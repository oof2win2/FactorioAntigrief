const { Client, Collection } = require("discord.js")
const path = require("path")
const fetch = require("node-fetch")
const strictUriEncode = require("strict-uri-encode")

class FAGCBot extends Client {
	constructor(options) {
		super(options)
        
		this.config = require("../../config")
		this.emotes = this.config.emotes

		// setup rate limit
		this.RateLimit = new Collection()


		this.commands = new Collection()
		this.aliases = new Collection()
		// ["commands", "aliases"].forEach(x => this[x] = new Collection());
		// ["command", "event"].forEach((x) => require(`../handlers/${x}`)(this));
		this.logger = require("../utils/logger")
	
		this.CachedCommunities = new Map()
		setInterval(() => this.CachedCommunities.clear(), 15*60*1000) // clear cache every 15 minutes
		this.CachedRules = new Map()
		setInterval(() => this.CachedRules.clear(), 15*60*1000)
	}
	/**
     * Check if a user has sent a command in the past X milliseconds
     * @param {String} uid - Discord user's ID snowflake
     * @param {Number} time - Time in ms to check
     * @returns {Boolean} True if the user has sent a command, false if they haven't
     */
	checkTimeout(uid, time) {
		const lastTime = this.RateLimit.get(uid)
		if (!lastTime) return false
		if (lastTime < Date.now() - time) return false
		return true
	}
	loadCommand(commandPath, commandName) { // load a command
		try {
			const props = new (require(`.${commandPath}${path.sep}${commandName}`))(this) // gets properties
			props.config.location = commandPath // finds location
			if (props.init) {
				props.init(this)
			}
			this.commands.set(props.help.name, props) // adds command to commands collection
			props.help.aliases.forEach((alias) => {
				this.aliases.set(alias, props.help.name) // adds command to alias collection
			})
			return false
		} catch (e) {
			return `Unable to load command ${commandName}: ${e}`
		}
	}
	async unloadCommand(commandPath, commandName) { // unload a command
		let command
		if (this.commands.has(commandName)) {
			command = this.commands.get(commandName)
		} else if (this.aliases.has(commandName)) {
			command = this.commands.get(this.aliases.get(commandName))
		}
		if (!command) {
			return `The command \`${commandName}\` doesn't seem to exist, nor is it an alias. Try again!`
		}
		if (command.shutdown) {
			await command.shutdown(this)
		}
		delete require.cache[require.resolve(`.${commandPath}${path.sep}${commandName}.js`)]
		return false
	}
	async getOrFetchCommunity (communityid) {
		const cachedCommunity = this.CachedCommunities.get(communityid)
		if (cachedCommunity) return cachedCommunity
		const community = this.CachedCommunities.set(communityid, fetch(`${this.config.apiurl}/communities/getid?id=${strictUriEncode(communityid)}`).then(c => c.json())).get(communityid)
		return community
	}
	async getOrFetchRule (ruleid) {
		const cachedRule = this.CachedRules.get(ruleid)
		if (cachedRule) return cachedRule
		const rule = this.CachedRules.set(ruleid, fetch(`${this.config.apiurl}/rules/getid?id=${strictUriEncode(ruleid)}`).then((c) => c.json())).get(ruleid)
		return rule
	}
}
module.exports = FAGCBot