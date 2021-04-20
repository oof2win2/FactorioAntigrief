const { prefix } = require("../../../config.json")
const ConfigModel = require("../../database/schemas/config")

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
            switch (commandfile.config.accessibility) {
                case "Member":
                    commandfile.run(client, message, args)
                    break
                case "Moderator":
                    const config = await ConfigModel.findOne({guildid: message.guild.id})
                    if (authRoles.some((r) => r.id === config.moderatorroleId))
                        commandfile.run(client, message, args)
                    else if (message.guild.member(message.author).hasPermission('ADMINISTRATOR'))
                        commandfile.run(client, message, args)
                    else
                        message.reply("Insufficient permissions :P")
                    break
                case "Administrator":
                    if (message.guild.member(message.author).hasPermission('ADMINISTRATOR'))
                        commandfile.run(client, message, args)
                    else
                        message.reply("Insufficient permissions :P")
                    break
                default:
                    message.reply("Wrong accessibility. Command not run")
            }
        }
        return
    }
};
