

/**
	Sample use:
	Controller.extend({
		name: "User"
		routes: {
			getAll: function() { // get /users Anything with "getAll" automatically is get /<tableize>
				// Get the users
				return promise or users;
			},
			get: { // get /users/(\d+?) Anything with "get" automatically is get /<tableize>/(\d+?)
				validation: {
					id: ['exists', 'numeric']
				},
				logic: function(id) {
					return promise or user;
				}
			},
			add: { // put /users Anything with "add" automatically is put /<tableize>
				validation: {
					name: ['exists', {'length': gt: 8}]
					username: ['exists', {'length': gt: 8}, 'alphaNumeric']
					password: ['exists',
						{'length': {gt: 8}},
						'alphaNumeric',
						'unique' // Backend Only
					]
				},
				logic: function(data) {
					return promise or user or success;
				}
			},
			save: { // post /users/(\d+?) Anything with "save" automatically is post /<tableize>/(\d+?)
				validation {
					id:  ['exists', 'numeric'],
					name: ['exists', {'length': gt: 8}],
					username: ['exists', {'length': gt: 8}, 'alphaNumeric'],
					password: ['exists', {'length': gt: 8}, 'alphaNumeric']
				},
				logic: function(id, data) {
					return promise or user or success;
				}
			},
			postComment: { // post<verb> is always /<tableize/verb
				validation: {
					comment_id: ['exists'],
					comment: ['text']
				},
				logic: function(comment_id, comment) {
					
				}
			}
		}
	});
	// You can also use this code on client side as well, and it will perform front-end validation as well as back-end validation
	UserController.saveUser(id, data);
	UserController.postComment(comment_id, comment);
*/

var inflection = require('inflection'),
	_ = require('underscore'),
	validator = require('validator'),
	Q = require("q"),
	EventEmitter = require('events').EventEmitter;
Q.longStackSupport = true;


BaseController = function(options) {
	
};

exports.ControllerManager = ControllerManager = {
	controllers: [],
	getAllRoutes: function() {
		return _.reduce(this.controllers, function(memo, controller) {
			if(controller.modelName) {
				memo[controller.modelName] = controller.getRoutes();
			}
			return memo;
		}, {});
	}
};

exports.FrontEndManager = FrontEndManager = {
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
				var funcString = "function(" + argString + ") {\n" +
				"	EZController._makeRequest(this._routeDetails['" + funcName + "'], arguments);\n" +
				"};";
				EZController[controller][funcName] = eval(funcString);
			}
		}
		return EZController.toString();
	}
}

BaseController = {
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
		var validators, value, field,
			promises = [];
		for(field in this.validation) {
			value = data[field];
			promises.push(this.validateField(field, value));
		}
		return Q.allSettled(promises).then(function(results) {
			var deferred = Q.defer(), errors = _.filter(results, function(result) {
				return result.state != "fulfilled";
			});
			if(errors.length > 0) {
				errors = _.reduce(errors, function(memo, result) {
					return _.reduce(result.reason, function(memo, reason) {
						if(!memo[reason.name]) {
							memo[reason.name] = [];
						}
						memo[reason.name] = memo[reason.name].concat(reason.errors);
						return memo;
					}, memo);
				}, {});
				deferred.reject({
					message: "validate",
					error: errors
				});
			} else {
				deferred.resolve(data);
			}
			return deferred.promise;
		});
	},
	validateField: function(field, value) {
		var validators = this.validation[field],
			validator,
			promises = [],
			promise;
		// Skip if value is empty and it isn't required
		if(!ValidationMethods.required(value, true) && !validators.required) {
			return true;
		}
		if(validators)
		for(validator in validators) {
			validatorData = validators[validator];
			if(validator === "type") {
				validator = validatorData;
				if(!ValidationMethods[validator]) {
					continue;
				}
			}(function(value, validator, validatorData, field) {
				promises.push(Validator.validate.call(this, value, validator, validatorData, field).then(function(result) {
					if(result !== true && typeof result !== "undefined") {
						var deferred = Q.defer();
						deferred.reject(result);
						return deferred.promise;
					}
				}).fail(function(error) {
					var deferred = Q.defer();
					deferred.reject({
						field: field,
						validator: validator,
						error: error,
						validatorData: validatorData
					});
					return deferred.promise;
				}));
			})(value, validator, validatorData, field);
		}
		return Q.allSettled(promises).then(function(results) {
			var i, deferred = Q.defer();
			readableErrors = [];
			_.forEach(results, function(result) {
				if(result.state != "fulfilled") {
					error = result.reason;
					readableErrors.push({
						name: error.field,
						errors: Validator.translateValidationError(error.validator, error.error, error.validatorData)
					});
				}
			});
			if(readableErrors.length > 0) {
				deferred.reject(readableErrors);
			} else {
				deferred.resolve();
			}
			return deferred.promise;
		});
	}
};

