const ConfigModel = require("../../database/schemas/config")
module.exports = class {
    constructor(client) {
        this.client = client
    }
    async run (message) {
        if (message.author.bot) return;
        const prefix = this.client.config.prefix
        if (!message.content.startsWith(prefix)) return

        const client = this.client

        let args = message.content.slice(prefix.length).trim().split(/ +/g)
        let command = args.shift().toLowerCase()
        let cmd = client.commands.get(command) || client.commands.get(client.aliases.get(command))
        if (!cmd) return message.channel.send(`\`${prefix}${command}\` is not a valid command! Use \`fagc!help\` to view commands`)

        let guildConfig = await ConfigModel.findOne({ guildid: message.guild.id })

        if (message.guild) {
            let neededPermissions = [];
            if (!cmd.conf.botPermissions.includes("EMBED_LINKS"))
                cmd.conf.botPermissions.push("EMBED_LINKS")

            // bot permissions
            cmd.conf.botPermissions.forEach((perm) => {
                if (!message.channel.permissionsFor(message.guild.me).has(perm))
                    neededPermissions.push(perm)
            })
            if (neededPermissions.length > 0)
                return message.channel.send(`I need the following permissions to execute this command: ${neededPermissions.map((p) => `\`${p}\``).join(", ")}`);

            // user permissions
            neededPermissions = [];
            cmd.conf.memberPermissions.forEach((perm) => {
                if (!message.channel.permissionsFor(message.member).has(perm))
                    neededPermissions.push(perm)
            })
            if (neededPermissions.length > 0)
                return message.channel.send(`You need the following permissions to execute this command: ${neededPermissions.map((p) => `\`${p}\``).join(", ")}`);

            if (!message.channel.nsfw && cmd.conf.nsfw)
                return message.channel.send("You must execute this command in a channel that allows NSFW!");
        }

        if (!cmd.conf.enabled)
            return message.channel.send("This command is currently disabled!")
        if (cmd.conf.ownerOnly && message.author.id !== client.config.owner.id)
            return message.channel.send(`Only the owner of ${this.client.user.username} can run this commands!`);

        const rate = this.client.checkTimeout(message.author.id, cmd.conf.cooldown)
        if (rate && !this.client.config.adminIDs.includes(message.author.id)) return message.channel.send("You're too fast!")
        this.client.RateLimit.set(message.author.id, Date.now())
        
        try {
            cmd.run(message, args, guildConfig)
        } catch (e) {
            console.error(e);
            return message.channel.send("Something went wrong... Please try again later!");
        }
    }
}