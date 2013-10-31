var TestData = require('./test_data'),
	_ = require("underscore"),
	assert = require('assert'),
	base = require('../index');

describe("UserController", function() {
	UserController = TestData.UserController;
	beforeEach(function() {
		TestData.resetData();
	});
	describe("initialization", function() {
		it("should initialize all their data", function() {
			assert.equal(UserController.modelName, "User");
			assert.equal(UserController.basePattern, "/users");
		});
	});
	describe("extractArguments", function() {
		it("should get all the arguments", function() {
			var args = FuncDetails.extractArguments(function(a, b, c) {});
			assert.deepEqual(args, ['a', 'b', 'c']);
		});
		it("shouldn't care about whitespace", function() {
			var args = FuncDetails.extractArguments(function( a,	 b, 
				c) {});
			assert.deepEqual(args, ['a', 'b', 'c']);
		});
		it("shouldn't care about comments", function() {
			var args = FuncDetails.extractArguments(function(/* ab */a, 
				// booya stuff
				b, /* d, */c) /*don't mess with */{
				
				/* don't mess with */
			});
			assert.deepEqual(args, ['a', 'b', 'c']);
		});
		it("should care about the whitespace and comments", function() {
			var argString = FuncDetails.extractArgumentString(function(/* ab */a, 
				// booya stuff
				b, /* d, */c) /*don't mess with */{
				
				/* don't mess with */
			});
			compareTo = "/* ab */a, ";
			compareTo += "				// booya stuff"
			compareTo += "				b, /* d, */c";
			// Remove funky characters for proper comparison
			argString = argString.replace(/\n/g, "");
			assert.equal(argString, compareTo);
		});
	});
	describe("extractLogicArguments", function() {
		var controller = null;
		beforeEach(function() {
			controller = {
				logic: function(b, a, c) {
					return "G";
				},
				extractArguments: UserController.prototype.extractArguments
			};
		});
		it("should get all the arguments", function() {
			var args = UserController.prototype.extractLogicArguments.apply(controller, [{a: 'a', b: 'b', c: 'c'}]);
			assert.deepEqual(args, ['b', 'a', 'c']);
		});
	});
	describe("getRouteDetails", function() {
		it("should work with getAll", function() {
			var routeDetails = UserController.getRouteDetails("getAll");
			assert.equal(routeDetails.method, "get");
			assert.equal(routeDetails.pattern, "/users");
			assert.ok(_.isFunction(routeDetails.logic));
			var users = routeDetails.logic();
			assert.equal(users.length, 3);
		});
		it("should work with get", function() {
			var routeDetails = UserController.getRouteDetails("get");
			assert.equal(routeDetails.method, "get");
			assert.ok(_.isFunction(routeDetails.logic));
			var user = routeDetails.logic(2);
			assert.deepEqual(user, {
				name: "Baby Tate",
				username: "soonToCome",
				password: "password3"
			});
		});
		it("should work with add", function() {
			var routeDetails = UserController.getRouteDetails("add");
			assert.equal(routeDetails.method, "put");
			assert.equal(routeDetails.pattern, "/users");
			assert.ok(_.isFunction(routeDetails.logic));
			var johnnyboy = {
				name: "Johnny Johnson",
				username: "johnnyboy",
				password: "password4"
			}
			var value = routeDetails.logic(johnnyboy);
			assert.ok(value);
			data = TestData.getData();
			assert.ok(data[3]);
			assert.deepEqual(data[3], johnnyboy);
		});
		it("should work with save", function() {
			var routeDetails = UserController.getRouteDetails("save");
			assert.equal(routeDetails.method, "post");
			assert.ok(_.isFunction(routeDetails.logic));
			var newName = "Shirley Tate";
			var value = routeDetails.logic(1, {name: newName});
			assert.ok(value);
			data = TestData.getData();
			assert.ok(data[1]);
			// Make sure the other values weren't affected
			assert.ok(data[1].username, "hotstuff5");
			assert.equal(data[1].name, newName);
		});
		it("should work with a custom method", function() {
			var routeDetails = UserController.getRouteDetails("postLogin");
			assert.equal(routeDetails.method, "post");
			assert.equal(routeDetails.pattern, "/users/login");
			assert.ok(_.isFunction(routeDetails.logic));
			var username = "hotstuff5";
			var password = "password2";
			var value = routeDetails.logic(username, password);
			assert.ok(value);
			assert.throws(
			  function() {
			    throw new Error("Wrong value");
			  },
			  Error
			);
			assert.throws(function() {
				var value = routeDetails.logic(username, "wrongpassword");
			}, /Invalid username or password/);
		});
	});
	describe("validators", function() {
		var controller = null;
		beforeEach(function() {
			var routeDetails = UserController.getRouteDetails("add");
			controller = new UserController(routeDetails);
		});
		it("should pass", function(done) {
			controller.validate({
				name: "Kelly Johnson",
				username: "kellyJohnson",
				password: "password8"
			}).then(function(result) {
				done();
			}, function(error) {
				done(error);
			});
		});
		it("should throw an error", function(done) {
			controller.validate({
				name: "Kel",
				username: "kellyJohnson",
				password: "password8"
			}).then(function(result) {
				done(new Error("Didn't throw an error"));
			}, function(error) {
				errors = error.error;
				assert.ok(errors.name);
				assert.equal(errors.name.length, 1);
				assert.equal(errors.name[0], "must be greater than 8");
				done();
			}).fail(function(error) {
				done(error);
			});
		});
		it("should throw multiple errors", function(done) {
			controller.validate({
				name: "Kel",
				username: "kel",
				password: "password8"
			}).then(function(result) {
				done(new Error("Didn't throw an error"));
			}, function(error) {
				errors = error.error;
				assert.ok(errors.name);
				assert.ok(errors.username);
				assert.equal(errors.username.length, 1);
				assert.equal(errors.name.length, 1);
				assert.equal(errors.name[0], "must be greater than 8");
				assert.equal(errors.username[0], "must be greater than 9");
				done();
			}).fail(function(error) {
				done(error);
			});
		});
		it("should throw custom errors", function(done) {
			var routeDetails = UserController.getRouteDetails("save");
			controller = new UserController(routeDetails);
			controller.validate({
				id: 18,
				name: "Kelsey Johnson",
				username: "yourdeveloperfriend",
				password: "password8"
			}).then(function(result) {
				done(new Error("Didn't throw an error"));
			}, function(error) {
				errors = error.error;
				assert.ok(errors.username);
				assert.ok(errors.id);
				assert.equal(errors.username.length, 1);
				assert.equal(errors.id.length, 1);
				assert.equal(errors.id[0], "does not exist");
				assert.equal(errors.username[0], "must be unique");
				done();
			}).fail(function(error) {
				done(error);
			});
		});
		it("should pass custom errors", function(done) {
			var routeDetails = UserController.getRouteDetails("save");
			controller = new UserController(routeDetails);
			controller.validate({
				id: 2,
				name: "Kelsey Johnson"
			}).then(function(result) {
				done();
			}, function(error) {
				done(error);
			});
		});
	});
	describe("front-end functionality", function() {
		it("should give me all the routes", function() {
			var allRoutes = base.ControllerManager.getAllRoutes();
			assert.ok(allRoutes.AsyncUser && allRoutes.User);
		});
		it("should give me a string", function() {
			/* Not done
			var frontEndMethods = base.FrontEnd.getFrontEndMethods();
			assert.ok(frontEndMethods);
			try {
				var FrontEnd = eval(frontEndMethods);
			} catch(e) {
				assert.fail("", e);
			}
			*/
		});
	});
})