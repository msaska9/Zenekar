var express = require('express')
var app = express()

app.set('view engine', 'pug')

app.get('/', function (req, res) {
    console.log('GET request on /')
    res.render('index', { title: 'Hey', message: 'Hello there!' })
})

app.listen(3000, function () {
	console.log('Example app listening on port 3000!')
})
