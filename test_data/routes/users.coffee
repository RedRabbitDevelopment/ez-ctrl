Q = require('q')
MyBaseController = require './'
data = require '../data'
middleware = data.middleware
UserData = data.UserData

module.exports = MyBaseController.extend
	name: "User"
	allowedErrors: ["Invalid username or password"]
	beforeEach: (req, res, next)->
		middleware.userRan++
		next()
	routes:
		query: ()-> # get /users Anything with "query" automatically is get /<tableize>
			# Get the users
			UserData
		
		get: (id)-> # get /users/:id Anything with "get" automatically is get /<tableize>/:id
			UserData[id]
				
		add: # put /users Anything with "add" automatically is put /<tableize>
			validation:
				name:
					required: true
					len: 8
				username:
					required: true
					type: 'alphanumeric'
					unique: true # Backend Only
					len: [9]
				password:
					required: true
					type: 'alphanumeric'
					len: [9]
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
					len: 8
				username:
					type: 'alphanumeric'
					unique: true
					len: 8
				password:
					type: 'alphanumeric'
					len: 8
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


