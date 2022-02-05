module.exports = {
    apps: [{
        name: 'fagc-discord-bot',
        script: './src/index.js',
        env: {
            "NODE_ENV": "production"
        },
        cwd: "./src"
    }]
}