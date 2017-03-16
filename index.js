var express = require('express');
var app = express();

app.set('view engine', 'ejs');

// REQUIRE

// Globális változók
//var number_of_teams=0;

// adatbazis
var dbapi = require('./db.js'); // api
var maindb = new dbapi.database("mydb.db"); // adatbazis fajlban

// passport
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

// sessions, parsers
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bodyParser = require('body-parser');

var md5 = require('js-md5');

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


// sajat stratégiank
// a bejelentkezes e-maillel es jelszoval tortenik
passport.use(new LocalStrategy(
	// kulon megmondjuk, hogy mik a fieldeink
	{
		usernameField: 'email', 
		passwordField: 'password',
	}, function (username, password, done) { // a strategia fuggvenye
		maindb.query("SELECT * FROM user WHERE email=?", function (err, result) {
			if ( result.length == 0 ) { // ha nem talaltunk usert
				console.log('No such user'); 
				return done(null, false);
		  	} else {
				var user = result[0]; // eltaroljuk a user adatait
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

// user hozzaadasa a sessionbe
passport.serializeUser(function (user, done) {
	done(null, user); // user elmentése
});

// user torlese a sessionbol
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

// ez a passport middleware fuggvenye a bejelentkezeshez
var auth = passport.authenticate('local', { successRedirect: '/', failureRedirect: '/signin' });
app.post('/signin', auth);

function matching(new_email, new_instrument) {
	console.log('Matching');
	maindb.query("SELECT * FROM user WHERE instrument!=? AND team=0", function (err, result) {		//Kinek van nem ilyen hangszere?
		maindb.query("SELECT team FROM user ORDER BY 1 DESC LIMIT 1", function (err2, result2) {			//Legnagyobb team lekérdezése
			var number_of_teams = result2[0].team;
			if(result.length>0) {
				maindb.query("UPDATE user SET team=? WHERE email=? OR email=?", function (err1, result1) {
				}, [[number_of_teams+1, new_email, result[0].email]]);
			}
		}, [[]]);
	}, [[new_instrument]]);
	
};

app.post('/signup', function (req, res) {
	var adat = Object();
	adat.firstname = req.body.firstname;
	adat.lastname = req.body.lastname;
	adat.email = req.body.email;
	adat.pw = req.body.pw;
	adat.pw = md5(adat.pw);
	adat.instrument = req.body.instrument;
	adat.megye = req.body.megye;
	adat.stilus = req.body.stilus;
	adat.tudasszint = req.body.tudasszint;
	adat.team = 0;
	adat.answer_status = 0;

	maindb.query("INSERT INTO user (firstname, lastname, email, password, instrument, megye, stilus, tudasszint, team, answer_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", function (err, result) {
		matching(adat.email, adat.instrument);
		res.render('signin');
	}, [[adat.firstname, adat.lastname, adat.email, adat.pw, adat.instrument, adat.megye, adat.stilus, adat.tudasszint,  adat.team, adat.answer_status]]);
});


app.get('/', checkLogin); // használjuk a middlewaret, ha a /-re jön egy request

app.get('/adatbazis', function (req, res) {
	var tomb = Array();

	maindb.query("SELECT * FROM user", function (err, result) {
		for (var i = 0; i < result.length; i++) {
    		tomb.push([result[i].firstname, result[i].lastname, result[i].email, result[i].password, result[i].instrument, result[i].megye, result[i].stilus, result[i].tudasszint, result[i].team, result[i].answer_status]);
		}
		res.render('adatbazis', { POSTuser: tomb });
	}, [[]]);
});

app.get('/lista', function (req, res) {
	if (!req.user) { // a user nincs bejelentkezve
		console.log('user is not logged in');
		res.redirect('/signin'); // átirányítjuk a bejelentkezéshez
		return;
	}
	var tomb = Array();
	maindb.query("SELECT * FROM user", function (err, result) {
		for (var i = 0; i < result.length; i++) {
    		tomb.push([result[i].firstname, result[i].lastname, result[i].email, result[i].instrument, result[i].megye, result[i].stilus, result[i].tudasszint, result[i].team]);
		}
		res.render('list', { POSTuser: tomb });
	}, [[]]);
});

app.get('/profile', function (req, res) {
	if (!req.user) { // a user nincs bejelentkezve
		console.log('user is not logged in');
		res.redirect('/signin'); // átirányítjuk a bejelentkezéshez
		return;
	}
	res.render('profil', { POSTuserdata: req.user });
});

app.get('/ertesites', function (req, res) {
	if (!req.user) { // a user nincs bejelentkezve
		console.log('user is not logged in');
		res.redirect('/signin'); // átirányítjuk a bejelentkezéshez
		return;
	}
	//tegok kikeresése
	var team_members = Array();
	maindb.query("SELECT * FROM user WHERE team=? AND team!=0", function (err, result) {
		var teamstatus=1;	//-1 ha van -1   |||   1, ha mindegyik 1   |||   különben 0
		for(var i=0; i<result.length; i++) {
			team_members.push([result[i].firstname, result[i].lastname, result[i].email, result[i].instrument, result[i].megye, result[i].stilus, result[i].tudasszint, result[i].answer_status]);
			if(result[i].answer_status==-1) teamstatus=-1;		//ha van -1, akkor örök -1
			else if(result[i].answer_status==0 && teamstatus==1) teamstatus=0;	//ha 0 a status valakinél és nincs -1, akkor teamstatus=0
		}
		res.render('ertesites', { POSTmembers: team_members, POSTteamstatus: teamstatus, POSTcurrent_user: req.user});
	}, [[req.user.team]]);
});

app.post('/ertesites', function (req, res) {
	var decision = req.body.answer;
	//Kikeressük, hogy tényleg nem válaszolt-e még.
	maindb.query("SELECT * FROM user WHERE email=?", function (err1, result1) {
		if(result1[0].answer_status!=0) {
			//Már válaszolt
			res.redirect('/ertesites');
			return;	
		}
		//még nem válaszolt
		var status_number;
		if(decision=="Accept") status_number=1;
		else if(decision=="Refuse") status_number=-1;
		maindb.query("UPDATE user SET answer_status=? WHERE email=?", function (err, result) {
			req.user.answer_status=status_number;
			res.redirect('/ertesites');
		}, [[status_number, req.user.email]]);	
	}, [[req.user.email]]);
});

app.get('/homepage', function (req, res) {
	res.render('homepage');
});

app.get('/user/:user_lastname', function (req, res) {
	var userdata = Object();
	maindb.query("SELECT * FROM user WHERE lastname=?", function (err, result) {
		for (var i = 0; i < result.length; i++) {
			userdata.firstname=result[i].firstname;
    		userdata.lastname=result[i].lastname;
			userdata.instrument=result[i].instrument;
			userdata.email=result[i].email;
		}
		if(req.user && userdata.email==req.user.email) {	//Ha be van jelentkezve ÉS a saját prolját nézi, akkor visszavisszük a profile-ra
			res.redirect('/profile');
			return;
		}
		//Ha nincs bejentkezve vagy nem a saját profilja.
		res.render('other_profil', { POSTuserdata: userdata });
	}, [[req.params.user_lastname]]);
});

app.listen(3000, function () {
	maindb.query("CREATE TABLE if not exists user (firstname TEXT, lastname TEXT, email TEXT, password TEXT, instrument TEXT, megye TEXT, stilus TEXT, tudasszint TEXT, team INTEGER, answer_status INTEGER)", null, [[]]);
	console.log('Example app listening on port 3000!');
	
})
