var FuncDetails = require('./func-details'),
	ControllerManager = require('./manager'),
	Q = require('q'),
	_ = require('underscore'),
	inflection = require('inflection'),
	Converter = require('./converter');

module.exports = BaseController = {
	extend: function(options) {
		var NewController = function(routeDetails) {
			_.extend(this, routeDetails);
			if(_.isFunction(this.initialize)) {
				this.initialize();
			}
		}
		_.extend(NewController, BaseController, options);
		_.extend(NewController.prototype, BaseController.prototype);
		if(options.name){
			NewController.setBaseData(options.name);
		};
		ControllerManager.controllers.push(NewController);
		return NewController;
	},
	noop: function() {},
	setBaseData: function(name) {
		this.modelName = name;
		this.tableName = inflection.tableize(this.modelName);
		this.basePattern = "/" + this.tableName;
		this.individualPattern = this.basePattern + "/:id([0-9]+)";
		this.methods = ["get", "put", "post", "delete"];
	},
	getRouteDetails: function(route) {
		var method, pattern, logic, validation, m, usesId = false;
		routeDetails = this.routes[route];
		switch(route) {
			case "getAll":
				method = "get";
				pattern = this.basePattern;
				break;
			case "get":
				method = "get";
				pattern = this.individualPattern;
				usesId = true;
				break;
			case "add":
			case "put":
				method = "put";
				pattern = this.basePattern;
				break;
			case "save":
			case "post":
				method = "post";
				pattern = this.individualPattern;
				usesId = true;
				break;
			case "delete":
				method = "delete";
				pattern = this.individualPattern;
				usesId = true;
				break;
			default:
				remainingRoute = route;
				method = "get";
				for(var i = 0, _len = this.methods.length; i < _len; i++) {
					m = this.methods[i];
					if(route.indexOf(this.methods[i]) === 0) {
						method = m;
						remainingRoute = route.substring(method.length);
						break;
					}
				}
				// Convert MakeComment into make-comment
				remainingRoute = inflection.underscore(remainingRoute);
				remainingRoute = inflection.dasherize(remainingRoute);
				
				if(routeDetails.usesId) {
					pattern = this.individualPattern + "/" + remainingRoute;
				} else {
					pattern = this.basePattern + "/" + remainingRoute;
				}
		}
		if(routeDetails.method) {
			method = routeDetails.method;
		}
		if(routeDetails.pattern) {
			pattern = routeDetails.pattern;
		}
		if(routeDetails.usesId) {
			usesId = routeDetails.usesId;
		}
		logic = _.isFunction(routeDetails) ? routeDetails : routeDetails.logic;
		validation = routeDetails.validation || {};
		
		return {
			method: method,
			logic: logic,
			pattern: pattern,
			validation: validation,
			usesId: usesId
		};
	},
	registerRoute: function(app, routeDetails) {
		ThisController = this;
		app[routeDetails.method](routeDetails.pattern, this.handleRequest.bind(this, routeDetails));
	},
	handleRequest: function(routeDetails, req, res, next) {
		ThisController = this;
		controller = new ThisController(routeDetails);
		controller.handleRequest(req, res);
	},
	getRoutes: function() {
		var route, routes = {};
		for(route in this.routes) {
			routes[route] = this.getRouteDetails(route);
		}
		return routes;
	},
	registerRoutes: function(app) {
		var routes = this.getRoutes(), route, routeDetails;
		for(route in routes) {
			routeDetails = routes[route];
			this.registerRoute(app, routeDetails);
		}
	}
};

BaseController.prototype = {
	handleRequest: function(req, res) {
		this.request = req;
		this.response = res;
		_this = this;
		Q.when().then(function() {
			return _this.getData();
		}).then(function(data) {
			return _this.convert(data);
		}).then(function(data) {
			return _this.validate(data);
		}).then(function(data) {
			var logicArguments = _this.extractLogicArguments(data);
			return _this.logic.apply(_this, logicArguments);
		}).then(function(response) {
			return _this.sendResponse(response);
		}, function(reason) {
			return _this.sendErrorResponse(reason);
		});
	},
	getRequestData: function(field) {
		var value = null;
		value = this.request.param(field);
		return value;
	},
	getData: function() {
		var data = {};
		for(field in this.validation) {
			value = this.getRequestData(field);
			if(value) {
				data[field] = value;
			}
		}
		return data;
	},
	extractLogicArguments: function(data) {
		var args = FuncDetails.extractArguments(this.logic),
			argData = [],
			unseenData = _.extend({}, data),
			_dataPosition;
		for(var i = 0, _len = args.length; i < _len; i++) {
			arg = args[i];
			if(args[i] == "_data") {
				argData.push(void(0));
				_dataPosition = i;
			} else {
				argData.push(data[args[i]]);
				delete unseenData[args[i]];
			}
		}
		if(_dataPosition) {
			argData[_dataPosition] = unseenData;
		}
		return argData;
	},
	sendResponse: function(response) {
		this.response.json({
			success: true,
			response: response
		});
	},
	sendErrorResponse: function(error) {
		message = error && error.message ? error.message : error;
		allowedErrors = ['validate'];
		// Only allow deliberate messages
		if(-1 !== allowedErrors.indexOf(message)) {
			message = error.error;
		} else {
			if(_.isFunction(this.logError)) {
				this.logError(error);
			}
			message = "Server Error";
		}
		this.response.json({
			success: false,
			error: message
		});
	},
	convert: function(data) {
		for(field in this.validation) {
			value = data[field];
			if(value) {
				type = this.validation.type;
				if(ConverterMethods[type]) {
					value = ConverterMethods[type];
				}
				data[field] = value;
			}
		}
		return data;
	},
	validate: function(data) {
		return Validator.validate(this.validation, data);
	}
};