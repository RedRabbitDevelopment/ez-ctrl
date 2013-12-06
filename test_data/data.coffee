Q = require('q')
base = require('../index')
Validator = base.Validator

exports.middleware = middleware = {}
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
	
exports.getData = ()->
	UserData.slice 0

exports.resetData()

# Test synchronous validator
Validator.registerValidator "unique", (value, data, field, controllerName)->
	isUnique = true
	for user in UserData
		isUnique = false if user[field] is value
	unless isUnique is data
		throw new Error if data then "must be unique" else "does not exist"

# Test asynchronous validator
Validator.registerValidator "inDb", (value, data, field, controllerName)->
	deferred = Q.defer()
	setTimeout ->
		found = UserData.length > value
		if found is data
			deferred.resolve()
		else
			deferred.reject(if data then "does not exist" else "must not exist")
	, 25
	deferred.promise

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



