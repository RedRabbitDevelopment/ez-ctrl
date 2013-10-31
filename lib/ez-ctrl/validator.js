
exports = Validator = {
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
