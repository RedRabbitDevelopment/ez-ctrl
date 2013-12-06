Q = require('q')
base = require('../../index')
BaseController = base.BaseController
data = require '../data'
middleware = data.middleware
UserData = data.Userdata
ErrorHandler = data.ErrorHandler

module.exports = MyBaseController = BaseController.extend
	isAbstract: true
	beforeEach:  (req, res, next)->
		middleware.myBaseRan++
		next()

MyBaseController.prototype.logError = (error)->
	ErrorHandler.logError(error)

