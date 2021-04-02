module.exports = {
    apps: [{
        name: 'fagc-backend',
        script: './src/bin/www',
        env: {
            "NODE_ENV": "production"
        },
        cwd: "./src"
    }]
}