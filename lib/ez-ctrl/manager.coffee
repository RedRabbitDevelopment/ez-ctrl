_ = require('underscore')

unbindedGetAllRoutes = (controllers)->
	_.reduce @controllers, (memo, controller)->
		if controller.modelName
			memo[controller.modelName] = controller.getRoutes()
		memo
	, {}

unbindedRegisterRoutes = (app)->
	for controller in @controllers
		controller.registerRoutes app

module.exports = class ControllerManager
	constructor: ->
		@controllers = []
	getAllRoutes: unbindedGetAllRoutes
	readdir: (dirname)->
		Q.fninvoke(fs.readdir, dirname).then (files)=>
			for file in files
				if index = file.indexOf '.js'
					file = file.substr 0, index
					@controllers.push require file
	registerRoutes: unbindedRegisterRoutes
	@controllers: []
	@getAllRoutes: unbindedGetAllRoutes
	@registerRoutes: unbindedRegisterRoutes
