module.exports = {
	type: "better-sqlite3",
	database: `${__dirname}/db.sqlite`,
	entities: [`${__dirname}/dist/database/*.js`],
}
