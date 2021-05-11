const path = require("path");

module.exports = class Command {
    constructor(client, {
        name = null, // name of command
        description = false, // description
        usage = false, // usage of command, command and prefix included
        examples = false, // examples, command and prefix **not** included
        dirname = false, // where the command is
        enabled = true, // if its enabled
        guildOnly = false, // if you can only use it in DMs
        aliases = new Array(), // an array of aliases
        botPermissions = new Array(), // an array of bot permissions, checked before command is run
        memberPermissions = new Array(), // an array of user permissions, checked before command is run
        ownerOnly = false, // owner only, checked before command is run
        cooldown = 5000, // gap between commands
        requiredConfig = false, // if guild config is required or not
    }) {
        const category = (dirname ? dirname.split(path.sep)[parseInt(dirname.split(path.sep).length - 1, 10)] : "Other"); // what command category the commands live in
        this.client = client; // bind client to this.client
        this.config = { enabled, guildOnly, memberPermissions, botPermissions, ownerOnly, cooldown, requiredConfig }; // some config options
        this.help = { name, category, aliases, description, usage, examples }; // used for help command
    }
};
