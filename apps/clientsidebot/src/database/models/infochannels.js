const Sequelize = require("sequelize")

module.exports = (sequelize) => {
	const Model = sequelize.define("infochannels", {
		id: {
			type: Sequelize.INTEGER,
			unique: true,
			primaryKey: true,
			autoIncrement: true,
		},
		channelid: Sequelize.STRING,
		configId: {
			type: Sequelize.INTEGER,
			allowNull: false
		}
	})
	return Model
}