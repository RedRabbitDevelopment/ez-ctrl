express = require 'express'
http = require 'http'
FrontEnd = require('../index').FrontEnd
app = express()
app.use express.json()
app.use express.urlencoded()
app.use express.bodyParser()
app.use express.static(__dirname + "/server_public")
TestData = require './data'
FrontEnd.registerRoutes app

module.exports =
	start: (cb)->
		unless cb
			cb = ->
		@server = http.createServer app
		@server.listen 3000, cb
	close: (cb)->
		unless cb
			cb = ->
		@server.close cb