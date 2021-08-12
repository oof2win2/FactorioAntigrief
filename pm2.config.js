module.exports = {
	apps: [{
		name: "fagc-backend",
		script: "npm",
		args: "pm2",
		env: {
			"NODE_ENV": "production"
		},
	}]
}