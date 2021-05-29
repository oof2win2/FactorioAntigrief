const Sequelize = require("sequelize")

module.exports = (sequelize) => {
	const Model = sequelize.define("config", {
		id: {
			type: Sequelize.INTEGER,
			unique: true,
			primaryKey: true,
			autoIncrement: true,
		},
		onViolation: {
			type: Sequelize.ENUM("info", "jail", "ban"),
			defaultValue: "info",
			allowNull: false,
		},
		onRevocation: {
			type: Sequelize.ENUM("info", "keepBanned", "removeBan"),
			defaultValue: "info",
			allowNull: false,
		},
		banRole: {
			type: Sequelize.STRING,
			allowNull: false
		},
		configRole: {
			type: Sequelize.STRING,
			allowNull: false
		},
		notificationsRole: {
			type: Sequelize.STRING,
			allowNull: false
		},
		guildid: {
			type: Sequelize.STRING,
			allowNull: false,
		}
	})
	return Model
}