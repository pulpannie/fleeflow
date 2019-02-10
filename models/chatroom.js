var mongoose = require("mongoose");

//SCHEMA SETUP
var chatroomSchema = new mongoose.Schema({
	messages: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: "Message"
	}]
})

module.exports = mongoose.model("Chatroom", chatroomSchema);