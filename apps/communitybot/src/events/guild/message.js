const { prefix } = require("../../config.json")
const { moderatorrole } = require("../../config.json")

module.exports = async (client, message) => {
    let args = message.content.slice(prefix.length).trim().split(/ +/g);
    let cmd = args.shift().toLowerCase();
    if (message.author.bot) return;

    for (i = 0; i < args.length; i++)
        if (args[i] === '||')
            args = args.slice(0, i);

    if (message.content.startsWith(prefix)) {
        let commandfile = client.commands.get(cmd) || client.commands.get(client.aliases.get(cmd))
        if (commandfile) { 
            const authRoles = message.member.roles.cache;
            if (commandfile.config.accessibility === "Member")
                commandfile.run(client, message, args)
            if (commandfile.config.accessibility === "Moderator") {
                if (authRoles.some((r) => r.id === moderatorrole))
                    commandfile.run(client, message, args)
                else if (message.guild.member(message.author).hasPermission('ADMINISTRATOR'))
                    commandfile.run(client, message, args)
                else
                    message.reply("Insufficient permissions :P")
            }
        }
        return
    }
};
