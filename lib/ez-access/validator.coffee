(->
			

	# Validator file is on both the front end and the backend
	loadValidator = (Q, _, EventEmitter, validate)->
		check = validate.check
		
		Validator =
			validate: (validation, data, controllerName)->
				promises = []
				for field, validatorData of validation
					promises.push @validateField(validatorData, field, data[field], controllerName)
				Q.allSettled(promises).then (results)->
					deferred = Q.defer()
					errors = _.filter results, (result)->
						result.state != "fulfilled"
					if errors.length > 0
						errors = _.reduce errors, (memo, result)->
							reason = result.reason
							unless memo[reason.field]
								memo[reason.field] = []
							memo[reason.field] = memo[reason.field].concat(reason.errors)
							memo
						, {}
						deferred.reject
							message: "validate"
							error: errors
					else
						deferred.resolve(data)
					deferred.promise
			
			###
			Returns a promise that either resolves, or rejects with a list of errors: i.e.
				field: field
				errors: ['must be less than 8', 'must exist']
			###
			validateField: (validators, field, value, controllerName)->
				promises = []
				# Skip if value is empty and it isn't required
				unless value
					if validators.required
						promises.push @runValidate(value, 'required', true, field, controllerName)
					else
						return true
				else if validators
					for validator, validatorData of validators
						promises.push @runValidate value, validator, validatorData, field, controllerName
				Q.allSettled(promises).then (results)->
					deferred = Q.defer()
					readableErrors = []
					for result in results
						if result.state isnt "fulfilled"
							error = result.reason
							readableErrors.push error
					if readableErrors.length > 0
						deferred.reject
							errors: readableErrors
							field: field
					else
						deferred.resolve()
					deferred.promise
			###
			Returns a promise that either is resolved, or is rejected with the readable error. Note that if validator is "type", then the validatorData
			will be transformed to is<validatorData>.
			Example:
				type: "alphanumeric" => isAlphanumeric
				type: "int" => isInt
			###
			runValidate: (value, validator, validatorData, field, controllerName)->
				deferred = Q.defer()
				try
					if validator is "type"
						validator = 'is' + validatorData.substr(0, 1).toUpperCase() + validatorData.substr(1)
					unless @ValidationMethods[validator]
						args = [value]
						args.push @ValidationMessages[validator] if @ValidationMessages[validator]
						if (checker = check.apply(null, args))[validator]
							validatorData = [validatorData] unless _.isArray validatorData
							checker[validator].apply checker, validatorData
							deferred.resolve()
						else
							Validator.emit? "error",
								error: "MissingMethod"
								validator: validator
								validatorData: validatorData
							throw new Error("Validation method '#{validator}' does not exist")
					else
						deferred.resolve @ValidationMethods[validator] value, validatorData, field, controllerName
				catch e
					deferred.reject e.message
				deferred.promise
					
			registerValidator: (name, fn)->
				@ValidationMethods[name] = fn
				
			ValidationMessages:
				required: "is required"
				isAlphanumeric: "must be alphanumeric"

			ValidationMethods:
				required: (value)->
					throw new Error(Validator.ValidationMessages['required']) unless !!value

		# Extend EventEmitter
		if EventEmitter
			EventEmitter.call(Validator);
			Validator.__proto__ = EventEmitter.prototype;
		
		Validator
		
	unless typeof process is 'undefined' or !process.versions
		EventEmitter = require('events').EventEmitter
		underscore = require('underscore')
		validator = require 'validator'
		Q = require('q')
		exportObject = (object)->
			module.exports = object
	else
		underscore = window._
		EventEmitter = null
		unless window.Q
			throw new Error "Q.js is required for ez-validator!"
		unless window.validate
			throw new Error "validator.js is required for ez-validator!"
		Q = window.Q
		validate = window.validate
		exportObject = (object)->
			window.Validator = object
	exportObject loadValidator Q, underscore, EventEmitter, validate
)()