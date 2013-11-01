EventEmitter = require('events').EventEmitter
_ = require('underscore')
Q = require('q')

module.exports = Validator =
	validate: (validation, data)->
		promises = []
		for field, value of data
			promises.push Validator.validateField validation, field, value
		Q.allSettled(promises).then (results)->
			deferred = Q.defer()
			errors = _.filter results, (result)->
				result.state != "fulfilled"
			if errors.length > 0
				errors = _.reduce errors, (memo, result)->
					_.reduce result.reason, (memo, reason)->
						unless memo[reason.name]
							memo[reason.name] = []
						memo[reason.name] = memo[reason.name].concat(reason.errors)
						memo
					, memo
				, {}
				deferred.reject
					message: "validate"
					error: errors
			else
				deferred.resolve(data)
			deferred.promise

	validateField: (validation, field, value)->
		validators = validation[field]
		promises = []
		# Skip if value is empty and it isn't required
		
		unless value or validators.required
			true
		if validators
			for validator, validatorData of validators
				if validator is "type"
					validator = validatorData
					unless ValidationMethods[validator]
						continue
				((value, validator, validatorData, field)->
					promises.push Validator.runValidate(value, validator, validatorData, field).then (result)->
						unless result is true or typeof result is "undefined"
							deferred = Q.defer()
							deferred.reject result
							deferred.promise
					.fail (error)->
						deferred = Q.defer()
						deferred.reject
							field: field
							validator: validator
							error: error
							validatorData: validatorData
						deferred.promise
				)(value, validator, validatorData, field)
		Q.allSettled(promises).then (results)->
			deferred = Q.defer()
			readableErrors = []
			for result in results
				if result.state isnt "fulfilled"
					error = result.reason
					readableErrors.push
						name: error.field
						errors: Validator.translateValidationError(error.validator, error.error, error.validatorData)
			if readableErrors.length > 0
				deferred.reject readableErrors
			else
				deferred.resolve()
			deferred.promise
			
	runValidate: (value, validator, validatorData, field)->
		deferred = Q.defer()
		try
			unless ValidationMethods[validator]
				throw new Error("Validation Method " + validator + " does not exist")
			deferred.resolve ValidationMethods[validator] value, validatorData, field
		catch e
			deferred.reject e.message
		deferred.promise

	translateValidationError: (validator, validatorResult, validatorData)->
		if ValidationMessages[validator]
			if _.isFunction(ValidationMessages[validator])
				validationMessage = ValidationMessages[validator](validatorResult, validatorData)
			else
				validationMessage = ValidationMessages[validator]
		else
			Validator.trigger "error",
				error: "MissingMessage"
				validator: validator
				validatorResult: validatorResult
				validatorData: validatorData
			validationMessage = ValidationMessages.default
		if _.isString(validationMessage)
			[validationMessage]
		else if _.isArray(validationMessage)
			validationMessage
		else
			throw new Error("Not sure how to interpret validation message: " + validator + " : " + validatorData + " : " + validationMessage)
			
	registerValidator: (name, message, fn)->
		ValidationMethods[name] = fn
		ValidationMessages[name] = message
		
# Extend EventEmitter
EventEmitter.call(Validator);
Validator.__proto__ = EventEmitter.prototype;

ValidationMessages =
	required: "is required",
	float: "must be a float",
	int: "must be an integer",
	alphaNumeric: "must be alpha-numeric",
	length: (validatorResult, validatorData)->
		_.map validatorResult, (data)->
			switch data.error
				when "gt"
					"must be greater than #{data.detail}"
				when "lt"
					"must be less than #{data.detail}"
				when "between"
					"must be between #{data.detail[0]} and #{data.detail[1]}"
				else
					"requirement " + data.error + " not recognized"
	default: "is not understood"

ValidationMethods =
	required: (value, details)->
		(value != null) is details
		
	float: (value)->
		if _.isString value
			value = parseFloat(value)
		_.isNumber(value) and not _.isNaN(value)

	int: (value)->
		if _.isString value
			value = parseFloat(value)
		_.isNumber(value) and not _.isNaN(value) and value % 1 is 0

	alphaNumeric: (value)->
		/^[a-z0-9]+$/i.test value

	length: (value, details)->
		length = value.length
		errors = []
		for key, detail of details
			fails = switch key
				when "gt"
					length < detail
				when "lt"
					length > detail
				when "between"
					length < detail[0] or length > detail[1]
			if fails
				errors.push
					error: key
					detail: detail
		if errors.length > 0
			return errors
		true