var express = require('express');
var app = express();

app.set('view engine', 'pug');

// require
var dbapi = require('./db.js');
var maindb = new dbapi.database("mydb.db");
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var cookieParser = require('cookie-parser');
var session = require('express-session');
var md5 = require('js-md5');
var bodyParser = require('body-parser');

// middleware config
app.use(express.static('public'));
app.use(cookieParser());
app.use(bodyParser());
app.use(session({
  secret: 'KEK LOL ROFL HAHA LUL WOW OMG LMAO'
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
  extended: true
}));

// itt írjuk meg a saját stratégiánkat, ami szerint eldöntjük, hogy beléphet-e a
// user vagy sem
passport.use(new LocalStrategy(
  function (email, pw, done) {
    var given_email = email;
    var given_password = pw;
    console.log('kukucs');
    maindb.query("SELECT * FROM user WHERE email=?", function (err, result) {
      if (result.length == 0) {
        console.log('No such email');
        return done(null, false);
      } else {
        var userdata = result[0];
        if (md5(given_password) != userdata.password) { // ha rossz a jelszó
          console.log('Bad password');
          return done(null, false); // ezt a függvényt kell hívni a dokumentáció szerint
        }
        if (md5(given_password) == userdata.password) { // ha jó a jelszó, akkor minden OK
          console.log("New login");
          return done(null, userdata); // továbbküldjük a user változót
        }
      }
    }, [
      [given_email]
    ])
  }
));

// elmentjük a user-t a sessionbe
passport.serializeUser(function (user, done) {
  done(null, user); // user elmentése
});

// ha pl. kijelentkezik, akkor nincs már szükség arra, hogy
// az adatai továbbra is a sessionben legyenek tárolva
passport.deserializeUser(function (user, done) {
  done(err, user);
});

function checkLogin(req, res, next) { // a saját checkLogin middleware függvényünk
  if (req.user) { // a user be van jelentkezve, van joga látni a titkos oldalt
    console.log('user is logged in');
    res.redirect('/secret_page'); // átirányítjuk a titkos oldalra
  } else { // a user nincs bejelentkezve
    console.log('user is not logged in');
    res.redirect('/signin'); // átirányítjuk a bejelentkezéshez
  }
  next();
}

function output(err, res) {
  for (var i = 0; i < res.length; i++) {
    console.log(res[i].info);
  }
}

/*app.get('/', function (req, res) {
  console.log('GET request on /')
  res.render('index')
})*/

app.get('/signin', function (req, res) {
  console.log('GET request on /signin');
  res.render('signin');
});

app.get('/signup', function (req, res) {
  console.log('GET request on /signup');
  res.render('signup');
});

app.post('/signin', passport.authenticate('local', { successRedirect: '/', failureRedirect: '/signin' }));

app.post('/signup', function (req, res) {
  var adat = Object();
  adat.firstname = req.body.firstname;
  adat.lastname = req.body.lastname;
  adat.email = req.body.email;
  adat.pw = req.body.pw;
  adat.pw = md5(adat.pw);
  maindb.query("INSERT INTO user (firstname, lastname, email, password) VALUES (?, ?, ?, ?)", function (err, result) {
    res.render('signup');
  }, [
    [adat.firstname, adat.lastname, adat.email, adat.pw]
  ]);
});


app.get('/', checkLogin); // használjuk a middlewaret, ha a /-re jön egy request


/*app.post('/action', function (req, res) {
    console.log('POST /action with name ' + req.body.firstname)
    var adat=req.body.firstname
    maindb.query("INSERT INTO user (info) VALUES (?)", null, [[adat]])
    maindb.query("SELECT info FROM user_info", function(err, res){output(err, res)}, [[]]);
    res.render('index')
})*/

app.get('/adatbazis', function (req, res) {
  var tomb = Array();
  maindb.query("SELECT * FROM user", function (err, result) {
    for (var i = 0; i < result.length; i++) {
      tomb.push(result[i].firstname + " " + result[i].lastname + " " + result[i].email + " " + result[i].password);
    }
    res.render('adatbazis', {
      user: tomb
    })
  }, [
    []
  ])
})

app.listen(3000, function () {
  maindb.query("CREATE TABLE if not exists user (firstname TEXT, lastname TEXT, email TEXT, password TEXT)", null, [
    []
  ])
  console.log('Example app listening on port 3000!')
})