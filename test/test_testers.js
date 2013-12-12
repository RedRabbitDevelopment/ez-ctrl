// Generated by CoffeeScript 1.6.3
(function() {
  var AsyncUserController, TestData, UserController, assert;

  TestData = require('../test_data/data');

  assert = require('assert');

  UserController = require('../test_data/routes/users');

  AsyncUserController = require('../test_data/routes/async_users');

  describe("Testers", function() {
    beforeEach(function() {
      return TestData.resetData();
    });
    return describe("UserController", function() {
      return it('should test the conversion', function(done) {
        UserController.testRoute;
        return done();
      });
    });
  });

}).call(this);