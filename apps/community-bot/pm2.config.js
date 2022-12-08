module.exports = {
	apps: [
		{
			name: "fdgl-discord-bot",
			script: "./src/index.js",
			env: {
				NODE_ENV: "production",
			},
		},
	],
}
