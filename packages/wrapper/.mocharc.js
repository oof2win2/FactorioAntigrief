module.exports = {
	reporter: "nyan",
	exit: true,
	require: ["ts-node/register", "mocha-steps"],
	spec: "./test/*.test.ts",
}
