
var mongoose = require("mongoose");

//SCHEMA SETUP
var tokenSchema = new mongoose.Schema({
	_userId: {type: Number, required: true},
	token: {type: String, required: true},
	createdAt: {type: Date, required: true, default: Date.now, expires: 43200}
})

module.exports = mongoose.model("Token", tokenSchema);