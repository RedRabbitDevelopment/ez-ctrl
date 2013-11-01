TestData = require('./test_data')
_ = require("underscore")
assert = require('assert')
base = require('../index')

describe "UserController", ->
	UserController = TestData.UserController
	beforeEach ->
		TestData.resetData()

	describe "initialization", ->
		it "should initialize all their data", ->
			assert.equal UserController.modelName, "User"
			assert.equal UserController.basePattern, "/users"
	describe "extractArguments", ->
		it "should get all the arguments", ->
			args = FuncDetails.extractArguments (a, b, c) ->
			assert.deepEqual args, ['a', 'b', 'c']
	
		it "shouldn't care about whitespace", ->
			args = FuncDetails.extractArguments `function( a,	 b, 
				c) {}`
			assert.deepEqual args, ['a', 'b', 'c']
	
		it "shouldn't care about comments", ->
			args = FuncDetails.extractArguments `function(/* ab */a, 
				// booya stuff
				b, /* d, */c) /*don't mess with */{
				
				/* don't mess with */ }`
			assert.deepEqual args, ['a', 'b', 'c']
	
		it "should care about the whitespace and comments", ->
			argString = FuncDetails.extractArgumentString `function(/* ab */a, 
				// booya stuff
				b, /* d, */c) /*don't mess with */{
				
				/* don't mess with */ }`
		
			compareTo = "/* ab */a, "
			compareTo += "				// booya stuff"
			compareTo += "				b, /* d, */c"
			# Remove funky characters for proper comparison
			argString = argString.replace(/\n/g, "")
			assert.equal argString, compareTo
	

	describe "extractLogicArguments", ->
		controller = null
		beforeEach ->
			controller =
				logic: (b, a, c)-> "G"
				extractArguments: UserController.prototype.extractArguments
	
		it "should get all the arguments", ->
			args = UserController.prototype.extractLogicArguments.apply controller, [{a: 'a', b: 'b', c: 'c'}]
			assert.deepEqual(args, ['b', 'a', 'c'])

	describe "getRouteDetails", ->
		it "should work with getAll", ->
			routeDetails = UserController.getRouteDetails "getAll"
			assert.equal routeDetails.method, "get"
			assert.equal routeDetails.pattern, "/users"
			assert.ok _.isFunction(routeDetails.logic)
			users = routeDetails.logic()
			assert.equal users.length, 3
	
		it "should work with get", ->
			routeDetails = UserController.getRouteDetails "get"
			assert.equal routeDetails.method, "get"
			assert.ok _.isFunction routeDetails.logic
			user = routeDetails.logic(2)
			assert.deepEqual user,
				name: "Baby Tate"
				username: "soonToCome"
				password: "password3"
		
	
		it "should work with add", ->
			routeDetails = UserController.getRouteDetails "add"
			assert.equal routeDetails.method, "put"
			assert.equal routeDetails.pattern, "/users"
			assert.ok _.isFunction routeDetails.logic
			johnnyboy =
				name: "Johnny Johnson"
				username: "johnnyboy"
				password: "password4"
			value = routeDetails.logic johnnyboy
			assert.ok value
			data = TestData.getData()
			assert.ok data[3]
			assert.deepEqual data[3], johnnyboy
	
		it "should work with save", ->
			routeDetails = UserController.getRouteDetails "save"
			assert.equal routeDetails.method, "post"
			assert.ok _.isFunction routeDetails.logic
			newName = "Shirley Tate"
			value = routeDetails.logic 1, name: newName
			assert.okvalue
			data = TestData.getData()
			assert.ok data[1]
			# Make sure the other values weren't affected
			assert.ok data[1].username, "hotstuff5"
			assert.equal data[1].name, newName
	
		it "should work with a custom method", ->
			routeDetails = UserController.getRouteDetails "postLogin"
			assert.equal routeDetails.method, "post"
			assert.equal routeDetails.pattern, "/users/login"
			assert.ok _.isFunction routeDetails.logic
			username = "hotstuff5"
			password = "password2"
			value = routeDetails.logic username, password
			assert.ok value
			assert.throws ->
				value = routeDetails.logic username, "wrongpassword"
			, /Invalid username or password/

	describe "validators", ->
		controller = null
		beforeEach ->
			routeDetails = UserController.getRouteDetails "add"
			controller = new UserController routeDetails
	
		it "should pass", (done)->
			controller.validate
				name: "Kelly Johnson"
				username: "kellyJohnson"
				password: "password8"
			.then (result)->
				done()
			, (error)->
				done(error)
			
		it "should throw an error", (done)->
			controller.validate
				name: "Kel"
				username: "kellyJohnson"
				password: "password8"
			.then (result)->
				done new Error("Didn't throw an error")
			, (error)->
				errors = error.error
				assert.ok errors.name
				assert.equal errors.name.length, 1
				assert.equal errors.name[0], "must be greater than 8"
				done()
			.fail (error)->
				done(error)
		
	
		it "should throw multiple errors", (done)->
			controller.validate
				name: "Kel",
				username: "kel",
				password: "password8"
			.then (result)->
				done new Error("Didn't throw an error")
			, (error)->
				errors = error.error
				assert.ok errors.name
				assert.ok errors.username
				assert.equal errors.username.length, 1
				assert.equal errors.name.length, 1
				assert.equal errors.name[0], "must be greater than 8"
				assert.equal errors.username[0], "must be greater than 9"
				done()
			.fail (error)->
				done(error)
		
	
		it "should throw custom errors", (done)->
			routeDetails = UserController.getRouteDetails "save"
			controller = new UserController(routeDetails)
			controller.validate
				id: 18,
				name: "Kelsey Johnson",
				username: "yourdeveloperfriend",
				password: "password8"
			.then (result)->
				done new Error("Didn't throw an error")
			, (error)->
				errors = error.error
				assert.ok errors.username
				assert.ok errors.id
				assert.equal errors.username.length, 1
				assert.equal errors.id.length, 1
				assert.equal errors.id[0], "does not exist"
				assert.equal errors.username[0], "must be unique"
				done()
			.fail (error)->
				done(error)
		
	
		it "should pass custom errors", (done)->
			routeDetails = UserController.getRouteDetails "save"
			controller = new UserController routeDetails
			controller.validate
				id: 2,
				name: "Kelsey Johnson"
			.then (result)->
				done()
			, (error)->
				done(error)
		
	

	describe "front-end functionality", ->
		it "should give me all the routes", ->
			allRoutes = base.ControllerManager.getAllRoutes()
			assert.ok allRoutes.AsyncUser and allRoutes.User
	
		it "should give me a string", ->
			### Not done
			frontEndMethods = base.FrontEnd.getFrontEndMethods()
			assert.ok frontEndMethods
			try {
				FrontEnd = eval(frontEndMethods)
			} catch(e) {
				assert.fail("", e)
			}
			###
	

	describe "converter", ->
		Converter = base.Converter
		it "should convert a string to an integer", ->
			assert.strictEqual Converter.convertField("5", "int"), 5
	
		it "should convert a string to an float", ->
			assert.strictEqual Converter.convertField("55.5", "float"), 55.5
	
		it "shouldn't convert something it doesn't recognize", ->
			assert.equal Converter.convertField("abcda", "fakeType"), "abcda"
	
		it "should convert a non-integer string to NaN", ->
			assert.ok _.isNaN Converter.convertField "abcda", "int"
	
		it "should convert a whole group of values", ->
			newData = Converter.convert
				booya: type: 'int'
				gee: type: 'float'
				wizz: type: 'text'
			,
				booya: '5'
				gee: '77.2'
				wizz: '12'
		
			assert.strictEqual newData.booya, 5
			assert.strictEqual newData.gee, 77.2
			assert.strictEqual newData.wizz, "12"