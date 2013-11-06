FuncDetails = require('./func-details')
ControllerManager = require('./manager')

module.exports = FrontEnd =
	registerRoutes: (app)->
		for controller in ControllerManager.controllers
			controller.registerRoutes(app)
		
		app.get '/js/lib/ez-routes.js', (req, res)->
			frontEndJS = FrontEnd.getFrontEndMethods()
			res.end frontEndJS

	getFrontEndMethods: ()->
		routes = ControllerManager.getAllRoutes()
		ZController = {}
		for controller, controllerDetails in routes
			EZController._makeRequest = (routeDetails, args)->
				
			
			EZController[controller] = {}
			EZController[controller]._routeDetails = {}
			for funcDetails, funcName of controllerDetails
				EZController[controller]._routeDetails[funcName] =
					pattern: funcDetails.pattern
					usesId: funcDetails.usesId
					method: funcDetails.method
				argString = FuncDetails.extractArgumentString(funcDetails.logic)
				funcString = "function logic(" + argString + ") {\n" +
				"	EZController._makeRequest(this._routeDetails['" + funcName + "'], arguments);\n" +
				"};";
				EZController[controller][funcName] = eval(funcString)
		EZController.toString()