const Sequelize = require("sequelize")

// Init DB
const sequelize = new Sequelize("database", "user", "password", {
	host: "localhost",
	dialect: "sqlite",
	logging: false,
	// SQLite only
	storage: "database.sqlite",
})

// Add models
const config = (require("./models/ConfigModel"))(sequelize)
const infochannels = (require("./models/infochannels"))(sequelize)
const syncedbans = (require("./models/syncedbans"))(sequelize)
const privatebans = (require("./models/privatebans"))(sequelize)

// when creating database, sync
// if you add models or edit existing models, run this file alone and force-sync the models you edited for the database to be correct
config.sync()
infochannels.sync()
syncedbans.sync()
privatebans.sync()

config.hasMany(infochannels)
infochannels.belongsTo(config)

module.exports = {
	Config: {
		config,
		infochannels,
	},
	Bans: {
		syncedbans,
		privatebans,
	},
	sequelize,
}