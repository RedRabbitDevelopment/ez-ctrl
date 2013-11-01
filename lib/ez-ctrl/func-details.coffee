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
		
	extractArgumentString: (fn)->
		FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
		# No need to remove \n, just \r for consistency
		return fn.toString().match(FN_ARGS)[1].replace(/\r/g, "")
