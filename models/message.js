var mongoose = require("mongoose");

//SCHEMA SETUP
var messageSchema = new mongoose.Schema({
	typeOf: String,
	message: String,
	nickname: String,
	createdAt: {type: Date, default: Date.now}
});

module.exports = mongoose.model("Message", messageSchema);