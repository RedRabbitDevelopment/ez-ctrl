Validator = require('../').Validator
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
			assert.equal result.message, 'validate'
			assert.equal result.error.username.length, 1
			assert.equal result.error.username[0], 'is required'
			assert.equal result.error.password.length, 1
			assert.equal result.error.password[0], 'is required'
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
			done(result)
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
				type: ['string']
			object:
				type:
					booya:
						required: true
						type: 'string'
					other:
						required: false
						type: 'int'
		,
			array: ['booya', 'one', 'two']
			object:
				booya: 'STRING'
				other: 5
		.then ->
			done()
		, (error)->
			console.log error
			done()
	it 'should be able to give us a complex error', (done)->
		Validator.validate
			array:
				type: ['string']
			object:
				type:
					booya:
						required: true
						type: 'string'
					other:
						required: false
						type: 'int'
		,
			array: ['booya', 5, 'two']
			object:
				booya: 'STRING'
		.fail (result)->
			assert.ok result?.errors?.array
			assert.not.ok result.errors.object
			assert.equals result.errors.array[0], 'should be an array of strings'
			done()
		.then (result)->
			done new Error 'Got Result'
		.fail done
