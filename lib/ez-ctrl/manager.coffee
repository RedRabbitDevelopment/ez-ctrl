_ = require('underscore')

module.exports = ControllerManager =
	controllers: [],
	getAllRoutes: ()->
		_.reduce @controllers, (memo, controller)->
			if controller.modelName
				memo[controller.modelName] = controller.getRoutes()
			memo;
		, {}
	registerRoutes: (app)->
		for controller in @controllers
			controller.registerRoutes(app)