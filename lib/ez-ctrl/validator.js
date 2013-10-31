var EventEmitter = require('events').EventEmitter,
	_ = require('underscore'),
	Q = require('q');

module.exports = Validator = {
	validate: function(validation, data) {
		var validators, value, field,
			promises = [];
		for(field in validation) {
			value = data[field];
			promises.push(Validator.validateField(validation, field, value));
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
	validateField: function(validation, field, value) {
		var validators = validation[field],
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
				promises.push(Validator.runValidate(value, validator, validatorData, field).then(function(result) {
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
	},
	runValidate: function(value, validator, validatorData, field) {
		var deferred = Q.defer(),
			result;
		try {
			if(!ValidationMethods[validator]) {
				throw new Error("Validation Method " + validator + " does not exist");
			}
			deferred.resolve(ValidationMethods[validator](value, validatorData, field));
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
			Validator.trigger("error", {
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
