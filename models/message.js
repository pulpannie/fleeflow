var mongoose = require("mongoose");

//SCHEMA SETUP
var messageSchema = new mongoose.Schema({
	message: String,
	nickname: String
});

module.exports = mongoose.model("Message", messageSchema);