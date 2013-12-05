_ = require('underscore')

module.exports =
	controllers: []
	getAllRoutes: ()->
		_.reduce @controllers, (memo, controller)->
			if controller.modelName
				memo[controller.modelName] = controller.getRoutes()
			memo
		, {}
