# Note this is a front-end file!
define ['q'], (q)->
	this.EZAccess =
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
		_constructQuery: (data)->
			result = for key, value of data or {} when value
				encodeURIComponent(key) + "=" + encodeURIComponent(value)
			if result.length > 0
				"?" + result.join "&"
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
