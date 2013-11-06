_ = require('underscore')
FrontEnd = require './frontend'

module.exports =
	controllers: []
	getAllRoutes: ()->
		_.reduce @controllers, (memo, controller)->
			if controller.modelName
				memo[controller.modelName] = controller.getRoutes()
			memo;
		, {}
	registerRoutes: (app)->
		for controller in @controllers
			controller.registerRoutes(app)
		
		app.get '/js/lib/ez-routes.js', (req, res)->
			frontEndJS = FrontEnd.getFrontEndMethods()
			res.end frontEndJS
