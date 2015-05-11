Bluebird = require 'bluebird'
base = require('../index')
Validator = base.Validator
UserError = base.UserError

exports.middleware = middleware = {}
exports.beforeEach = beforeEach = {}
exports.UserData = UserData = []
exports.resetData = ()->
  UserData.splice 0, 5,
    name: "Nathan Tate"
    username: "yourdeveloperfriend"
    password: "password1"
  ,
    name: "Shirle Tate"
    username: "hotstuff5"
    password: "password2"
  ,
    name: "Baby Tate"
    username: "soonToCome"
    password: "password3"
  middleware.myBaseRan = 0
  middleware.userRan = 0
  middleware.asyncRan = 0
  beforeEach.myBaseRan = 0
  beforeEach.userRan = 0
  beforeEach.asyncRan = 0
  beforeEach.other = {}
  
exports.getData = ()->
  UserData.slice 0

exports.resetData()

# Test synchronous validator
Validator.registerValidator "unique", (value, data, field, controllerName)->
  isUnique = true
  for user in UserData
    isUnique = false if user[field] is value
  unless isUnique is data
    throw new UserError if data then "must be unique" else "does not exist"

# Test asynchronous validator
Validator.registerValidator "inDb", (value, data, field, controllerName)->
  new Bluebird( (resolve)->
    setTimeout resolve, 25
  ).then ->
    found = UserData.length > value
    if found is data
      true
    else if data
      "does not exist"
    else
      "must not exist"

exports.ErrorHandler = ErrorHandler =
  expect: (callback)->
    @callback = callback
    
  logError: (error)->
    if @callback
      @callback error
      @callback = false
    else
      console.log "ServerError", error.message
      console.log error.stack



