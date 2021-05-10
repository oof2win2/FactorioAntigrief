module.exports = class {
    constructor(client) {
        this.client = client
    }
    async run () {
        this.client.logger.log(`${client.user.username} is invalidated: ${new Date().toString().slice(4, 24)}`, "error")
    }
}