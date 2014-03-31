_ = require 'underscore'
ControllerManager = require('../ez-ctrl/manager')
FuncDetails = require('../ez-ctrl/func-details')
Q = require 'q'

frontEndJS = null

module.exports = class FrontEnd
  constructor: ->
    @controllerManager = new ControllerManager()

  registerRoutes: (app, dirname, dynoScripts)->
    initPromise = if dirname
      @controllerManager.readdir(dirname)
    else
      Q.when true
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
  
  addController: (ctrl)->
    @controllerManager.addController ctrl

  getFrontEndMethods: (hostname)->
    routes = @controllerManager.getAllRoutes()
    EZAccess = {}
    EZAccess._extractData = FuncDetails.argsToData
    for controller, controllerDetails of routes
      EZAccess[controller] = {}
      EZAccess[controller]._routeDetails = {}
      for funcName, funcDetails of controllerDetails
        argString = FuncDetails.extractArgumentString(funcDetails.logic)
        EZAccess[controller]._routeDetails[funcName] =
          pattern: funcDetails.pattern
          usesId: funcDetails.usesId
          method: funcDetails.method
          validation: funcDetails.validation
          argList: FuncDetails.extractArguments funcDetails.logic
        funcString = "(function(" + argString + ") {\n" +
        "  return EZAccess._makeRequest(this._routeDetails['" + funcName + "'], arguments, '" + controller + "');\n" +
        "});\n"
        EZAccess[controller][funcName] = eval(funcString)
    @convertToFrontEnd EZAccess, hostname
  
  convertToFrontEnd: (object, hostname)->
    output = "
(function(generator) {
  if(typeof module !== 'undefined' && module.exports) {
    module.exports = generator(require('ez-access'));
  } else if (typeof define !== 'undefined' && define.amd) {
    define(['ez-access'], generator);
  } else {
    window.EZRoutes = generator(window.EZAccess);
  }
})(function(EZAccess) {
    "
    for field, value of object
      output += "EZAccess['#{field}'] = " + @convertToFrontEndRaw value, 1
      output += ";\n"
    output += "EZAccess.hostname = '#{hostname}';\n" if hostname
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
    ("\t" while depth--).join ""
