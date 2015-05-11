base = require('../../index')
BaseController = base.BaseController
data = require '../data'
middleware = data.middleware
beforeEach = data.beforeEach
UserData = data.Userdata
ErrorHandler = data.ErrorHandler

module.exports = MyBaseController = BaseController.extend
  isAbstract: true
  beforeEach: ->
    beforeEach.myBaseRan++
  middleware:  (req, res, next)->
    middleware.myBaseRan++
    next()

MyBaseController.prototype.logError = (error)->
  ErrorHandler.logError(error)

