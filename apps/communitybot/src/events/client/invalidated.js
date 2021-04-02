module.exports = (client) => {
    console.error(`${client.user.username} is invalidated: ${new Date().toString().slice(4, 24)}`)
}