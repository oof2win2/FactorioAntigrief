module.exports = {
	apps: [{
		name: "fagc-backend",
		script: "./app.js",
		env: {
			"NODE_ENV": "production"
		},
		cwd: "./dist"
	}]
}