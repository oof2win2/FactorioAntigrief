/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
	preset: "ts-jest/presets/default-esm", // or other ESM presets
	globals: {
		"ts-jest": {
			useESM: true,
			tsconfig: "tsconfig.test.json"
		},
	},
	moduleNameMapper: {
		"^(\\.{1,2}/.*)\\.js$": "$1",
	},
	transform: {},
	setupFilesAfterEnv: [ "./test/prepareTest.ts" ],
	transformIgnorePatterns: [
		"node_modules/(?!(@typegoose/typegoose|dotenv|crypto-random-string))"
	]
}