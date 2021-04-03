const { botprefix, modroleid } = require("../../../config.json");


module.exports = async (client, message) => {
    let args = message.content.slice(botprefix.length).trim().split(/ +/g);
    let cmd = args.shift().toLowerCase();
    if (message.author.bot) return;
    
    if (message.member.roles.cache.some(r => r.id === modroleid)) {
        if (message.content.startsWith(botprefix)) {
            let commandfile = client.commands.get(cmd) || client.commands.get(client.aliases.get(cmd));
            if (commandfile) commandfile.run(client, message, args);
            return;
        }
    }
};
