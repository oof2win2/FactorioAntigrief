const {saveGlobalConfig} = require("../../utils/globalconfig")
module.exports = (client) => {
    console.log(`${client.user.username} is invalidated: ${new Date().toString().slice(4, 24)}`)
    saveGlobalConfig()
};
process.on('SIGINT', () => {
    saveGlobalConfig()
    console.log("Saving global config before exit.")
    process.exit()
})