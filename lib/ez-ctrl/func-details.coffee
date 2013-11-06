_ = require('underscore')

module.exports = FuncDetails =
	extractArguments: (fn)->
		FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m
		FN_ARG_SPLIT = /,/
		FN_ARG = /^\s*(_?)(\S+?)\1\s*$/
		STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg

		if _.isFunction(fn)
			unless argsList = fn.argsList
				argsList = []
				fnText = fn.toString().replace(STRIP_COMMENTS, '')
				argDecl = fnText.match(FN_ARGS)
				for arg in argDecl[1].split(FN_ARG_SPLIT)
					arg.replace FN_ARG, (all, underscore, name)->
						argsList.push(name)
				fn.argsList = argsList
			argsList;
		else
			return null
	
	dataToArgs: (fn, data) ->
		args = FuncDetails.extractArguments(fn)
		argData = []
		unseenData = _.extend({}, data)
		argData = (for arg, i in args or []
			if arg is "_data"
				_dataPosition = i
				null
			else
				delete unseenData[arg]
				data[arg]
		)
		if _dataPosition?
			argData[_dataPosition] = unseenData
		argData
	
	argsToData: (argList, args)->
		data = {}
		for argString, i in argList or []
			if argString is "_data"
				data[field] = value for value, field of args[i]
			else
				data[argString] = args[i]
		data
		
	extractArgumentString: (fn)->
		FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
		# No need to remove \n, just \r for consistency
		return fn.toString().match(FN_ARGS)[1].replace(/\r/g, "")
