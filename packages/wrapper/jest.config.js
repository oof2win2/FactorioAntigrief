/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
	preset: "ts-jest",
	globals: {
		"ts-jest": {
			isolatedModules: true,
			tsconfig: "tsconfig.test.json"
		}
	},
	maxWorkers: 1,
}
