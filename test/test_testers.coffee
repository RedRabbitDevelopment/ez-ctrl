TestData = require('../test_data/data')
assert = require('assert')
UserController = require '../test_data/routes/users'
AsyncUserController = require '../test_data/routes/async_users'

describe "Testers", ->
  beforeEach ->
    TestData.resetData()
  describe "UserController", ->
    it 'should test the conversion', (done)->
      UserController.testRoute
      done()
