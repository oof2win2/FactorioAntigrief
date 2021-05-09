const { Client, Collection } = require("discord.js")

class FAGCBot extends Client {
    constructor(options) {
        super(options)
        
        this.config = require("../../config.json")

        // setup rate limit
        this.RateLimit = new Collection();

        // load commands
        ["commands", "aliases"].forEach(x => this[x] = new Collection());
        ["command", "event"].forEach((x) => require(`../handlers/${x}`)(this));
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
}
module.exports = FAGCBot