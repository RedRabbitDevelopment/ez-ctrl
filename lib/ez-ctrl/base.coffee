FuncDetails = require('./func-details')
ControllerManager = require('./manager')
Converter = require('./converter')
Q = require('q')
_ = require('underscore')
inflection = require('inflection')
Converter = require('./converter')
Validator = require('./validator')

module.exports = BaseController =
	beforeEachMiddleware: []
	extend: (options) ->
		middleware = options.beforeEach
		NewController = (routeDetails) ->
			_.extend(this, routeDetails)
			if _.isFunction @initialize
				@initialize()
		_.extend(NewController, this, options)
		middleware = if middleware then @beforeEachMiddleware.concat middleware else @beforeEachMiddleware.slice 0
		NewController.beforeEachMiddleware = middleware
		_.extend(NewController.prototype, @prototype)
		if options.name
			NewController.setBaseData(options.name)
		ControllerManager.controllers.push(NewController)
		NewController

	setBaseData: (name) ->
		@modelName = name
		@tableName = inflection.tableize(@modelName)
		@basePattern = "/" + @tableName
		@individualPattern = @basePattern + "/:id([0-9]+)"
		@methods = ["get", "put", "post", "delete"]
	
	getRouteDetails: (route) ->
		usesId = false
		routeDetails = @routes[route]
		switch route
			when "getAll"
				method = "get"
				pattern = @basePattern
			when "get"
				method = "get"
				pattern = @individualPattern
				usesId = true
			when "add" or "put"
				method = "put"
				pattern = @basePattern
			when "save" or 'post'
				method = "post"
				pattern = @individualPattern
				usesId = true
			when "delete"
				method = "delete"
				pattern = @individualPattern
				usesId = true
			else
				remainingRoute = route
				method = "get"
				for m in @methods
					if route.indexOf(m) is 0
						method = m
						remainingRoute = route.substring(method.length)
						break
				
				# Convert MakeComment into make-comment
				remainingRoute = inflection.underscore(remainingRoute)
				remainingRoute = inflection.dasherize(remainingRoute)
				
				if routeDetails.usesId
					pattern = @individualPattern + "/" + remainingRoute
				else
					pattern = @basePattern + "/" + remainingRoute
				
		if routeDetails.method
			method = routeDetails.method
		if routeDetails.pattern
			pattern = routeDetails.pattern
		if routeDetails.usesId
			usesId = routeDetails.usesId
		logic = if _.isFunction(routeDetails) then routeDetails else routeDetails.logic
		validation = routeDetails.validation || {}
		middleware = if routeDetails.before
			if _.isFunction routeDetails.before
				[routeDetails.before]
			else
				routeDetails.before
		else
			[]
		
		method: method
		logic: logic
		pattern: pattern
		validation: validation
		usesId: usesId
		middleware: middleware
			
	registerRoute: (app, routeDetails) ->
		middleware = @getMiddleWare(routeDetails)
		app[routeDetails.method](routeDetails.pattern, middleware, @handleRequest.bind(this, routeDetails))
	
	getMiddleWare: (routeDetails)->
		@beforeEachMiddleware.concat routeDetails.middleware
	
	handleRequest: (routeDetails, req, res, next) ->
		ThisController = this
		controller = new ThisController(routeDetails)
		controller.handleRequest(req, res)
	
	getRoutes: () ->
		routes = {}
		routes[route] = @getRouteDetails(route) for route, r of @routes
		routes
		
	registerRoutes: (app) ->
		routes = @getRoutes()
		for route, routeDetails of routes
			@registerRoute(app, routeDetails)
			
BaseController.prototype =
	handleRequest: (req, res) ->
		@request = req
		@response = res
		Q.when().then () =>
			@getData()
		.then (data) =>
			@convert(data)
		.then (data) =>
			@validate(data)
		.then (data) =>
			logicArguments = @extractLogicArguments(data)
			@logic.apply(_this, logicArguments)
		.then (response) =>
			@sendResponse(response)
		, (reason) =>
			@sendErrorResponse(reason)
		
	
	getRequestData: (field) ->
		@request.param(field)
		
	getData: () ->
		data = {}
		for field, value of @validation
			value = @getRequestData field
			if value
				data[field] = value
		data
		
	extractLogicArguments: (data) ->
		args = FuncDetails.extractArguments(@logic)
		argData = []
		unseenData = _.extend({}, data)
		argData = (for arg, i in args
			if arg is "_data"
				_dataPosition = i
				null
			else
				delete unseenData[arg]
				data[arg]
		)
		if _dataPosition?
			argData[_dataPosition] = unseenData
		argData
		
	sendResponse: (response) ->
		@response.json
			success: true
			response: response
			
	sendErrorResponse: (error) ->
		message = if error and error.message then error.message else error
		allowedErrors = ['validate']
		# Only allow deliberate messages
		if -1 isnt allowedErrors.indexOf message
			message = error.error
		else
			if _.isFunction @logError
				@logError(error)
			message = "Server Error"
		@response.json
			success: false
			error: message
	
	convert: (data) ->
		Converter.convert @validation, data
	
	validate: (data) ->
		Validator.validate @validation, data, @modelName
	