module.exports = async (client) => {
    client.logger.log(`${client.user.username} is invalidated: ${new Date().toString().slice(4, 24)}`, "error")
}