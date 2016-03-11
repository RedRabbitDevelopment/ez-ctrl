((generator)->
  if exports? and module.exports
    _ = require('lodash')
    validate = require 'validator'
    Bluebird = require('bluebird')
    UserError = require '../ez-ctrl/userError'
    module.exports = generator(_, validate, Bluebird, UserError)
  else if define? and define.amd
    define ['lodash', 'validate', 'bluebird', 'UserError'], generator
  else
    {_, validator, Bluebird, UserError} = window
    window.Validator = generator(_, validator, Bluebird, UserError)
)((_, validate, Bluebird, UserError)->
  check = validate.check
  Validator =
    validate: (validation, data, controllerName)->
      promises = []
      for field, validatorData of validation
        # don't validate the field if the field is empty and not required
        if data[field]? or validatorData.required
          delete validatorData.default
          promises.push @validateField(validatorData, field, data[field], controllerName)
        else if validatorData.default
          data[field] = validatorData.default
      Bluebird.map(promises, (promise)-> Bluebird.resolve(promise).reflect()).then (results)->
        errors = _.filter results, (result)->
          not result.isFulfilled()
        if errors.length > 0
          errors = _.reduce errors, (memo, result)->
            reason = result.reason()
            # exit validation if there was an unexpected error
            throw reason if reason instanceof Error
            memo[reason.field] = reason.errors
            memo
          , {}
          error = new UserError 'Validate'
          error.errors = errors
          throw error
        else
          data
    
    ###
    Returns a promise that either resolves, or rejects with a list of errors: i.e.
      field: field
      errors: ['must be less than 8', 'must exist']
    Please note that required needs to be run first
    ###
    validateField: (validators, field, value, controllerName)->
      promises = []
      # fail if the value is missing
      unless value?
        promises.push @runValidate(value, 'required', true, field, controllerName)
      else if validators
        for validator, validatorData of validators
          promises.push @runValidate value, validator, validatorData, field, controllerName
      Bluebird.settle(promises).then (results)->
        readableErrors = (for result in results when not result.isFulfilled()
          reason = result.reason()
          if reason instanceof Error
            # Throw error and exit validation for any unexpected errors
            throw reason
          reason
        )
        if readableErrors.length > 0
          throw
            errors: readableErrors
            field: field
    ###
    Returns a promise that either is resolved, or is rejected with the readable error. Note that if validator is "type", then the validatorData
    will be transformed to is<validatorData>.
    Example:
      type: "alphanumeric" => isAlphanumeric
      type: "int" => isInt
    ###
    runValidate: (value, validator, validatorData, field, controllerName)->
      Bluebird.try =>
        if validator is "type"
          if _.isString validatorData
            validator = 'is' + validatorData.substr(0, 1).toUpperCase() + validatorData.substr(1)
          else
            if _.isArray validatorData
              validators = validatorData[0]
              throw new UserError @Messages.isArray unless _.isArray value
              if _.isString validators
                validators = type: validators
              else
                # TODO: support more complex array validation
                throw new Error 'only types are supported by array validators'
              return Bluebird.all(for value_part in value
                @validateField(validators, field, value_part, controllerName)
              ).catch ->
                throw new UserError "should be an array of " + validators.type
            else
              # TODO: support object validation
              throw new Error "Validation method 'is#{validatorData}' does not exist"
        unless @ValidationMethods[validator]
          args = [value]
          args.push @Messages[validator] if @Messages[validator]
          if (checker = check.apply(null, args))[validator]
            validatorData = [validatorData] unless _.isArray validatorData
            try
              checker[validator].apply checker, validatorData
            catch e
              throw new UserError e.message
            true
          else
            throw new Error("Validation method '#{validator}' does not exist")
        else
          @ValidationMethods[validator] value, validatorData, field, controllerName
      .catch (error)->
        Bluebird.reject if error instanceof UserError then error.message else error
        
    registerValidator: (name, fn)->
      @ValidationMethods[name] = fn
      
    Messages:
      required: "is required"
      isAlphanumeric: "must be alphanumeric"
      isBoolean: "must be a boolean"
      isText: 'must be a string'
      isArray: 'must be an array'
      isDate: 'must be a date'

    ValidationMethods:
      required: (value)->
        throw new UserError(Validator.Messages['required']) unless value?
      isBoolean: (value)->
        unless value is true or value is false
          throw new UserError Validator.Messages.isBoolean
        true
      isDate: (value)->
        unless value instanceof Date
          throw new UserError Validator.Messages.isDate
        true
      isImage: ->
        true
      isFile: ->
        true
      isText: (value)->
        unless _.isString value
          throw new UserError Validator.Messages.isText
        true
)
