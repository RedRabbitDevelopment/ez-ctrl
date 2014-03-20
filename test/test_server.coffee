http = require 'http'
Q = require 'q'
assert = require 'assert'
_ = require "underscore"
TestData = require '../test_data/data'
TestServer = require '../test_data/server'
  
describe "Test Server", ->
  before (done)->
    TestServer.start done
  after (done)->
    TestServer.close done
  beforeEach ->
    TestData.resetData()
  makeRequest = (data, postData)->
    deferred = Q.defer()
    data.port = 3000
    data.hostname = "localhost"
    data.headers =
      "Content-Type": "application/json"
    req = http.request data, (res)->
      data = ""
      res.setEncoding "utf8"
      res.on "data", (chunk)->
        data += chunk
      res.on "end", ->
        try
          deferred.resolve JSON.parse(data)
        catch e
          console.log e, data
          deferred.reject "Failed to parse json"
    .on "error", (error)->
      deferred.reject "Request error" + error
    if postData
      req.write JSON.stringify postData
    req.end()
    deferred.promise
  doIt = (type)->
    describe "making a #{type} request", ->
      it "should successfully make the request", (done)->
        makeRequest
          path: "/" + type
        .then (data)->
          assert.ok data
          assert.ok data.response
          assert.ok _.isArray data.response
          assert.equal data.response.length, 3
          assert.equal data.response[0].name, "Nathan Tate"
          done()
        .fail (error)->
          done(error)
      it "should get a single user", (done)->
        makeRequest
          path: "/#{type}/2"
        .then (data)->
          assert.ok data
          assert.ok data.response
          assert.equal data.response.name, "Baby Tate"
          done()
        .fail (error)->
          done error
      it "should update a single user", (done)->
        makeRequest
          method: "POST",
          path: "/#{type}/2"
        ,
          name: "Ren Tate"
        .then (data)->
          assert.ok data
          assert.ok data.response
          assert.ok data.success
          userData = TestData.getData()[2]
          assert.equal userData.name, "Ren Tate"
          assert.equal userData.username, "soonToCome"
          done()
        .fail (error)->
          done error
      it "should add a single user", (done)->
        makeRequest
          method: "PUT",
          path: "/#{type}"
        ,
          name: "Another Tate"
          username: "AnotherTate"
          password: "booyaBaby"
        .then (data)->
          assert.ok data
          assert.ok data.response
          assert.ok data.success
          userData = TestData.getData()[3]
          assert.equal userData.name, "Another Tate"
          assert.equal userData.username, "AnotherTate"
          assert.equal userData.password, "booyaBaby"
          done()
        .fail (error)->
          done error
  doIt "users"
  doIt "async_users"
  describe "special cases", ->
    it "should throw an error", (done)->
      error = null
      TestData.ErrorHandler.expect (e)->
        error = e
      makeRequest
        method: "GET",
        path: "/users/faulty"
      .then (data)->
        assert.ok data
        assert.equal data.success, false
        assert.equal data.error, 'Server Error'
        assert.ok error
        assert.equal error.message, 'object is not a function'
        done()
      .fail (error)->
        done error
    it 'shouldnt fail on a 0', (done)->
      makeRequest
        method: 'POST'
        path: '/users/test-zero'
      ,
        name: 0
      .then (data)->
        assert.ok data
        assert.equal data.success, true
        assert.equal data.response, 'Result'
        done()
      .fail done
    it "should use an id", (done)->
      makeRequest
        method: "GET",
        path: "/users/1/uses-id"
      .then (data)->
        assert.ok data
        assert.equal data.success, true
        assert.equal data.response, 'Result'
        done()
      .fail (error)->
        done error
    it 'should give me required error', (done)->
      makeRequest
        method: "POST"
        path: "/users/login"
      ,
        username: "NathanTate"
        password: "GAH"
      .then (data)->
        assert.ok data
        assert.equal data.success, false
        assert.equal data.error, 'Invalid username or password'
        done()
      .fail (error)->
        done error
    it "should give me required validation error", (done)->
      makeRequest
        method: "PUT",
        path: "/users"
      ,
        name: "Booya Baby"
      .then (data)->
        assert.ok data
        assert.equal data.success, false
        assert.equal data.errors.username[0], "is required"
        assert.equal data.errors.password[0], "is required"
        done()
      .fail (error)->
        done error
    it 'shouldn\'t let me use an array when a string is required', (done)->
      makeRequest
        method: 'PUT'
        path: '/users'
      ,
        name: ['booya', 'baby']
        username: 'ggggggggg'
        password: 'hahahahahaha'
      .then (data)->
        assert.ok data
        assert.equal data.success, false
        assert.equal data.errors.name[0], 'must be a string'
        done()
      .fail (error)->
        done error
    describe "middleware", ->
      it "should run base and user", (done)->
        makeRequest
          method: "GET"
          path: '/users/1'
        .then (data)->
          assert.equal TestData.middleware.myBaseRan, 1
          assert.equal TestData.middleware.userRan, 1
          assert.equal TestData.middleware.asyncRan, 0
          done()
        .fail (reason)->
          done reason
      it "should run base and async", (done)->
        makeRequest
          method: "GET"
          path: '/async_users/1'
        .then (data)->
          assert.equal TestData.middleware.myBaseRan, 1
          assert.equal TestData.middleware.userRan, 0
          assert.equal TestData.middleware.asyncRan, 1
          done()
        .fail (reason)->
          done reason
    describe "beforeEach", ->
      it "should run base and user", (done)->
        makeRequest
          method: "GET"
          path: '/users/1'
        .then (data)->
          assert.equal TestData.beforeEach.myBaseRan, 1
          assert.equal TestData.beforeEach.userRan, 1
          assert.equal TestData.beforeEach.asyncRan, 0
          done()
        .fail (reason)->
          done reason
      it "should run base and async", (done)->
        makeRequest
          method: "GET"
          path: '/async_users/1'
        .then (data)->
          assert.equal TestData.beforeEach.myBaseRan, 1
          assert.equal TestData.beforeEach.userRan, 0
          assert.equal TestData.beforeEach.asyncRan, 2
          done()
        .fail (reason)->
          done reason
      it "should run on before too", (done)->
        makeRequest
          method: "GET"
          path: '/async_users/before-each-crazy'
        .then (data)->
          assert.equal TestData.beforeEach.myBaseRan, 1
          assert.equal TestData.beforeEach.userRan, 0
          assert.equal TestData.beforeEach.asyncRan, 2
          assert.ok TestData.beforeEach.other.crazy
          done()
        .fail (reason)->
          done reason
