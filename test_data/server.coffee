express = require 'express'
http = require 'http'
ControllerManager = require('../index').ControllerManager
app = express()
app.use express.json()
app.use express.urlencoded()
ControllerManager.registerRoutes app

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