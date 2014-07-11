express = require 'express'
http = require 'http'
frontEnd = new (require('../index').FrontEnd)()
app = express()
app.use express.json()
app.use express.urlencoded()
app.use express.bodyParser()
app.use express.static(__dirname + "/server_public")
wait = frontEnd.registerRoutes(app, __dirname + "/routes", true).fail (error)->
  console.log 'FAIL', error, error?.stack
module.exports =
  start: (cb)->
    unless cb
      cb = ->
    @server = http.createServer app
    wait.then =>
      @server.listen 3000, cb
  close: (cb)->
    unless cb
      cb = ->
    @server.close cb
