var express = require('express'),
	http = require('http'),
	Q = require('q'),
	assert = require('assert'),
	_ = require("underscore"),
	TestData = require('./test_data');
	
describe("Test Server", function() {
	beforeEach(function() {
		TestData.resetData();
	});
	var server;
	before(function(done) {
		var app = express();
		app.use(express.json());
		app.use(express.urlencoded());
		TestData.UserController.registerRoutes(app);
		TestData.AsyncUserController.registerRoutes(app);
		server = http.createServer(app);
		server.listen(3000, function() {
			done();
		});
	});
	after(function(done) {
		server.close(done);
	})
	var makeRequest = function(data, postData) {
		var deferred = Q.defer();
		data.port = 3000;
		data.hostname = "localhost";
		data.headers = {
			"Content-Type": "application/json"
		};
		var req = http.request(data, function(res) {
			var data = "";
			res.setEncoding("utf8");
			res.on("data", function(chunk) {
				data += chunk;
			});
			res.on("end", function() {
				try {
					deferred.resolve(JSON.parse(data));
				} catch(e) {
					console.log(e, data);
					deferred.reject("Failed to parse json");
				}
			});
		}).on("error", function(error) {
			deferred.reject("Request error" + error);
		});
		if(postData) {
			req.write(JSON.stringify(postData));
		}
		req.end();
		return deferred.promise;
	}
	doIt = function(type) {
		describe("making a " + type + " request", function() {
			it("should successfully make the request", function(done) {
				makeRequest({
					path: "/" + type
				}).then(function(data) {
					assert.ok(data && data.response);
					assert.ok(_.isArray(data.response));
					assert.equal(data.response.length, 3);
					assert.equal(data.response[0].name, "Nathan Tate");
					done();
				}).fail(function(error) {
					done(error);
				});
			});
			it("should get a single user", function(done) {
				makeRequest({
					path: "/" + type + "/2"
				}).then(function(data) {
					assert.ok(data && data.response);
					assert.equal(data.response.name, "Baby Tate");
					done();
				}).fail(function(error) {
					done(error);
				});
			});
			it("should update a single user", function(done) {
				makeRequest({
					method: "POST",
					path: "/" + type + "/2"
				}, {
					name: "Ren Tate"
				}).then(function(data) {
					assert.ok(data && data.success && data.response);
					userData = TestData.getData()[2];
					assert.equal(userData.name, "Ren Tate");
					assert.equal(userData.username, "soonToCome");
					done();
				}).fail(function(error) {
					done(error);
				});
			});
		});
	}
	doIt("users");
	doIt("async_users");
	describe("special cases", function() {
		it("should throw an error", function(done) {
			makeRequest({
				method: "GET",
				path: "/users/faulty"
			}).then(function(data) {
				assert.ok(data);
				assert.equal(data.success, false);
				assert.equal(data.error, 'Server Error');
				assert.equal(TestData.errors.length, 1);
				assert.equal(TestData.errors[0].message, 'object is not a function');
				done();
			}).fail(function(error) {
				done(error);
			});
		});
		it("should use an id", function(done) {
			makeRequest({
				method: "GET",
				path: "/users/1/uses-id"
			}).then(function(data) {
				assert.ok(data);
				assert.equal(data.success, true);
				assert.equal(data.response, 'Result');
				done();
			}).fail(function(error) {
				done(error);
			});
		});
	});
});
