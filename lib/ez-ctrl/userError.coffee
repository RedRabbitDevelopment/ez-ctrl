###
# The purpose of UserError is to be able to throw an error in a promise and catch it
# later on by checking error instanceof UserError. That way we can filter the errors
# we receive and prevent users from viewing errors they aren't supposed to see, but allow
# through UserErrors.
###
class UserError
	constructor: ->
		err = Error.apply @, arguments
		@stack = err.stack
		@message = err.message
		@isUserError = true
		@

UserError.prototype = Object.create Error.prototype,
	constructor: value: UserError

module.exports = UserError
