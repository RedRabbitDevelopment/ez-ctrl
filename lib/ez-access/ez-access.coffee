# Note this is a front-end file!
EZAccess = (()->
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
		result = for value, key of data or {}
			encodeURIComponent(key) + "=" + encodeURIComponent(value)
		if result.length > 0
			"?" + result.join "&"
		else
			""
	_isFunction: (obj)->
		!!(obj && obj.constructor && obj.call && obj.apply)
	_makeRequest: (routeDetails, args)->
		data = EZAccess._extractData routeDetails.argList, args
		Validator.validate(routeDetails.validation, data).then (data)->
			deferred = Q.defer()
			xmlhttp = if window.XMLHttpRequest
				new XMLHttpRequest()
			else
				new ActiveXObject("Microsoft.XMLHTTP")
			path = EZAccess._constructPath routeDetails.pattern, data
			
			xmlhttp.onreadystatechange = ->
				if xmlhttp.readyState is 4 and xmlhttp.status is 200
					try
						result = JSON.parse xmlhttp.responseText
						if result.success
							deferred.resolve result.response
						else
							deferred.reject result.error
					catch e
						console.log "EZAccessError: Response not in valid JSON", xml.responseText
						deferred.reject error, "EZAccessError: Response not in valid JSON", xml.responseText
			if routeDetails.method is "get"
				query = EZAccess._constructQuery data
				xmlhttp.open(routeDetails.method, path + query, true)
				xmlhttp.send()
			else
				xmlhttp.open(routeDetails.method, path, true)
				xmlhttp.setRequestHeader("Content-type","application/json");
				xmlhttp.send(JSON.stringify data)
			deferred.promise
)()