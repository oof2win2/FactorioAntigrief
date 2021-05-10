module.exports = class {
    constructor(client) {
        this.client = client
    }
    async run() {
        this.client.logger.log(`${this.client.user.username} is online: ${new Date().toString().slice(4, 24)}`)
        let activities = [
            `${this.client.guilds.cache.size} servers!`,
            `${this.client.channels.cache.size} channels!`,
            `${this.client.users.cache.size} users!`,
        ],
            i = 0;
        setInterval(
            () =>
                this.client.user.setActivity(
                    `${this.client.config.prefix}help | ${activities[i++ % activities.length]}`,
                    { type: "WATCHING" }
                ),
            15000
        );
    }
}
