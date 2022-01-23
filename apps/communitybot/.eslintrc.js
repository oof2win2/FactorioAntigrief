/* eslint-disable array-bracket-spacing */

module.exports = {
	env: {
		commonjs: true,
		es2021: true,
		node: true,
	},
	parser: "@typescript-eslint/parser",
	extends: [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended",
		"prettier",
	],
	parserOptions: {
		ecmaVersion: 12,
	},
	rules: {
		indent: ["error", "tab"],
		"linebreak-style": ["error", "unix"],
		quotes: ["error", "double"],
		semi: ["error", "never"],
		"object-curly-spacing": ["error", "always"],
	},
}
