_ = require 'underscore'
ControllerManager = require('./manager')
FuncDetails = require('./func-details')

module.exports = FrontEnd =
	registerRoutes: (app)->
		for controller in ControllerManager.controllers
			controller.registerRoutes(app)
		
		app.get '/js/lib/ez-routes.js', (req, res)->
			frontEndJS = FrontEnd.getFrontEndMethods()
			res.setHeader 'Content-Type', 'application/x-javascript; charset=UTF-8'
			res.end frontEndJS

	getFrontEndMethods: ()->
		routes = ControllerManager.getAllRoutes()
		EZController = {}
		for controller, controllerDetails of routes
			EZController._extractData = FuncDetails.argsToData
			EZController._constructPath = (pattern, data)->
				params = pattern.split '/'
				(for param in params
					if variables = param.match /^:(.*?)(\(.*?\))?$/
						variable = variables[1]
						value = data[variable]
						delete data[variable]
						value
					else
						param
				).join "/"

			EZController._constructQuery = (data)->
				result = for value, key of data or {}
					encodeURIComponent(key) + "=" + encodeURIComponent(value)
				if result.length > 0
					"?" + result.join "&"
				else
					""
			
			EZController._isFunction = (obj)->
				!!(obj && obj.constructor && obj.call && obj.apply)
				
			EZController._makeRequest = (routeDetails, args)->
				cb = if EZController._isFunction args[args.length - 1] then args[args.length - 1] else ->
				xmlhttp = if window.XMLHttpRequest
					new XMLHttpRequest()
				else
					new ActiveXObject("Microsoft.XMLHTTP")
				data = EZController._extractData routeDetails.argList, args
				path = EZController._constructPath routeDetails.pattern, data
				
				xmlhttp.onreadystatechange = ->
					if xmlhttp.readyState is 4 and xmlhttp.status is 200
						cb JSON.parse xmlhttp.responseText
				if routeDetails.method is "get"
					query = EZController._constructQuery data
					xmlhttp.open(routeDetails.method, path + query, true)
					xmlhttp.send()
				else
					xmlhttp.open(routeDetails.method, path, true)
					xmlhttp.setRequestHeader("Content-type","application/json");
					xmlhttp.send(JSON.stringify data)
			
			EZController[controller] = {}
			EZController[controller]._routeDetails = {}
			for funcName, funcDetails of controllerDetails
				argString = FuncDetails.extractArgumentString(funcDetails.logic)
				EZController[controller]._routeDetails[funcName] =
					pattern: funcDetails.pattern
					usesId: funcDetails.usesId
					method: funcDetails.method
					argList: FuncDetails.extractArguments funcDetails.logic
				funcString = "(function(" + argString + ") {\n" +
				"	return EZController._makeRequest(this._routeDetails['" + funcName + "'], arguments);\n" +
				"});";
				EZController[controller][funcName] = eval(funcString)
		@convertToFrontEnd 'EZController', EZController
	
	convertToFrontEnd: (object_name, object)->
		output = "var "
		output += object_name + " = (function() {\n"
		output += "\treturn " + @convertToFrontEndRaw object
		output += "\n})();"
		output
	
	convertToFrontEndRaw: (object, depth = 1)->
		tabs = @getTabs depth
		tabs2 = @getTabs depth + 1
		if _.isFunction object
			output = object.toString().replace /\n\s*/mg, '\n' + tabs2
			lastNewLine = output.indexOf("\n")
			output = output.substring(0, lastNewLine) + output.substring(lastNewLine).replace /\n\s*/m, "\n" + tabs
		else if _.isArray object
			output = "[\n"
			output += tabs2 + (@convertToFrontEndRaw(object_item, depth + 1) for object_item in object).join(",\n" + tabs2) + "\n"
			output += tabs + "]"
			output
		else if _.isObject object
			output = "{\n";
			output += tabs2 + (field + ": " + @convertToFrontEndRaw(value, depth + 1) for field, value of object).join(",\n" + tabs2) + "\n"
			output += tabs + "}"
			output
		else if _.isNumber(object) or _.isBoolean object
			"#{object}"
		else if _.isString object
			"'#{object}'"
		else
			'undefined'
	
	getTabs: _.memoize (depth)->
		("\t" while depth--).join ""