const Sequelize = require("sequelize")

module.exports = (sequelize) => {
	const Model = sequelize.define("syncedbans", {
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
		violationid: {
			type: Sequelize.STRING,
			allowNull: false
		}
	})
	return Model
}