var express = require('express')
var app = express()
var dbapi = require('./db.js')
var maindb = new dbapi.database("mydb.db")

app.set('view engine', 'pug')
var bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

function output(err, res) {
	for(var i=0; i<res.length; i++) {
    		console.log(res[i].info);
   }
}

app.get('/', function (req, res) {
    console.log('GET request on /')
    res.render('index')
})

app.post('/action', function (req, res) {
    console.log('POST /action with name ' + req.body.firstname)
    var adat=req.body.firstname
    maindb.query("INSERT INTO user_info (info) VALUES (?)", null, [[adat]])
    maindb.query("SELECT info FROM user_info", function(err, res){output(err, res)}, [[]]);
    res.render('index')
})

app.listen(3000, function () {
  maindb.query("CREATE TABLE if not exists user_info (info TEXT)", null, [[]])
	console.log('Example app listening on port 3000!')
})

