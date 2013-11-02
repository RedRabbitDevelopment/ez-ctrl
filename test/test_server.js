// Generated by CoffeeScript 1.6.3
var ControllerManager, Q, TestData, assert, express, http, _;

express = require('express');

http = require('http');

Q = require('q');

assert = require('assert');

_ = require("underscore");

TestData = require('./test_data');

ControllerManager = require('../index').ControllerManager;

describe("Test Server", function() {
  var doIt, makeRequest, server;
  server = null;
  beforeEach(function() {
    return TestData.resetData();
  });
  before(function(done) {
    var app;
    app = express();
    app.use(express.json());
    app.use(express.urlencoded());
    ControllerManager.registerRoutes(app);
    server = http.createServer(app);
    return server.listen(3000, function() {
      return done();
    });
  });
  after(function(done) {
    return server.close(done);
  });
  makeRequest = function(data, postData) {
    var deferred, req;
    deferred = Q.defer();
    data.port = 3000;
    data.hostname = "localhost";
    data.headers = {
      "Content-Type": "application/json"
    };
    req = http.request(data, function(res) {
      data = "";
      res.setEncoding("utf8");
      res.on("data", function(chunk) {
        return data += chunk;
      });
      return res.on("end", function() {
        var e;
        try {
          return deferred.resolve(JSON.parse(data));
        } catch (_error) {
          e = _error;
          console.log(e, data);
          return deferred.reject("Failed to parse json");
        }
      });
    }).on("error", function(error) {
      return deferred.reject("Request error" + error);
    });
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
    return deferred.promise;
  };
  doIt = function(type) {
    return describe("making a " + type + " request", function() {
      it("should successfully make the request", function(done) {
        return makeRequest({
          path: "/" + type
        }).then(function(data) {
          assert.ok(data);
          assert.ok(data.response);
          assert.ok(_.isArray(data.response));
          assert.equal(data.response.length, 3);
          assert.equal(data.response[0].name, "Nathan Tate");
          return done();
        }).fail(function(error) {
          return done(error);
        });
      });
      it("should get a single user", function(done) {
        return makeRequest({
          path: "/" + type + "/2"
        }).then(function(data) {
          assert.ok(data);
          assert.ok(data.response);
          assert.equal(data.response.name, "Baby Tate");
          return done();
        }).fail(function(error) {
          return done(error);
        });
      });
      return it("should update a single user", function(done) {
        return makeRequest({
          method: "POST",
          path: "/" + type + "/2"
        }, {
          name: "Ren Tate"
        }).then(function(data) {
          var userData;
          assert.ok(data);
          assert.ok(data.response);
          assert.ok(data.success);
          userData = TestData.getData()[2];
          assert.equal(userData.name, "Ren Tate");
          assert.equal(userData.username, "soonToCome");
          return done();
        }).fail(function(error) {
          return done(error);
        });
      });
    });
  };
  doIt("users");
  doIt("async_users");
  return describe("special cases", function() {
    it("should throw an error", function(done) {
      var error;
      error = null;
      TestData.ErrorHandler.expect(function(e) {
        return error = e;
      });
      return makeRequest({
        method: "GET",
        path: "/users/faulty"
      }).then(function(data) {
        assert.ok(data);
        assert.equal(data.success, false);
        assert.equal(data.error, 'Server Error');
        assert.ok(error);
        assert.equal(error.message, 'object is not a function');
        return done();
      }).fail(function(error) {
        return done(error);
      });
    });
    it("should use an id", function(done) {
      return makeRequest({
        method: "GET",
        path: "/users/1/uses-id"
      }).then(function(data) {
        assert.ok(data);
        assert.equal(data.success, true);
        assert.equal(data.response, 'Result');
        return done();
      }).fail(function(error) {
        return done(error);
      });
    });
    return describe("middleware", function() {
      it("should run base and user", function(done) {
        return makeRequest({
          method: "GET",
          path: '/users/1'
        }).then(function(data) {
          assert.equal(TestData.middleware.myBaseRan, 1);
          assert.equal(TestData.middleware.userRan, 1);
          assert.equal(TestData.middleware.asyncRan, 0);
          return done();
        }).fail(function(reason) {
          return done(reason);
        });
      });
      return it("should run base and async", function(done) {
        return makeRequest({
          method: "GET",
          path: '/async_users/1'
        }).then(function(data) {
          assert.equal(TestData.middleware.myBaseRan, 1);
          assert.equal(TestData.middleware.userRan, 0);
          assert.equal(TestData.middleware.asyncRan, 1);
          return done();
        }).fail(function(reason) {
          return done(reason);
        });
      });
    });
  });
});
