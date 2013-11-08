// Generated by CoffeeScript 1.6.3
var TestData, Validator, assert, base, _;

TestData = require('../test_data/data');

_ = require("underscore");

assert = require('assert');

base = require('../index');

Validator = base.Validator;

describe("UserController", function() {
  var FuncDetails, UserController;
  UserController = TestData.UserController;
  FuncDetails = base.FuncDetails;
  beforeEach(function() {
    return TestData.resetData();
  });
  describe("initialization", function() {
    return it("should initialize all their data", function() {
      assert.equal(UserController.modelName, "User");
      return assert.equal(UserController.basePattern, "/users");
    });
  });
  describe("extractArguments", function() {
    it("should get all the arguments", function() {
      var args;
      args = FuncDetails.extractArguments(function(a, b, c) {});
      return assert.deepEqual(args, ['a', 'b', 'c']);
    });
    it("shouldn't care about whitespace", function() {
      var args;
      args = FuncDetails.extractArguments(function( a,	 b, 
				c) {});
      return assert.deepEqual(args, ['a', 'b', 'c']);
    });
    it("shouldn't care about comments", function() {
      var args;
      args = FuncDetails.extractArguments(function(/* ab */a, 
				// booya stuff
				b, /* d, */c) /*don't mess with */{
				
				/* don't mess with */ });
      return assert.deepEqual(args, ['a', 'b', 'c']);
    });
    return it("should care about the whitespace and comments", function() {
      var argString, compareTo;
      argString = FuncDetails.extractArgumentString(function(/* ab */a, 
				// booya stuff
				b, /* d, */c) /*don't mess with */{
				
				/* don't mess with */ });
      compareTo = "/* ab */a, ";
      compareTo += "				// booya stuff";
      compareTo += "				b, /* d, */c";
      argString = argString.replace(/\n/g, "");
      return assert.equal(argString, compareTo);
    });
  });
  describe("extractLogicArguments", function() {
    it("should get all the arguments", function() {
      var args, controller_logic;
      controller_logic = function(b, a, c) {
        return "G";
      };
      args = FuncDetails.dataToArgs(controller_logic, {
        a: 'a',
        b: 'b',
        c: 'c'
      });
      return assert.deepEqual(args, ['b', 'a', 'c']);
    });
    it("should compile all the data into one variable", function() {
      var args, controller_logic;
      controller_logic = function(_data) {
        return "G";
      };
      args = FuncDetails.dataToArgs(controller_logic, {
        a: 'a',
        b: 'b',
        c: 'c'
      });
      return assert.deepEqual(args, [
        {
          a: 'a',
          b: 'b',
          c: 'c'
        }
      ]);
    });
    return it("should compile all the data into one variable", function() {
      var args, controller_logic;
      controller_logic = function(a, _data) {
        return "G";
      };
      args = FuncDetails.dataToArgs(controller_logic, {
        a: 'a',
        b: 'b',
        c: 'c'
      });
      return assert.deepEqual(args, [
        'a', {
          b: 'b',
          c: 'c'
        }
      ]);
    });
  });
  describe("getRouteDetails", function() {
    it("should work with query", function() {
      var routeDetails, users;
      routeDetails = UserController.getRouteDetails("query");
      assert.equal(routeDetails.method, "get");
      assert.equal(routeDetails.pattern, "/users");
      assert.ok(_.isFunction(routeDetails.logic));
      users = routeDetails.logic();
      return assert.equal(users.length, 3);
    });
    it("should work with get", function() {
      var routeDetails, user;
      routeDetails = UserController.getRouteDetails("get");
      assert.equal(routeDetails.method, "get");
      assert.ok(_.isFunction(routeDetails.logic));
      user = routeDetails.logic(2);
      return assert.deepEqual(user, {
        name: "Baby Tate",
        username: "soonToCome",
        password: "password3"
      });
    });
    it("should work with add", function() {
      var data, johnnyboy, routeDetails, value;
      routeDetails = UserController.getRouteDetails("add");
      assert.equal(routeDetails.method, "put");
      assert.equal(routeDetails.pattern, "/users");
      assert.ok(_.isFunction(routeDetails.logic));
      johnnyboy = {
        name: "Johnny Johnson",
        username: "johnnyboy",
        password: "password4"
      };
      value = routeDetails.logic(johnnyboy);
      assert.ok(value);
      data = TestData.getData();
      assert.ok(data[3]);
      return assert.deepEqual(data[3], johnnyboy);
    });
    it("should work with save", function() {
      var data, newName, routeDetails, value;
      routeDetails = UserController.getRouteDetails("save");
      assert.equal(routeDetails.method, "post");
      assert.ok(_.isFunction(routeDetails.logic));
      newName = "Shirley Tate";
      value = routeDetails.logic(1, {
        name: newName
      });
      assert.okvalue;
      data = TestData.getData();
      assert.ok(data[1]);
      assert.ok(data[1].username, "hotstuff5");
      return assert.equal(data[1].name, newName);
    });
    return it("should work with a custom method", function() {
      var password, routeDetails, username, value;
      routeDetails = UserController.getRouteDetails("postLogin");
      assert.equal(routeDetails.method, "post");
      assert.equal(routeDetails.pattern, "/users/login");
      assert.ok(_.isFunction(routeDetails.logic));
      username = "hotstuff5";
      password = "password2";
      value = routeDetails.logic(username, password);
      assert.ok(value);
      return assert.throws(function() {
        return value = routeDetails.logic(username, "wrongpassword");
      }, /Invalid username or password/);
    });
  });
  describe("controller validators", function() {
    var controller;
    controller = null;
    beforeEach(function() {
      var routeDetails;
      routeDetails = UserController.getRouteDetails("add");
      return controller = new UserController(routeDetails);
    });
    it('should get validation', function() {
      assert.ok(controller.validation);
      assert.equal(controller.validation.name.required, true);
      assert.equal(controller.validation.username.required, true);
      return assert.equal(controller.validation.password.required, true);
    });
    it("should pass", function(done) {
      return controller.validate({
        name: "Kelly Johnson",
        username: "kellyJohnson",
        password: "password8"
      }).then(function(result) {
        return done();
      }, function(error) {
        console.log(error);
        return done(error);
      });
    });
    it("should throw an error", function(done) {
      return controller.validate({
        name: "Kel",
        username: "kellyJohnson",
        password: "password8"
      }).then(function(result) {
        return done(new Error("Didn't throw an error"));
      }, function(error) {
        var errors;
        errors = error.error;
        assert.ok(errors.name);
        assert.equal(errors.name.length, 1);
        assert.equal(errors.name[0], "String is not in range");
        return done();
      }).fail(function(error) {
        return done(error);
      });
    });
    it("should throw multiple errors", function(done) {
      return controller.validate({
        name: "Kel",
        username: "kel",
        password: "password8"
      }).then(function(result) {
        return done(new Error("Didn't throw an error"));
      }, function(error) {
        var errors;
        errors = error.error;
        assert.ok(errors.name);
        assert.ok(errors.username);
        assert.equal(errors.username.length, 1);
        assert.equal(errors.name.length, 1);
        assert.equal(errors.name[0], "String is not in range");
        assert.equal(errors.username[0], "String is not in range");
        return done();
      }).fail(function(error) {
        return done(error);
      });
    });
    it("should throw custom errors", function(done) {
      var routeDetails;
      routeDetails = UserController.getRouteDetails("save");
      controller = new UserController(routeDetails);
      return controller.validate({
        id: 18,
        name: "Kelsey Johnson",
        username: "yourdeveloperfriend",
        password: "password8"
      }).then(function(result) {
        return done(new Error("Didn't throw an error"));
      }, function(error) {
        var errors;
        errors = error.error;
        assert.ok(errors.username);
        assert.ok(errors.id);
        assert.equal(errors.username.length, 1);
        assert.equal(errors.id.length, 1);
        assert.equal(errors.id[0], "does not exist");
        assert.equal(errors.username[0], "must be unique");
        return done();
      }).fail(function(error) {
        return done(error);
      });
    });
    return it("should pass custom errors", function(done) {
      var routeDetails;
      routeDetails = UserController.getRouteDetails("save");
      controller = new UserController(routeDetails);
      return controller.validate({
        id: 2,
        name: "Kelsey Johnson"
      }).then(function(result) {
        return done();
      }, function(error) {
        return done(error);
      });
    });
  });
  describe('Validator', function() {
    it("should get the appropriate messages", function(done) {
      return Validator.validate({
        name: {
          required: true,
          len: 9
        },
        username: {
          required: true,
          type: 'alphaNumeric',
          unique: true,
          len: 9
        },
        password: {
          required: true,
          type: 'alphaNumeric',
          len: 8
        }
      }, {
        name: "Booya Baby"
      }).then(function() {
        return done(new Error("didn't throw error"));
      }).fail(function(result) {
        assert.equal(result.message, 'validate');
        assert.equal(result.error.username.length, 1);
        assert.equal(result.error.username[0], 'is required');
        assert.equal(result.error.password.length, 1);
        assert.equal(result.error.password[0], 'is required');
        return done();
      }).fail(function(error) {
        return done(error);
      });
    });
    it("should fail", function(done) {
      return Validator.runValidate(void 0, "required", true, "username").then(function(result) {
        return done(result);
      }, function(error) {
        assert.equal(error, 'is required');
        return done();
      }).fail(function(result) {
        console.log('error', result);
        return done(result);
      });
    });
    it("should give me an appropriate error", function(done) {
      return Validator.runValidate("no-oolong", "len", 8, "username").then(function(result) {
        return done(result);
      }, function(error) {
        assert.equal(error, 'is required');
        return done();
      }).fail(function(result) {
        return done(result);
      });
    });
    it("should get me a readable error", function(done) {
      return Validator.validateField({
        required: true
      }, "username", void 0, true).then(function(result) {
        return done(new Error("didn't fail"));
      }, function(result) {
        assert.equal(result.field, "username");
        assert.equal(result.errors.length, 1);
        assert.equal(result.errors[0], "is required");
        return done();
      }).fail(function(error) {
        return done(error);
      });
    });
    return it("should get me multiple readable errors", function(done) {
      return Validator.validateField({
        len: 8,
        type: "alphanumeric"
      }, "username", "no-long", true).then(function(result) {
        return done(new Error("didn't fail"));
      }, function(result) {
        assert.equal(result.field, "username");
        assert.equal(result.errors.length, 2);
        assert.equal(result.errors[0], "String is not in range");
        assert.equal(result.errors[1], "must be alphanumeric");
        return done();
      }).fail(function(error) {
        return done(error);
      });
    });
  });
  describe("front-end functionality", function() {
    it("should give me all the routes", function() {
      var allRoutes;
      allRoutes = base.ControllerManager.getAllRoutes();
      return assert.ok(allRoutes.AsyncUser && allRoutes.User);
    });
    return it("should give me a string", function() {
      /* Not done
      			frontEndMethods = base.FrontEnd.getFrontEndMethods()
      			assert.ok frontEndMethods
      			try {
      				FrontEnd = eval(frontEndMethods)
      			} catch(e) {
      				assert.fail("", e)
      			}
      */

    });
  });
  return describe("converter", function() {
    var Converter;
    Converter = base.Converter;
    it("should convert a string to an integer", function() {
      return assert.strictEqual(Converter.convertField("5", "int"), 5);
    });
    it("should convert a string to an float", function() {
      return assert.strictEqual(Converter.convertField("55.5", "float"), 55.5);
    });
    it("shouldn't convert something it doesn't recognize", function() {
      return assert.equal(Converter.convertField("abcda", "fakeType"), "abcda");
    });
    it("should convert a non-integer string to NaN", function() {
      return assert.ok(_.isNaN(Converter.convertField("abcda", "int")));
    });
    return it("should convert a whole group of values", function() {
      var newData;
      newData = Converter.convert({
        booya: {
          type: 'int'
        },
        gee: {
          type: 'float'
        }
      }, {
        booya: '5',
        gee: '77.2',
        wizz: '12'
      });
      assert.strictEqual(newData.booya, 5);
      assert.strictEqual(newData.gee, 77.2);
      return assert.strictEqual(newData.wizz, "12");
    });
  });
});
