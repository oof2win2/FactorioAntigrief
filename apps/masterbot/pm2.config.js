module.exports = {
    apps: [{
        name: 'fagc-master-bot',
        script: './src/index.js',
        env: {
            "NODE_ENV": "production"
        },
        cwd: "./src"
    }]
}
