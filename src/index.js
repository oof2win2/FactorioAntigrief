/**
 * @file Index file, opening file for the bot. The bot logs in here, loads the commands, events and handlers.
 */
const mongoose = require("mongoose")
const util = require("util")
const fs = require("fs")
const readdir = util.promisify(fs.readdir)


process.chdir(__dirname)

require("./utils/extenders");
// This enables FAGCBot to access the extenders in any part of the codebase

const FAGCBot = require("./base/fagcbot")
const client = new FAGCBot();


const init = async () => {
    // Loads commands
    const dirs = await readdir("./commands/");
    // Reads the commands directory
    dirs.forEach(async (dir) => {
        const cmds = await readdir(`./commands/${dir}/`);
        // gets every dir inside commands
        cmds.filter(cmd => cmd.split(".").pop() === "js").forEach(cmd => {
            const res = client.loadCommand(`./commands/${dir}`, cmd);
            // loads each command
            if (res) client.logger.log(res, "error");
            // if there's an error, log it
            else client.logger.log(`Command ${cmd} loaded`, "debug")
        });
    });

    // Loads events
    const evtDirs = await readdir("./events/");
    // reads the events dir
    evtDirs.forEach(async dir => {
        const evts = await readdir(`./events/${dir}/`);
        // gets every dir inside events
        evts.forEach(evt => {
            const evtName = evt.split(".")[0];
            // splits the event and gets first part
            const event = new (require(`./events/${dir}/${evt}`))(client);
            // binds client to the event
            client.on(evtName, (...args) => event.run(...args));
            delete require.cache[require.resolve(`./events/${dir}/${evt}`)];
            // on event, call it
        })
    })
    
    // log in to discord
    client.login(client.config.token)

    mongoose.connect(client.config.mongoURI, client.config.dbOptions).then(() => {
        client.logger.log("Database connected", "log");
    }).catch(err => client.logger.log("Error connecting to database. Error:" + err, "error"));
};

init()

const PrometheusServer = require("./base/Prometheus")