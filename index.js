var express = require('express');
var app = express();

app.set('view engine', 'ejs');

// REQUIRE

// Global variables
//var number_of_teams=0;

// database
var dbapi = require('./db.js'); // api
var maindb = new dbapi.database("mydb.db"); // database in file

// passport
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

// sessions, parsers
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bodyParser = require('body-parser');

var md5 = require('js-md5');

// image uploading
var fs = require('fs');
var multer = require('multer');
var path = require('path');
var upload = multer({ dest: 'uploads/' });

// middleware config - parsers
app.use(bodyParser());
app.use(bodyParser.urlencoded({ // support URL-encoded bodies
  extended: true
}));
app.use(bodyParser.json()); // support JSON
app.use(cookieParser());

app.use(express.static('public'));
app.use(session({
  secret: 'KEK LOL ROFL HAHA LUL WOW OMG LMAO'
}));

app.use(passport.initialize());
app.use(passport.session());


// Saját stratégiánk
// Bejentkezés password-del és nickname-mel működik
passport.use(new LocalStrategy(
	// külön megmondjuk, hogy mik a fieldeink
	{
		usernameField: 'nickname', 
		passwordField: 'password',
	}, function (username, password, done) { // a stratégia függvénye
		maindb.query("SELECT * FROM user WHERE nickname=?", function (err, result) {
			if ( result.length == 0 ) { // ha nem találtunk usert
				console.log('No such user');
				return done(null, false);
		  	} else {
				var user = result[0]; // eltároljuk a user adatait
				if ( md5(password) != user.password ) { // ha rossz a jelszó
					console.log('Bad password');
					return done(null, false); // ezt a függvényt kell hívni a dokumentáció szerint
				}

				if ( md5(password) == user.password ) { // ha jó a jelszó, akkor minden OK
					console.log("New login");
					return done(null, user); // továbbküldjük a user változót
				}
		  	}
    	}, [[username]]);
  }
));

// User hozzáadása a sessionbe
passport.serializeUser(function (user, done) {
	done(null, user); // user elmentése
});

// User törlése a sessionből
passport.deserializeUser(function (user, done) {
	done(null, user);
});

function checkLogin(req, res, next) { // a saját checkLogin middleware függvényünk
	if (req.user) { // a user be van jelentkezve, van joga látni a titkos oldalt
		console.log('user is logged in');
		res.redirect('/profile'); // átirányítjuk a titkos oldalra
	} else { // a user nincs bejelentkezve
  		console.log('user is not logged in');
		res.redirect('/homepage'); // átirányítjuk a főoldalra
	}

	next();
}

app.get('/signin', function (req, res) {
	console.log('GET request on /signin');
	res.render('signin');
});

app.get('/signup', function (req, res) {
	console.log('GET request on /signup');
	res.render('signup');
});

// Ez a passport middleware függvénye a bejelentkezéshez
var auth = passport.authenticate('local', { successRedirect: '/', failureRedirect: '/signin' });
app.post('/signin', auth);

// Összepárosító függvény
function matching(new_nickname, new_instrument) {
	console.log('Matching');
	maindb.query("SELECT * FROM user WHERE instrument!=? AND team=0", function (err, result) {		//Kinek van nem ilyen hangszere?
		maindb.query("SELECT team FROM user ORDER BY 1 DESC LIMIT 1", function (err2, result2) {			//Legnagyobb team lekérdezése
			var number_of_teams = result2[0].team;
			if(result.length>0) { //Van-e eredmény?
				maindb.query("UPDATE user SET team=? WHERE nickname=? OR nickname=?", function (err1, result1) {
				}, [[number_of_teams+1, new_nickname, result[0].nickname]]);	//"team"-t beállítjuk a két emberünknek
			}
		}, [[]]);
	}, [[new_instrument]]);

};


app.post('/signup', function (req, res) {
	var data = Object();
	data.firstname = req.body.firstname;
	data.lastname = req.body.lastname;
	data.email = req.body.email;
	data.nickname = req.body.nickname;
	data.pw = req.body.pw;
	data.pw = md5(data.pw);
	data.instrument = req.body.instrument;
	data.region = req.body.region;
	data.genre = req.body.genre;
	data.level = req.body.level;
	data.team = 0;
	data.answer_status = 0;
	data.description = req.body.description;

	// Email, Nickname duplikátum ellenőrzése
	maindb.query('SELECT COUNT(email) AS "number_of_emails" FROM user WHERE email=?', function (err, result) {
        var number_of_emails = result[0].number_of_emails;

		if (number_of_emails > 0){
			console.log('email duplikátum');
		}
//		res.render('notifications', { POSTmembers: team_members, POSTteamstatus: teamstatus, POSTcurrent_user: req.user});
	}, [[data.email]]);

	//user adatatinak lementése az adatbázisba
	maindb.query("INSERT INTO user (firstname, lastname, email, nickname, password, instrument, region, genre, level, team, answer_status, description, profilepicture) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", function (err, result) {
		matching(data.nickname, data.instrument);
		res.render('signin');	//átirányítjuk a signin-ra
	}, [[data.firstname, data.lastname, data.email, data.nickname, data.pw, data.instrument, data.region, data.genre, data.level,  data.team, data.answer_status, data.description,'images/default_picture.png']]);
});

app.get('/', checkLogin); // használjuk a middlewaret, ha a /-re jön egy request

app.get('/database', function (req, res) {
	//lekérdezi az összes felhasználó adatait
	var array = Array();
	maindb.query("SELECT * FROM user", function (err, result) {
		for (var i = 0; i < result.length; i++) {
    		array.push([result[i].firstname, result[i].lastname, result[i].email, result[i].nickname, result[i].password, result[i].instrument, result[i].region, result[i].genre, result[i].level, result[i].team, result[i].answer_status]);
		}
		res.render('database', { POSTuser: array });
	}, [[]]);
});

