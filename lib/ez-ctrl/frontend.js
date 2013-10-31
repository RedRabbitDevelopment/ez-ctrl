var FuncDetails = require('./func-details'),
	ControllerManager = require('./manager');


module.exports = {
	getFrontEndMethods: function() {
		var routes = ControllerManager.getAllRoutes();
		var EZController = {};
		for(controller in routes) {
			controllerDetails = routes[controller];
			EZController._makeRequest = function(routeDetails, args) {
				
			}
			EZController[controller] = {};
			EZController[controller]._routeDetails = {}
			for(funcName in controllerDetails) {
				funcDetails = controllerDetails[funcName];
				EZController[controller]._routeDetails[funcName] = {
					pattern: funcDetails.pattern,
					usesId: funcDetails.usesId,
					method: funcDetails.method
				};
				argString = FuncDetails.extractArgumentString(funcDetails.logic);
				var funcString = "function logic(" + argString + ") {\n" +
				"	EZController._makeRequest(this._routeDetails['" + funcName + "'], arguments);\n" +
				"};";
				EZController[controller][funcName] = eval(funcString);
			}
		}
		return EZController.toString();
	}
}