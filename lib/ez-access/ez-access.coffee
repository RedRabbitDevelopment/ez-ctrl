# Note this is a front-end file!
( (generator)->
	if exports? and module.exports
		Q = require 'q'
		_ = require 'underscore'
		module.exports = generator(Q, _)
	else if define? and define.amd
		define ['q', 'underscore'], generator
	else
		window.EZAccess = generator(Q, _)
)((Q, _)->
	EZAccess =
		eventualObject: (promise)->
			shell = {}
			shell._promise = promise.then (result)->
				for key, value of result
					shell[key] = value
				shell
			shell
		eventualArray: (promise)->
			shell = []
			shell._promise = promise.then (result)->
				for value, i in result
					shell.push result[i]
				shell
			shell
		eventualValue: (promise)->
			shell = value: null
			promise.then (result)->
				shell.value = result
			shell
		_constructPath: (pattern, data)->
			params = pattern.split '/'
			(for param in params
				if variables = param.match /^:(.*?)(\(.*?\))?$/
					variable = variables[1]
					value = data[variable]
					delete data[variable]
					value
				else
					param
			).join "/"
		_serialize: (obj, prefix)->
			str = []
			if obj.length?
				for value, i in obj
					key = if prefix then prefix + "[]" else i
					if value isnt undefined
						str.push if typeof value is 'object'
							@_serialize(value, key)
						else
							encodeURIComponent(key) + "=" + encodeURIComponent(value)
			else
				for key, value of obj
					key = if prefix then prefix + "[" + key + "]" else key
					if value isnt undefined
						str.push if typeof value is 'object'
							@_serialize(value, key)
						else
							encodeURIComponent(key) + "=" + encodeURIComponent(value)
			str.join "&"
		_constructQuery: (data)->
			result = @_serialize(data)
			if result.length > 0
				"?" + result
			else
				""
		_isFunction: (obj)->
			!!(obj && obj.constructor && obj.call && obj.apply)

		_makeRequest: (routeDetails, args)->
			data = @_extractData routeDetails.argList, args
			# TODO: Validate on the front end
			( (data)=>
			#Validator.validate(routeDetails.validation, data).then (data)=>
				path = @_constructPath routeDetails.pattern, data
				
				path = path + @_constructQuery(data) if routeDetails.method is 'get'
				@_makeRequestBase(routeDetails.method, path, data)
				.then (result)->
					if result.success
						result.response
					else
						error = new Error result.error
						error.errors = result.errors
						throw error
			)(data)

		_makeRequestBase: (method, path, data)->

			deferred = q.defer()
			xmlhttp = if window.XMLHttpRequest
				new XMLHttpRequest()
			else
				new ActiveXObject("Microsoft.XMLHTTP")

			xmlhttp.onreadystatechange = =>
				if xmlhttp.readyState is 4 and xmlhttp.status is 200
					try
						deferred.resolve JSON.parse xmlhttp.responseText
					catch e
						console.log "EZAccessError: Response not in valid JSON", xml.responseText
						deferred.reject error, "EZAccessError: Response not in valid JSON", xml.responseText

			if method is 'get'
				xmlhttp.open(method, path, true)
				xmlhttp.send()
			else
				xmlhttp.open(method, path, true)
				xmlhttp.setRequestHeader('Content-Type', 'application/json')
				xmlhttp.send JSON.stringify data
			deferred.promise
)
