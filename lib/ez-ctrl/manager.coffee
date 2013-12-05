_ = require('underscore')

module.exports = class ControllerManager
	constructor: ->
		@controllers = []
	getAllRoutes: ()->
		_.reduce @controllers, (memo, controller)->
			if controller.modelName
				memo[controller.modelName] = controller.getRoutes()
			memo
		, {}
	readdir: (dirname)->
		Q.fninvoke(fs.readdir, dirname).then (files)=>
			for file in files
				if index = file.indexOf '.js'
					file = file.substr 0, index
					@addController require file
	registerRoutes: (app)->
		for controller in @controllers
			controller.registerRoutes app
	
	addController: (ctrl)->
		@controllers.push ctrl

