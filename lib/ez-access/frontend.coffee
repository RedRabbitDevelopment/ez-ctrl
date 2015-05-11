_ = require 'lodash'
ControllerManager = require('../ez-ctrl/manager')
FuncDetails = require('../ez-ctrl/func-details')
Bluebird = require 'bluebird'

frontEndJS = null

module.exports = class FrontEnd
  constructor: ->
    @controllerManager = new ControllerManager()

  registerRoutes: (app, dirname, dynoScripts)->
    initPromise = if dirname
      @controllerManager.readdir(dirname)
    else
      Bluebird.resolve true
    initPromise.then =>
      @controllerManager.registerRoutes app
      if dynoScripts
        app.get '/js/lib/ez-routes.js', (req, res)=>
          unless frontEndJS
            frontEndJS = @getFrontEndMethods()
          res.setHeader 'Content-Type', 'application/x-javascript; charset=UTF-8'
          res.end frontEndJS
        app.get '/js/lib/ez-access.js', (req, res)->
          res.sendfile __dirname + "/ez-access.js"
        app.get '/js/lib/ez-access-angular.js', (req, res)->
          res.sendfile __dirname + "/ez-access-angular.js"
        app.get '/js/lib/ez-validation.js', (req, res)->
          res.sendfile __dirname + "/validator.js"
      app.get '/get-batch', (req, res)=>
        response = {}
        Bluebird.all  _.map req.query, (value, key)=>
          Controller = @controllerManager.controllers[value.controllerName]
          controller = Controller.getController value.methodName
          controller.run req, res, (value.args or {})
          .then (result)->
            response[key] = result
        .then ->
          res.json response

  
  addController: (ctrl)->
    @controllerManager.addController ctrl

  getFrontEndMethods: (hostname, protocol)->
    routes = @controllerManager.getAllRoutes()
    EZAccess = {}
    EZAccess._extractData = FuncDetails.argsToData
    controllers = {}
    for controller, controllerDetails of routes
      controllers[controller] = {}
      controllers[controller]._routeDetails = {}
      for funcName, funcDetails of controllerDetails
        unless funcDetails.logic?
          throw new Error "Controller #{controller} does not have logic for #{funcName}"
        argString = FuncDetails.extractArgumentString(funcDetails.logic)
        controllers[controller]._routeDetails[funcName] =
          pattern: funcDetails.pattern
          usesId: funcDetails.usesId
          method: funcDetails.method
          validation: funcDetails.validation
          argList: FuncDetails.extractArguments funcDetails.logic
        funcString = "(function(" + argString + ") {\n" +
        "  return this._makeRequest(this._routeDetails['" + funcName + "'], arguments, '" + controller + "', '" + funcName + "');\n" +
        "});\n"
        controllers[controller][funcName] = eval(funcString)
    EZAccess.hostname = hostname if hostname
    EZAccess.protocol = protocol if protocol
    @convertToFrontEnd EZAccess, controllers
  
  convertToFrontEnd: (object, controllers)->
    output = "
(function(generator) {\n
  if(typeof module !== 'undefined' && module.exports) {\n
    module.exports = generator(require('ez-access'), require('lodash'));\n
  } else if (typeof define !== 'undefined' && define.amd) {\n
    define(['ez-access', 'lodash'], generator);\n
  } else {\n
    window.EZRoutes = generator(window.EZAccess, window._);\n
  }\n
})(function(EZAccess, _) {\n
    "
    for field, value of object
      output += "  EZAccess['#{field}'] = " + @convertToFrontEndRaw value, 1
      output += ";\n"
    for controllerName, controller of controllers
      output += "  EZAccess['#{controllerName}'] = new EZAccess.Controller(" +
        @convertToFrontEndRaw(controller, 1) + ");\n"
      output += "  EZAccess.Batch['#{controllerName}'] = new EZAccess.BatchController(" +
        @convertToFrontEndRaw(controller, 1) + ");\n"
      output += "  EZAccess.controllers.push('#{controllerName}');\n"
    output += "
});\n
    "
    output

  
  convertToFrontEndRaw: (object, depth = 0)->
    tabs = @getTabs depth
    tabs2 = @getTabs depth + 1
    if _.isFunction object
      output = object.toString().replace /\n\s*/mg, '\n' + tabs2
      lastNewLine = output.indexOf("\n")
      output = output.substring(0, lastNewLine) + output.substring(lastNewLine).replace /\n\s*/m, "\n" + tabs
    else if _.isArray object
      output = "[\n"
      output += tabs2 + (@convertToFrontEndRaw(object_item, depth + 1) for object_item in object).join(",\n" + tabs2) + "\n"
      output += tabs + "]"
      output
    else if _.isObject object
      output = "{\n"
      output += tabs2 + (field + ": " + @convertToFrontEndRaw(value, depth + 1) for field, value of object).join(",\n" + tabs2) + "\n"
      output += tabs + "}"
      output
    else if _.isNumber(object) or _.isBoolean object
      "#{object}"
    else if _.isString object
      "'#{object.replace('"', '\\"').replace("'", "\\'")}'"
    else
      'undefined'
  
  getTabs: _.memoize (depth)->
    ("  " while depth--).join ""
