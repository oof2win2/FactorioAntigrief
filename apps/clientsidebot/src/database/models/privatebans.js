const Sequelize = require("sequelize")

module.exports = (sequelize) => {
	const Model = sequelize.define("privatebans", {
		id: {
			type: Sequelize.INTEGER,
			unique: true,
			primaryKey: true,
			autoIncrement: true,
		},
		username: {
			type: Sequelize.STRING,
			allowNull: false
		},
		message: {
			type: Sequelize.STRING,
		},
		bannedBy: {
			type: Sequelize.STRING,
			allowNull: false
		}
	})
	return Model
}