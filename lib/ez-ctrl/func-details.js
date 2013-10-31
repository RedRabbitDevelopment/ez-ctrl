



exports = FuncDetails = {
	extractArguments: function(fn) {
		var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
		var FN_ARG_SPLIT = /,/;
		var FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
		var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
		var argsList,
			fnText,
			argDecl;

		if (_.isFunction(fn)) {
	   		if (!(argsList = fn.argsList)) {
				argsList = [];
				fnText = fn.toString().replace(STRIP_COMMENTS, '');
				argDecl = fnText.match(FN_ARGS);
				_.forEach(argDecl[1].split(FN_ARG_SPLIT), function(arg){
					arg.replace(FN_ARG, function(all, underscore, name){
						argsList.push(name);
					});
				});
				fn.argsList = argsList;
			}
		} else {
			return null;
		}
		return argsList;
	},
	extractArgumentString: function(fn) {
		var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
		// No need to remove \n, just \r for consistency
		return fn.toString().match(FN_ARGS)[1].replace(/\r/g, "");
	}
}
