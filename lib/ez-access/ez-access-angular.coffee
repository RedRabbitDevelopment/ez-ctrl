((generator)->
  if exports? and module.exports
    angular = require 'angular'
    EZAccess = require 'ez-access'
    EZRoutes = require 'ez-routes'
    module.exports = generator(angular, EZAccess, EZRoutes)
  else if define? and define.amd
    define ['angular', 'ez-access', 'ez-routes'], generator
  else
    {angular, EZAccess} = window
    generator(angular, EZAccess)
    delete window.EZAccess
)( (angular, EZAccess, EZRoutes)->
  angular.module('ez.access', [])
  .factory('EZAccess', ['$http', ($http)->
    EZAccess.BaseController.prototype._makeRequestBase = (method, path, data)->
      args = [path]
      args.push data if method isnt 'get'
      $http[method].apply($http, args).then (response)->
        response.data
    EZAccess
  ])
)
