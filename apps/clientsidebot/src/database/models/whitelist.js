const Sequelize = require("sequelize")

module.exports = (sequelize) => {
	const Model = sequelize.define("whitelist", {
		id: {
			type: Sequelize.NUMBER,
			unique: true,
		},
		username: {
			type: Sequelize.STRING,
			allowNull: false
		},
		whitelistedBy: {
			type: Sequelize.STRING,
			allowNull: false
		}
	})
	return Model
}