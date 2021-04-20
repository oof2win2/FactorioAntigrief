module.exports = {
    apps: [{
        name: 'fagc-master-bot',
        script: './index.js',
        env: {
            "NODE_ENV": "production"
        },
        cwd: "./src"
    }]
}
