module.exports = {
    apps: [{
      name: 'fagc-discord-bot',
      script: './dist/index.js',
      env: {
        "NODE_ENV": "production"
      }  
    }]
}