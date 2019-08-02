var mongoose = require("mongoose");

//SCHEMA SETUP
var messageSchema = new mongoose.Schema({
	typeOf: String,
	message: String,
	nickname: String
});

module.exports = mongoose.model("Message", messageSchema);