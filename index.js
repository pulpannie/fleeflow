'use strict';

var express = require('express'),
	app = express(),
	http = require('http'),
	server = http.createServer(app),
	io = require('socket.io')({
		transports : ["xhr-polling"], wsEngine: 'ws'}),
	io = io.listen(server),
	connection = require('./database'),
	mongoose = require("mongoose"),
	crypto = require("crypto"),
	nodemailer = require("nodemailer"),
	passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy,
	bcrypt = require('bcrypt'),
	flash = require('connect-flash'),
	bodyParser = require("body-parser"),
	session = require("express-session"),
	cookieParser = require("cookie-parser"),
	formidable = require("formidable"),
	async = require("async"),
	Upload = require('./service/UploadService'),
	Message = require("./models/message"),
	Chatroom = require("./models/chatroom"),
	Token = require("./models/token");

mongoose.connect(process.env.DATABASEURL, {useNewUrlParser: true});
process.setMaxListeners(0);

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static(__dirname + "/public"));
app.use(session({
	secret: "Annie loves Kirby!",
	saveUninitialized: true,
	resave: true,
	cookie: {
		maxAge: 1000 * 60 * 60
	}
}));
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());


passport.serializeUser(function(user, done){
	done(null, user.user_id);
});

passport.deserializeUser(function(user_id, done){	
	done(null, user_id);
});


//connect to nodemailer
let transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user:'fleeflow.official@gmail.com',
		pass: 'hello2019!'
	}
});




app.get("/", function(req, res){
	
	if (req.user){
	connection.query('select * from users where user_id=?', [req.user], function(err, rows){
		if (err) throw err;
		res.render("index", {user: rows[0]});
	});
	} else {
		res.render("index", {user: 0});
	}
});

//really shit code, callbackhell but I gave it my best :(
app.post("/", function(req, res){
	var chatroomId;
	var chatgroupId;
	Chatroom.create({name: req.body.name}, function(err, newlyCreated){
		if(err){
			console.log(err);
		}
		console.log("chatroomid is" + newlyCreated._id);
		chatroomId = newlyCreated._id; 	
		var sql = {chatroom_id:chatroomId, chatroom_name: req.body.name, king_user_id: req.user};
		connection.query('INSERT INTO chatrooms set ?', sql, function(err, rows){
			var chatgroup = {user_id: req.user, chatroom_id: chatroomId};
			connection.query('INSERT INTO chatgroups set ?', chatgroup, function(err){
				if(err) console.log(err);
			})
		res.redirect("/");
	})	// get id of chatgroup mysql table
	})//get id of Chatroom mongoose collection
})


app.get("/new", isLoggedIn, function(req, res){
	res.render("new");
})

app.get('/search', function(req, res){
	// var search = createSearch(req.query);
	connection.query('SELECT * FROM chatrooms WHERE chatroom_name LIKE "%' + req.query.searchText + '%"', function(err, rows){
		if (err) throw err;
		else {
		res.render("search", {searched: req.query.searchText, chatrooms: rows});
		}
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
	successRedirect: '/verification/request',
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
					var sql = {email: email, password: hash, nickname: req.body.nickname, gender: req.body.gender, age: req.body.age};
					connection.query('insert into users set ?', sql, function (err, rows){
						if (err) {
							throw err;
						}
						var token = new Token({_userId: rows.insertId, token: crypto.randomBytes(16).toString('hex')});
						console.log(token);
						//send the email
						var transporter = nodemailer.createTransport({service: 'gmail', auth: {user:'fleeflow.official@gmail.com', pass: 'hello2019!'}});
						var mailOptions = {from: 'fleeflow.official@gmail.com', to: email, subject: 'Account Verification Token', text:'Hello, please verify by clicking the link: \nhttp:\/\/'+req.headers.host + '\/verification\/' + token.token + '\/'+email+'.\n'};
						transporter.sendMail(mailOptions, function(err, info){
							if (err){
								throw err;
							} else {
								token.save();
								return done(null, {'email': email, 'user_id': rows.insertId});
							}
						})
					})
				})
			}
		})
	}
))

app.get("/verification/request", function(req, res){
	res.status(403).json('Verification email has been sent.')
})

app.get("/verification/:token/:email", VerificationController);

function VerificationController(req, res){
	connection.query("SELECT * FROM users where email='"+req.params.email+"'", function(err, rows){
		if (err){
			return res.status(404).json('Email not found');
		} else if (rows[0].verified){
			return res.status(202).json('Email Already Verified');
		} else {
			Token.findOne({
				_userId: rows[0].user_id,
				token: req.params.token
			}, function(err, foundToken){
				console.log(foundToken);
				if(foundToken){
					connection.query("UPDATE users SET verified=1 WHERE email='"+req.params.email+"'", function(err, row){
						if(err){
							return res.status(403).json('verification failed');
						}else{
							return res.status(403).json('Account has been verified');
						}
					})
				}
				else if (err){
					throw err;
				}
				else {
					return res.status(404).json('Token expired');
				}
			})
		}
	})
}

