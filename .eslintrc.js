module.exports = {
	env: {
		commonjs: true,
		es2021: true,
		node: true,
	},
	extends: ["eslint:recommended", "prettier"],
	parserOptions: {
		ecmaVersion: 12,
	},
	rules: {
		indent: ["error", "tab"],
		"linebreak-style": ["error", "unix"],
		quotes: ["error", "double"],
		semi: ["error", "never"],
	},
}