FuncDetails = {
	extractArguments: function(fn) {
		var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
		var FN_ARG_SPLIT = /,/;
		var FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
		var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
		var argsList,
			fnText,
			argDecl;

		if (_.isFunction(fn)) {
	   		if (!(argsList = fn.argsList)) {
				argsList = [];
				fnText = fn.toString().replace(STRIP_COMMENTS, '');
				argDecl = fnText.match(FN_ARGS);
				_.forEach(argDecl[1].split(FN_ARG_SPLIT), function(arg){
					arg.replace(FN_ARG, function(all, underscore, name){
						argsList.push(name);
					});
				});
				fn.argsList = argsList;
			}
		} else {
			return null;
		}
		return argsList;
	},
	extractArgumentString: function(fn) {
		var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
		// No need to remove \n, just \r for consistency
		return fn.toString().match(FN_ARGS)[1].replace(/\r/g, "");
	}
}

ConverterMethods = {
	int: function(value) {
		return Converter.float(value);
	},
	float: function(value) {
		return parseFloat(value);
	}
};

exports.Converter = Converter = {
	registerConverter: function(name, converter) {
		ConverterMethods[name] = converter;
	}
}

exports.Validator = Validator = {
	validate: function(value, validator, validatorData, field) {
		var deferred = Q.defer(),
			result;
		try {
			if(!ValidationMethods[validator]) {
				throw new Error("Validation Method " + validator + " does not exist");
			}
			deferred.resolve(ValidationMethods[validator].call(this, value, validatorData, field));
		} catch(e) {
			deferred.reject(e.message);
		}
		return deferred.promise;
	},
	translateValidationError: function(validator, validatorResult, validatorData) {
		var validationMessage;
		if(ValidationMessages[validator]) {
			if (_.isFunction(ValidationMessages[validator])) {
				validationMessage = ValidationMessages[validator](validatorResult, validatorData);
			} else {
				validationMessage = ValidationMessages[validator];
			}
		} else {
			this.trigger("error", {
				error: "MissingMessage",
				validator: validator,
				validatorResult: validatorResult,
				validatorData: validatorData
			});
			validationMessage = ValidationMessages.default;
		}
		if(_.isString(validationMessage)) {
			return [validationMessage];
		} else if (_.isArray(validationMessage)) {
			return validationMessage;
		} else {
			throw new Error("Not sure how to interpret validation message: " + validator + " : " + validatorData + " : " + validationMessage);
		}
	},
	registerValidator: function(name, message, fn) {
		ValidationMethods[name] = fn;
		ValidationMessages[name] = message;
	}
};
// Extend EventEmitter
EventEmitter.call(Validator);
Validator.__proto__ = EventEmitter.prototype;

ValidationMessages = {
	required: "is required",
	float: "must be a float",
	int: "must be an integer",
	alphaNumeric: "must be alpha-numeric",
	length: function(validatorResult, validatorData) {
		return _.map(validatorResult, function(data) {
			switch(data.error) {
				case "gt":
					return "must be greater than " + data.detail;
				case "lt":
					return "must be less than " + data.detail;
				case "between":
					return "must be between " + data.detail[0] + " and " + data.detail[1];
				default:
					return "requirement " + data.error + " not recognized";
			}
		});
	},
	default: "is not understood"
}

ValidationMethods = {
	required: function(value, details) {
		return (value != null) === details;
	},
	float: function(value) {
		if(_.isString(value)) {
			value = parseFloat(value);
		}
		return _.isNumber(value) && !_.isNaN(value);
	},
	int: function(value) {
		if(_.isString(value)) {
			value = parseFloat(value);
		}
		return _.isNumber(value) && !_.isNaN(value) && value % 1 === 0;
	},
	alphaNumeric: function(value) {
		return /^[a-z0-9]+$/i.test(value);
	},
	length: function(value, details) {
		var length = value.length, key, detail, fails, errors = [];
		for(key in details) {
			detail = details[key];
			fails = false;
			switch(key) {
				case "gt":
					if(length < detail) {
						fails = true;
					}
					break;
				case "lt":
					if(length > detail) {
						fails = true;
					}
					break;
				case "between":
					if(ValidationMethods.length(value, {lt: detail[0]}) && ValidationMethods.length(value, {gt: detail[1]})) {
						fails = true;
					}
					break;
			}
			if(fails) {
				errors.push({
					error: key,
					detail: detail
				})
			}
		}
		if(errors.length > 0) {
			return errors;
		}
		return true;
	}
};

exports.BaseController = BaseController;