app.get('/profile', isLoggedIn, function(req, res){
	connection.query('select * from users where user_id=?',[req.user], function(err, rows){
		if(err){ throw err;
		} else {
			res.render("profile", {user: rows[0]});
		}
	});
});

app.post('/profile', function(req, res){
	console.log("POST PROFILE");
	var tasks = [
	function(callback){
		var form = new formidable.IncomingForm({
			encoding: 'utf-8',
			multiples: true,
			keepExtensions: false
		});
		form.parse(req, function(err, fields, files){
			if(files.img_file.size == 0){
				res.redirect("/profile")
				}
			else {
				console.log("2:");
				console.log(files);
				callback(err, files);
				}
			});
		},
		function(files, callback){
			Upload.s3profile(req, files, function(err, result){
				callback(err, result);
			});
		}
	];
		async.waterfall(tasks, function(err, result){
			if(err){
				console.log(err);
			}else{
				var tmp = "https://fleeflow.s3.ap-northeast-2.amazonaws.com/"+result;
				connection.query("UPDATE users set profile_picture='" + tmp + "' where user_id=?",[req.user], function(err){
					if (err){
						console.log("Error" + err);
					}
					console.log("WHY IS IT NOT WORKING")
					res.redirect("/profile")
				})
			}
		});
})

app.get('/logout', function(req, res){
	req.logout();
	res.redirect("/");
})



app.get('/chatroom/:id', isLoggedIn, function(req, res){
	console.log("1req.user first is" + req.user);
	Chatroom.findById(req.params.id).populate("messages").exec(function(err, foundChatroom){
		if(err){
			console.log(err);
		} else {
			connection.query('INSERT IGNORE INTO chatgroups set ?', {user_id: req.user, chatroom_id: req.params.id}, function(err){
				var chat_params_id= req.params.id;
				var sql = "SELECT * FROM users natural join chatrooms natural join chatgroups WHERE chatgroups.chatroom_id='" + req.params.id + "'";
				connection.query(sql, function(err, results){
					if(err){
					console.log("Error" + err);
					} else {
					connection.query('SELECT nickname FROM users WHERE users.user_id =' + req.user, function(err, rows){
						res.render("chatroom", {user: rows[0].nickname, roomData: results, chatroom: foundChatroom});
					})
				}
				})
			})
		}
	})
})

function messageCreate(req, data, type, chatroom, res){
	console.log("wow");
	var tmpMessage = new Message();
	// Message.create({message: data}, function(err, message){
		// if (err){
		// 	throw err;
		// } else {
			console.log("wow2")
			tmpMessage.typeOf = type;
			tmpMessage.message = data;
			console.log("req.user is" + req.user);
			connection.query('select nickname from users where user_id=?',[req.user], function(err, rows){
				if(err){
					throw err;
				}
				tmpMessage.nickname = rows[0].nickname;
				tmpMessage.save();
				console.log("message: ");
				console.log(tmpMessage);
				chatroom.messages.push(tmpMessage);
				chatroom.save();
				//접속된 모든 클라이언트한테 메세지를 전송한다.
				io.emit('chat message', tmpMessage);
				return tmpMessage;
			})
		// }
	// })
}


app.post('/chatroom/:id', function(req, res){
	Chatroom.findById(req.params.id, function(err, chatroom){
		if(err){
			console.log(err);
			res.redirect("/");
		} else {
				console.log(req.body);
				console.log("hi"+req.body.message);
				var tasks = [
					function(callback){
						var form = new formidable.IncomingForm({
								encoding: 'utf-8',
								multiples: true,
								keepExtensions: false
							});
						form.parse(req, function(err, fields, files){
							if(files.img_file.size == 0){
								console.log("1:\n");
								return messageCreate(req, fields.message, "msg", chatroom, res);
							}
							else {
								console.log("2:\n");
								console.log(files);
								callback(err, files);
							}
						});
					},
					function(files, callback){
						Upload.s3(req, files, function(err, result){
							callback(err, result);
						});
					}
				];
				async.waterfall(tasks, function(err, result){
					if(err){
						console.log(err);
					}else{
						console.log("result: ");
						console.log(result);

						var tmp = "https://fleeflow.s3.ap-northeast-2.amazonaws.com/"+result;
						console.log(tmp);
						messageCreate(req, tmp, "img", chatroom, res);
						
					}
				});
		}
	})
})


//connection event handler
//connection이 수립되면 function의 인자로 socket이 들어온다.
//io 객체는 연결된 전체 클라이언트와의 상호작용을 위한 객체, socket객체는 개별 클라이언트와의 상호작용을 위한 객체다.
//'connection'은 connection event의 이름.
io.on('connection', function(socket){
	console.log("connected!");
});

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


server.listen(process.env.PORT || 5000, function(){
	console.log("Server started!");
})