app.get('/list', function (req, res) {
	if (!req.user) { // a user nincs bejelentkezve
		console.log('user is not logged in');
		res.redirect('/signin'); // átirányítjuk a bejelentkezéshez
		return;
	}
	//lekérdezi az összes felhasználó adatait
	var array = Array();
	maindb.query("SELECT * FROM user", function (err, result) {
		for (var i = 0; i < result.length; i++) {
    		array.push([result[i].firstname, result[i].lastname, result[i].email, result[i].nickname, result[i].instrument, result[i].region, result[i].genre, result[i].level, result[i].team]);
		}
		res.render('list', { POSTuser: array });
	}, [[]]);
});

app.get('/profile', function (req, res) {
	if (!req.user) { // a user nincs bejelentkezve
		console.log('user is not logged in');
		res.redirect('/signin'); // átirányítjuk a bejelentkezéshez
		return;
	}
	res.render('profile', { POSTuserdata: req.user });
});

app.post('/upload', upload.single('avatar'), function (req, res, next) {
	console.log(req.file); //feltöltött file adatai
	var current_location = req.file.path; //a kép ideiglenes helyének elérési útja
	var image_type = path.extname(req.file.originalname).toLowerCase(); //Kép típusa (pl. .jpg, .png, ...)
	var dest = "public/images/" + req.user.nickname + image_type;
	var new_profilepicture = "images/" + req.user.nickname + image_type; //kép végleges helyének elérési úrja
	//Kép áthelyezése ideiglenes helyről a végleges helyre
	fs.rename(current_location, dest, function(err) {
        if (err) throw err;
        console.log("Upload completed!");
		//adatbázis frissítése az új képpel
		maindb.query("UPDATE user SET profilepicture=? WHERE nickname=?", function (err, result) {
			req.user.profilepicture=new_profilepicture;
			res.redirect('/profile'); // átirányítjuk a profilra
		//	next();
	}, [[new_profilepicture, req.user.nickname]]);
    });
});

app.get('/notifications', function (req, res) {
	if (!req.user) { // a user nincs bejelentkezve
		console.log('user is not logged in');
		res.redirect('/signin'); // átirányítjuk a bejelentkezéshez
		return; 
	}
	//tagok kikeresése
	var team_members = Array();
	maindb.query("SELECT * FROM user WHERE team=? AND team!=0", function (err, result) {
		var teamstatus=1;	//-1 ha van -1   |||   1, ha mindegyik 1   |||   különben 0
		for(var i=0; i<result.length; i++) {
			team_members.push([result[i].firstname, result[i].lastname, result[i].email, result[i].nickname, result[i].instrument, result[i].region, result[i].genre, result[i].level, result[i].answer_status]);
			if(result[i].answer_status==-1) teamstatus=-1;		//ha van -1, akkor örök -1
			else if(result[i].answer_status==0 && teamstatus==1) teamstatus=0;	//ha 0 a status valakinél és nincs -1, akkor teamstatus=0
		}
		res.render('notifications', { POSTmembers: team_members, POSTteamstatus: teamstatus, POSTcurrent_user: req.user});
	}, [[req.user.team]]);
});

app.post('/notifications', function (req, res) {
	var decision = req.body.answer;
	//Kikeressük, hogy tényleg nem válaszolt-e még.
	maindb.query("SELECT * FROM user WHERE nickname=?", function (err1, result1) {
		if(result1[0].answer_status!=0) {
			//Már válaszolt
			res.redirect('/notifications');
			return;	
		}
		//még nem válaszolt, válaszát beírjuk az adatbázisba
		var status_number;
		if(decision=="Accept") status_number=1;
		else if(decision=="Refuse") status_number=-1;
		maindb.query("UPDATE user SET answer_status=? WHERE nickname=?", function (err, result) {
			req.user.answer_status=status_number;
			res.redirect('/notifications');
		}, [[status_number, req.user.nickname]]);
	}, [[req.user.nickname]]);
});

app.get('/homepage', function (req, res) {
	res.render('homepage');
});

app.get('/user/:user_nickname', function (req, res) {
	//másik user adatainak lekérdezése
	var userdata = Object();
	maindb.query("SELECT * FROM user WHERE nickname=?", function (err, result) {
		for (var i = 0; i < result.length; i++) {
			userdata.firstname=result[i].firstname;
			userdata.lastname=result[i].lastname;
			userdata.instrument=result[i].instrument;
			userdata.email=result[i].email;
			userdata.nickname=result[i].nickname;
			userdata.region=result[i].region;
			userdata.genre=result[i].genre;
			userdata.level=result[i].level;
			userdata.profilepicture=result[i].profilepicture;
			userdata.description=result[i].description;
		}
		if(req.user && userdata.nickname==req.user.nickname) {	//Ha be van jelentkezve ÉS a saját prolját nézi, akkor visszavisszük a profile-ra
			res.redirect('/profile');
			return;
		}
		//Ha nincs bejentkezve vagy nem a saját profilja.
		res.render('other_profile', { POSTuserdata: userdata });
	}, [[req.params.user_nickname]]);
});

app.listen(3000, function () {
	//Létrehozunk egy táblát, ha még nincs. (ha módosítottunk az adatbázisban, törölni kell azt!!!)
	maindb.query("CREATE TABLE if not exists user (firstname TEXT, lastname TEXT, email TEXT, nickname TEXT, password TEXT, instrument TEXT, region TEXT, genre TEXT, level TEXT, team INTEGER, answer_status INTEGER, description TEXT, profilepicture TEXT)", null, [[]]);
	console.log('Example app listening on port 3000!');

})
