const globalConfig = require("../../utils/globalconfig")

module.exports = async (client, message) => {
    const prefix = globalConfig.config.prefix
    let args = message.content.slice(prefix.length).trim().split(/ +/g);
    let cmd = args.shift().toLowerCase();
    if (message.author.bot) return;

    for (i = 0; i < args.length; i++)
        if (args[i] === '||')
            args = args.slice(0, i);

    if (message.content.startsWith(prefix)) {
        let commandfile = client.commands.get(cmd) || client.commands.get(client.aliases.get(cmd));
        if (commandfile) commandfile.run(client, message, args);
        return
    }
};
