const mongoose = require("mongoose")

const ViolationSchema = new mongoose.Schema({
    playername: String,
    communityname: String,
    broken_rule: mongoose.SchemaTypes.ObjectId,
    proof: String,
    description: String,
    automated: Boolean,
    violated_time: Date,
    admin_name: String,
})

module.exports = mongoose.model('Violations', ViolationSchema)