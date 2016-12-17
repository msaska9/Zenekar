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


app.get('/', function (req, res) {
    console.log('GET request on /')
    res.render('index', { title: 'Hey', message: 'Hello there!' })
})

app.post('/action', function (req, res) {
    console.log('POST /action with name ' + req.body.firstname)
    var adat=req.body.firstname
    maindb.query("INSERT INTO user_info (info) VALUES (?)", null, [[adat]])
    res.render('index', { title: 'Hey', message: 'Hello there!' })
})

app.listen(3000, function () {
  maindb.query("CREATE TABLE if not exists user_info (info TEXT)", null, [[]])
	console.log('Example app listening on port 3000!')
})

