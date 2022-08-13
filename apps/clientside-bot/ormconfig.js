module.exports = {
	type: "better-sqlite3",
	database: `${__dirname}/db.sqlite`,
	entities: [`${__dirname}/dist/database/*{.js,.ts}`],
	migrations: [`${__dirname}/dist/migrations/*{.js,.ts}`],
	cli: {
		migrationsDir: `${__dirname}/src/migrations`,
	},
}
