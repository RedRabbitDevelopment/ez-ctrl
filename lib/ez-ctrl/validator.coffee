(->
	unless typeof process is 'undefined' or !process.versions
		EventEmitter = require('events').EventEmitter
		underscore = require('underscore')
		Q = require('q')
		exportObject = (object)->
			module.exports = object
	else
		underscore = _
		EventEmitter = null
		unless Q
			throw new Exception "Q is required for ez-validator!"
		exportObject = (object)->
			window.Validator = object
			

	# Validator file is on both the front end and the backend
	loadValidator = (exportObject, Q, _, EventEmitter)->
		Validator =
			validate: (validation, data, controllerName)->
				promises = []
				for field, validatorData of validation
					promises.push @validateField validatorData, field, data[field], controllerName
				Q.allSettled(promises).then (results)->
					deferred = Q.defer()
					errors = _.filter results, (result)->
						result.state != "fulfilled"
					if errors.length > 0
						errors = _.reduce errors, (memo, result)->
							reason = result.reason
							_.reduce reason, (memo, result)->
								unless memo[result.field]
									memo[result.field] = []
								memo[result.field] = memo[result.field].concat(result.errors)
								memo
							, memo
							memo
						, {}
						deferred.reject
							message: "validate"
							error: errors
					else
						deferred.resolve(data)
					deferred.promise
			
			###
			Returns a promise that includes all the readable errors for that field in the format: list of
				field: name of the field
				errors: list of readable errors. Example: ['must be less than 8', 'must exist']
			###
			validateField: (validators, field, value, controllerName)->
				promises = []
				# Skip if value is empty and it isn't required
				unless value
					if validators.required
						return @runValidateAndGetReadableError(value, 'required', true, field, controllerName).fail (error)->
							deferred = Q.defer()
							deferred.reject [
								field: error.field
								errors: error.error
							]
							deferred.promise
					else
						return true
				if validators
					for validator, validatorData of validators
						if validator is "type"
							validator = validatorData
							unless @ValidationMethods[validator]
								continue
						promises.push @runValidateAndGetReadableError value, validator, validatorData, field, controllerName
				Q.allSettled(promises).then (results)->
					deferred = Q.defer()
					readableErrors = []
					for result in results
						if result.state isnt "fulfilled"
							error = result.reason
							readableErrors.push
								field: error.field
								errors: error.error
					if readableErrors.length > 0
						deferred.reject readableErrors
					else
						deferred.resolve()
					deferred.promise
			###
			Returns a promise that either is resolved, or is rejected with the following result:
				field: name of the field that failed
				error: the readable error
			###
			runValidateAndGetReadableError: (value, validator, validatorData, field, controllerName)->
				@runValidate(value, validator, validatorData, field, controllerName).then (result)->
					unless result is true or typeof result is "undefined"
						deferred = Q.defer()
						deferred.reject result
						deferred.promise
				.fail (error)=>
					deferred = Q.defer()
					deferred.reject
						field: field
						error: @translateValidationError validator, error, validatorData, controllerName
					deferred.promise
					
			runValidate: (value, validator, validatorData, field, controllerName)->
				deferred = Q.defer()
				try
					unless @ValidationMethods[validator]
						throw new Error("Validation Method " + validator + " does not exist")
					deferred.resolve @ValidationMethods[validator] value, validatorData, field, controllerName
				catch e
					deferred.reject e.message
				deferred.promise

			translateValidationError: (validator, validatorResult, validatorData, controllerName)->
				if @ValidationMessages[validator]
					if _.isFunction(@ValidationMessages[validator])
						validationMessage = @ValidationMessages[validator](validatorResult, validatorData, controllerName)
					else
						validationMessage = @ValidationMessages[validator]
				else
					Validator?.trigger "error",
						error: "MissingMessage"
						validator: validator
						validatorResult: validatorResult
						validatorData: validatorData
					validationMessage = @ValidationMessages.default
				if _.isString(validationMessage)
					[validationMessage]
				else if _.isArray(validationMessage)
					validationMessage
				else
					throw new Error("Not sure how to interpret validation message: " + validator + " : " + validatorData + " : " + validationMessage)
					
			registerValidator: (name, message, fn)->
				@ValidationMethods[name] = fn
				@ValidationMessages[name] = message
				
			ValidationMessages:
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

			ValidationMethods:
				required: (value, details)->
					value? is details
					
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

		# Extend EventEmitter
		if EventEmitter
			EventEmitter.call(Validator);
			Validator.__proto__ = EventEmitter.prototype;
		
		Validator
		
	unless window?.define
		exportObject loadValidator exportObject, Q, underscore, EventEmitter
	else
		window.define 'ez-export-object', [], -> exportObject
		window.define 'ez-event-emitter', [], -> EventEmitter
		window.define 'Validator', ['exportObject', 'q', 'underscore', 'ez-event-emitter'], loadValidator
)()