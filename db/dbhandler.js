//dummy file

const mysql = require('mysql');

let connection = {};
const createConnection = function() {
    connection = mysql.createConnection(
        {
            host     : '',
            user     : '',
            password : '',
            database : ''
        }
    );
    return connection;
};

////UPDATED 05/05/2019
let str_createUsers = `create table if not exists users(
    user_id int NOT NULL AUTO_INCREMENT,
    password varchar(100) NOT NULL,
    nickname varchar(20) NOT NULL,
    email varchar(45) NOT NULL,
    gender varchar(20) NOT NULL,
    age int NOT NULL,
    profile_picture varchar(200) NOT NULL default 'https://fleeflow.s3.ap-northeast-2.amazonaws.com/profile/profile_picture.png',
    description varchar(200) NOT NULL default '',
    verified tinyint(1) NOT NULL default 0,
    PRIMARY KEY (user_id)
    )`;

    let str_createGroups = `create table if not exists chatgroups (
    chatroom_id varchar(50) NOT NULL,
    user_id int NOT NULL,
    PRIMARY KEY (chatroom_id, user_id),
    FOREIGN KEY (chatroom_id) REFERENCES chatrooms(chatroom_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    )`;

    let str_createChatrooms = `create table if not exists chatrooms(
    chatroom_id varchar(50) NOT NULL,
    chatroom_name varchar(100) NOT NULL,
    king_user_id int NOT NULL,
    password_ver tinyint(1) NOT NULL default 0,
    background_ver tinyint(1) NOT NULL default 0,
    PRIMARY KEY (chatroom_id),
    FOREIGN KEY (king_user_id) REFERENCES users(user_id) ON DELETE CASCADE
    )`;

    let str_createChatroomPassword = `create table if not exists chatroompasswords(
    chatroom_id varchar(50) NOT NULL,
    password varchar(20) NOT NULL,
    PRIMARY KEY (chatroom_id),
    FOREIGN KEY (chatroom_id) REFERENCES chatrooms(chatroom_id) ON DELETE CASCADE)`;

    let str_createBackground = `create table if not exists chatroombackgrounds(
    chatroom_id varchar(50) NOT NULL,
    background varchar(100) NOT NULL,
    PRIMARY KEY (chatroom_id),
    FOREIGN KEY (chatroom_id) REFERENCES chatrooms(chatroom_id) ON DELETE CASCADE
    )`;

create table if not exists `users`(
    `user_id` int NOT NULL AUTO_INCREMENT,
    `password` varchar(100) NOT NULL,
    `nickname` varchar(20) NOT NULL,
    `email` varchar(45) NOT NULL,
    `authenticated` tinyint(1) NOT NULL default 0,
    PRIMARY KEY (`user_id`)
 );
		
create table if not exists `chatgroups` (
    `id` int NOT NULL AUTO_INCREMENT,
    `user_id` int NOT NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`user_id`) REFERENCES users(`id`) ON DELETE CASCADE
    );
	
create table if not exists `chatrooms`(
    `id` varchar(50) NOT NULL,
	`name` varchar(100) NOT NULL,
    `king_user_id` int NOT NULL,
    `password_ver` tinyint(1) NOT NULL default 0,
    `background_ver` tinyint(1) NOT NULL default 0,
    `group_id` int NOT NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`king_user_id`) REFERENCES users(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`group_id`) REFERENCES chatgroups(`id`) ON DELETE CASCADE
    );
	
	create table if not exists `chatroompasswords`(
    `chatroom_id` varchar(50) NOT NULL,
    `password` varchar(20) NOT NULL,
    PRIMARY KEY (`chatroom_id`),
    FOREIGN KEY (`chatroom_id`) REFERENCES chatrooms(`id`) ON DELETE CASCADE
	);
		
	create table if not exists `backgrounds`(
    `chatroom_id` varchar(50) NOT NULL,
    `background` varchar(100) NOT NULL,
    PRIMARY KEY (`chatroom_id`),
    FOREIGN KEY (`chatroom_id`) REFERENCES chatrooms(`id`) ON DELETE CASCADE
    );


module.exports = {

	createUsers: function(){
		const conn = createConnection();
		conn.connect();

		conn.query(str_createUsers, function(err){
			if (err){
				console.log(err);
			}
		})
		conn.end();
	},

	createGroups: function(){
		const conn = createConnection();
		conn.connect();

		conn.query(str_createGroups, function(err){
			if (err){
				console.log(err);
			}
		})
		conn.end();
	},

	createChatrooms: function(){
		const conn = createConnection();
		conn.connect();

		conn.query(str_createChatrooms, function(err){
			if(err){
				console.log(err);
			}
		})
		conn.end();
	},

	createChatroomPassword: function(){
		const conn = createConnection();
		conn.connect();

		conn.query(str_createChatroomPassword, function(err){
			if (err){
				console.log(err);
			}
		})
		conn.end();
	},

	createBackground: function(){
		const conn = createConnection();
		conn.connect();

		conn.query(str_createBackground, function(err){
			if (err){
				console.log(err);
			}
		})
		conn.end();
	}
}