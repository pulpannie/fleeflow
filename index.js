'use strict';

var express = require('express'),
	app = express(),
	http = require('http'),
	server = http.createServer(app),
	io = require('socket.io')({
		transports : ["xhr-polling"]}),
	io = io.listen(server),
	mysql = require("mysql"),
	mongoose = require("mongoose"),
	passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy,
	bcrypt = require('bcrypt'),
	flash = require('connect-flash'),
	bodyParser = require("body-parser"),
	session = require("express-session"),
	cookieParser = require("cookie-parser"),
	Message = require("./models/message"),
	Chatroom = require("./models/chatroom");

mongoose.connect(process.env.DATABASEURL, {useNewUrlParser: true});

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static(__dirname + "/public"));
app.use(session({
	secret: "Annie loves Kirby!",
	saveUninitialized: false,
	cookie: {
		maxAge: 1000 * 60 * 60
	}
}));
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());


passport.serializeUser(function(user, done){
	done(null, user.id);
});

passport.deserializeUser(function(id, done){	
	done(null, id);
});


var connection = mysql.createConnection({
	host: "project.chb2v39hpwdl.ap-northeast-2.rds.amazonaws.com",
	port: "3306",
	user: "pulpannie",
	password: "tiger120308",
	database: "projectdb"
})
connection.connect();

app.get("/", function(req, res){
	
	if (req.user){
	connection.query('select * from users where id=?', [req.user], function(err, rows){
		console.log(JSON.stringify(rows[0]));
		if (err) throw err;
		res.render("index", {user: rows[0]});
	});
	} else {
		res.render("index", {user: 0});
	}
});

//really shit code, nestedhell but I gave it my best :(
app.post("/", function(req, res){
	var chatroomId;
	var chatgroupId;
	Chatroom.create({name: req.body.name}, function(err, newlyCreated){
		if(err){
			console.log(err);
		}
		console.log("chatroomid is" + newlyCreated._id);
		chatroomId = newlyCreated._id; 	
		connection.query('INSERT INTO chatgroups set ?', {user_id: req.user}, function(err, result){
		if(err) throw err;
		chatgroupId =result.insertId;
		var sql = {id:chatroomId, name: req.body.name, king_user_id: req.user, group_id: chatgroupId};
		console.log("hi" + chatroomId);
		connection.query('INSERT INTO chatrooms set ?', sql, function(err, rows){
		if(err) console.log("wow" + err);
		res.redirect("/");
	})	// get id of chatgroup mysql table
	})//get id of Chatroom mongoose collection
	})

})

app.get("/new", isLoggedIn, function(req, res){
	res.render("new");
})

app.get('/search', function(req, res){
	// var search = createSearch(req.query);
	connection.query('SELECT * FROM chatrooms WHERE name LIKE "%' + req.query.searchText + '%"', function(err, rows){
		if (err) console.log("connection error is" + JSON.stringify(err));
		else if (rows.length == 0) {
			return console.log("rows:" + rows[0] + " " + Error);
		}
		res.render("search", {searched: req.query.searchText, chatrooms: rows});
	});
});



app.get("/login", function(req, res){
	var msg;
	var errMsg = req.flash('error');
	if (errMsg) {msg = errMsg; console.log(msg);}
	res.render("login", {'message' : msg});
})

app.post("/login", passport.authenticate('login-local', {
	successRedirect: '/',
	failureRedirect: '/login',
	failureFlash: true
}));

passport.use('login-local', new LocalStrategy({
	usernameField: 'email',
	passwordField: 'password',
	passReqToCallback: true
},
	function(req, email, password, done) {
		connection.query('select * from users where email=?', [email], function(err, rows){
			if(err) return done(err);

			if (rows.length){
				bcrypt.compare(password, rows[0].password, function(err, res){
					if (res){
						return done(null, rows[0]);
					}
					else {
						return done(null, false, {'message' : 'Your password is incorrect'});
					}
				});
			}
			else { 
				return done(null, false, {'message' : 'There is no existing account'});
			}
		})
	}
))



app.get("/join", function(req, res){
	var msg;
	var errMsg = req.flash('error');
	if (errMsg) {msg = errMsg; console.log(errMsg);}
	res.render("register", {'message' : msg});
})

app.post("/join", passport.authenticate('join-local', {
	successRedirect: '/',
	failureRedirect: '/join',
	failureFlash: true
}));

passport.use('join-local', new LocalStrategy({
	usernameField: 'email',
	passwordField: 'password',
	passReqToCallback: true
},
	function(req, email, password, done){
		connection.query('select * from users where email=?', [email], function (err, rows){
			if (err) { return done(err);}

			if (rows.length) {
				return done(null, false, {message: 'This email already has an account'});
			}
			else {
				bcrypt.hash(password, 10, function(err, hash){
					var sql = {email: email, password: hash, nickname: req.body.nickname};
					connection.query('insert into users set ?', sql, function (err, rows){
						if (err) throw err;
						return done(null, {'email': email, 'id': rows.insertId});
					})
				})
			}
		})
	}
))


io.on('connection', function(socket){
	socket.on('chat message', function(msg){
		io.emit('chat message', msg);
	})
})

app.get('/chatroom/:id', isLoggedIn, function(req, res){
	Chatroom.findById(req.params.id).populate("messages").exec(function(err, foundChatroom){
		if(err){
			console.log(err);
		} else {
			console.log(foundChatroom);
			connection.query('select nickname from users where id=?',[req.user], function(err, rows){
			res.render("chatroom", {user: rows[0], chatroom: foundChatroom})
			})
		}
	})
})
app.post('/chatroom/:id', function(req, res){
	console.log("hi");
	Chatroom.findById(req.params.id, function(err, chatroom){
		if(err){
			console.log(err);
			res.redirect("/");
		} else {
			Message.create(req.body, function(err, message){
				if (err){
					console.log(err);
				} else {
					connection.query('select nickname from users where id=?',[req.user], function(err, rows){
						message.nickname = rows[0].nickname;
						message.save();
						chatroom.messages.push(message);
						chatroom.save();
					})
				}
			})
		}
	})
})

function isLoggedIn(req, res, next){
	if (req.isAuthenticated()){
		next();
	} else {
		res.redirect("/login");
	}
}

// function createSearch(queries){

// 	var findPost = {};
// 	var postQueries = [];
// 	postQueries.push({ body: { $regex : new RegExp(queries.searchText, "i")}});
// 	if (postQueries.length > 0) findPost = {$or:postQueries};
// 	return { searchText: queries.searchText, findPost: findPost};
// }
// connection.query('SELECT name FROM chatrooms WHERE name LIKE "%' + req.query.key + '%"',
// 		function(err, rows, fields){
// 			if(err) console.log("ajax error is" + JSON.stringify(err));
// 			var data= [];
// 			for(var i=0;i<rows.length;i++)
//       {
//         data.push(rows[i].name);
//       }
// 	});


server.listen(process.env.PORT || 8080, function(){
	console.log("Server started!");
})
