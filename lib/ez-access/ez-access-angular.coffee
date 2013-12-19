
define ['angular', 'ez-access', 'ez-routes'], (angular)->
	angular.module('ez.access', [])
	.service('EZAccess', ['$http', ($http)->
		angular.extend @, window.EZAccess
		window.EZAccess._makeRequestBase = (method, path, data)->
			args = [path]
			args.push data if method isnt 'get'
			$http[method].apply($http, args).then (response)->
				response.data
		@
	])
