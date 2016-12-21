var express = require('express');
var app = express();
var dbapi = require('./db.js');
var maindb = new dbapi.database("mydb.db");

app.set('view engine', 'pug');
var md5 = require('js-md5');
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
  extended: true
}));

function output(err, res) {
  for (var i = 0; i < res.length; i++) {
    console.log(res[i].info);
  }
}

app.get('/', function (req, res) {
  console.log('GET request on /')
  res.render('index')
})

app.get('/signin', function (req, res) {
  console.log('GET request on /signin')
  res.render('signin')
})

app.get('/signup', function (req, res) {
  console.log('GET request on /signup')
  res.render('signup')
})

app.post('/signin', function (req, res) {

})

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