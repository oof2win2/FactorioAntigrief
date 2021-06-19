const CommunityModel = require("./database/fagc/community")
const OffenseModel = require("./database/fagc/offense")
const RevocationModel = require("./database/fagc/revocation")
const RuleModel = require("./database/fagc/rule")
const ViolationModel = require("./database/fagc/report")

CommunityModel.find({}).then((communities) => {
	communities.forEach((community) => {
		community.save().then(() => console.log(`Updated Community ${community._id}`))
	})
})
OffenseModel.find({}).then(offenses => {
	offenses.forEach((offense) => {
		offense.save().then(() => console.log(`Updated Offense ${offense._id}`))
	})
})
RevocationModel.find({}).then(revoactions => {
	revoactions.forEach((revocation) => {
		revocation.save().then(() => console.log(`Updated Revoaction ${revocation._id}`))
	})
})
RuleModel.find({}).then(revoactions => {
	revoactions.forEach((revocation) => {
		revocation.save().then(() => console.log(`Updated Rule ${revocation._id}`))
	})
})
ViolationModel.find({}).then(revoactions => {
	revoactions.forEach((revocation) => {
		revocation.save().then(() => console.log(`Updated Violation ${revocation._id}`))
	})
})