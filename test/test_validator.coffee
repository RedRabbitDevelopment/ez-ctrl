Validator = require('../').Validator
UserError = require('../').UserError
assert = require 'assert'
describe 'Validator', ->
	it "should get the appropriate messages", (done)->
		Validator.validate
			name:
				required: true
				len: 9
			username:
				required: true
				type: 'alphaNumeric'
				unique: true # Backend Only
				len: 9
			password:
				required: true
				type: 'alphaNumeric'
				len: 8
		,
			name: "Booya Baby"
		.then ->
			done new Error "didn't throw error"
		.fail (result)->
			assert.ok result instanceof UserError
			assert.equal result.message, 'Validate'
			assert.equal result.errors.username.length, 1
			assert.equal result.errors.username[0], 'is required'
			assert.equal result.errors.password.length, 1
			assert.equal result.errors.password[0], 'is required'
			done()
		.fail (error)->
			done error
			
	it "should fail", (done)->
		Validator.runValidate(undefined, "required", true, "username").then (result)->
			done(result)
		, (error)->
			assert.equal error, 'is required'
			done()
		.fail (result)->
			done(result)
	it "should give me an appropriate error", (done)->
		Validator.runValidate("no-oolong", "len", 8, "username").then (result)->
			done()
		, (error)->
			assert.equal error, 'is required'
			done()
		.fail (result)->
			done(result)
	it "should get me a readable error", (done)->
		Validator.validateField(required: true, "username", undefined, true).then (result)->
			done new Error "didn't fail"
		, (result)->
			assert.equal result.field, "username"
			assert.equal result.errors.length, 1
			assert.equal result.errors[0], "is required"
			done()
		.fail (error)->
			done error
	it "should get me multiple readable errors", (done)->
		Validator.validateField(
			len: 8
			type: "alphanumeric"
		, "username", "no-long", true).then (result)->
			done new Error "didn't fail"
		, (result)->
			assert.equal result.field, "username"
			assert.equal result.errors.length, 2
			assert.equal result.errors[0], "String is not in range"
			assert.equal result.errors[1], "must be alphanumeric"
			done()
		.fail (error)->
			done error
	it 'should be able to handle complex validation', (done)->
		Validator.validate
			array:
				type: ['text']
		,
			array: ['booya', 'one', 'two']
		.then ->
			done()
		, (error)->
			if error instanceof Error
				done error
			else
				done new Error 'threw an error' + JSON.stringify error
	it 'should be able to give us a complex error', (done)->
		Validator.validate
			array:
				type: ['text']
		,
			array: ['booya', 5, 'two']
		.then (result)->
			done new Error 'Got Result'
		.fail (result)->
			assert.ok result instanceof UserError
			assert.ok result?.errors?.array
			assert.equal result.errors.array[0], 'should be an array of text'
			done()
		.fail done
	it 'should pass on 0 or empty string', (done)->
		Validator.validate
			name: required: true
		,
			name: 0
		.then (result)->
			done()
		.fail done
