Q = require('q')
base = require('../index')
BaseController = base.BaseController
Validator = base.Validator

exports.middleware = middleware = {}
UserData = null
exports.resetData = ()->
	UserData = [
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
	]
	middleware.myBaseRan = 0
	middleware.userRan = 0
	middleware.asyncRan = 0
	
exports.getData = ()->
	UserData

exports.resetData()

# Test synchronous validator
Validator.registerValidator "unique", (validatorResult, validatorData, controllerName)->
	if validatorData then "must be unique" else "must not be unique"
, (value, data, field, controllerName)->
	isUnique = true
	for user in UserData
		isUnique = false if user[field] is value
	isUnique is data

# Test asynchronous validator
Validator.registerValidator "inDb", (validatorResult, validatorData)->
	if validatorData then "does not exist" else "must not exist"
, (value, data, field, controllerName)->
	deferred = Q.defer()
	setTimeout ->
		found = UserData.length > value
		if found is data
			deferred.resolve()
		else
			deferred.reject()
	, 25
	deferred.promise

Validator.on "error", console.log

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


MyBaseController = BaseController.extend
	beforeEach:  (req, res, next)->
		middleware.myBaseRan++
		next()

MyBaseController.prototype.logError = (error)->
	ErrorHandler.logError(error)

exports.UserController = MyBaseController.extend
	name: "User"
	beforeEach: (req, res, next)->
		middleware.userRan++
		next()
	routes:
		query: ()-> # get /users Anything with "query" automatically is get /<tableize>
			# Get the users
			UserData
		
		get: # get /users/:id Anything with "get" automatically is get /<tableize>/:id
			validation:
				id:
					required: true
					type: 'int'
					inDb: true
					
			logic: (id)->
				UserData[id]
				
		add: # put /users Anything with "add" automatically is put /<tableize>
			validation:
				name:
					required: true
					type: "text"
					length:
						gt: 8
				username:
					required: true
					type: 'alphaNumeric'
					unique: true # Backend Only
					length:
						gt: 9
				password:
					required: true
					type: 'alphaNumeric'
					length:
						gt: 8
			logic: (_data)->
				_data.id = UserData.length
				_data.comments = []
				UserData.push(_data)
				true
		save: # post /users/:id Anything with "save" automatically is post /<tableize>/:id
			validation:
				id:
					required: true
					type: 'int'
					inDb: true
				name:
					length:
						gt: 8
				username:
					type: 'alphaNumeric'
					unique: true
					length:
						gt: 8
				password:
					type: 'alphaNumeric'
					length:
						gt: 8
			logic: (id, _data)->
				UserData[id][key] = value for key, value of _data
				true
		postLogin: # post<verb> is always /<tableize/verb
			validation:
				username:
					required: true
				password:
					required: true
			logic: (username, password)->
				for user in UserData
					if user.username is username
						if user.password is password
							return true
						else
							throw new Error("Invalid username or password")
				throw new Error("Invalid username or password")
		faulty: ()->
			method = null
			# Purposefully throw error
			method()
			"Result"
		usesId:
			validation:
				id:
					type: 'int'
					required: true
					inDb: true
			usesId: true,
			logic: (id)->
				"Result"

exports.AsyncUserController = MyBaseController.extend
	name: "AsyncUser"
	beforeEach: (req, res, next)->
		middleware.asyncRan++
		next()
	routes:
		query: -> #get /users Anything with "query" automatically is get /<tableize>
			# Get the users
			deferred = Q.defer()
			setTimeout ->
				deferred.resolve(UserData)
			, 25
			deferred.promise
		
		get: # get /users/:id Anything with "get" automatically is get /<tableize>/:id
			validation:
				id:
					required: true
					type: 'int'
					inDb: true
			logic: (id)->
				deferred = Q.defer()
				setTimeout ->
					deferred.resolve UserData[id]
				, 25
				deferred.promise
		add: # put /users Anything with "add" automatically is put /<tableize>
			validation:
				name:
					required: true
					type: "text"
					length:
						gt: 8
				username:
					required: true
					type: 'alphaNumeric'
					length:
						gt:8
				password:
					required: true
					length:
						gt: 8
					type: 'alphaNumeric'
					unique: true # Backend Only
			logic: (_data)->
				deferred = Q.defer()
				setTimeout ->
					_data.id = UserData.length
					_data.comments = []
					UserData.push _data
					deferred.resolve true
				, 25
				deferred.promise
		save: # post /users/:id Anything with "save" automatically is post /<tableize>/:id
			validation:
				id:
					required: true
					type: 'int'
					inDb: true
				name:
					required: true
					length:
						gt: 8
				username:
					type: 'alphaNumeric'
					length:
						gt: 8
				password:
					type: 'alphaNumeric'
					length:
						gt: 8
			logic: (id, _data)->
				deferred = Q.defer()
				setTimeout ->
					UserData[id][key] = value for key, value of _data
					deferred.resolve true
				, 25
				deferred.promise
				
		postLogin: # post<verb> is always /<tableize/verb
			validation:
				username:
					required: true
				password:
					required: true
			logic: (username, password)->
				deferred = Q.defer()
				setTimeout ->
					for user in UserData
						user = UserData[id]
						if user.username is username
							if user.password is password
							 	deferred.resolve(true)
							else
								deferred.reject "Invalid username or password"
					deferred.reject("Invalid username or password")
				, 25
				deferred.promise
