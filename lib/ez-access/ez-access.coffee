# Note this is a front-end file!
( (generator)->
  if exports? and module.exports
    Bluebird = require 'bluebird'
    _ = require 'lodash'
    module.exports = generator(Bluebird, _)
  else if define? and define.amd
    define ['bluebird', 'lodash'], generator
  else
    window.EZAccess = generator(window.Bluebird, window._)
)((Bluebird, _)->

  class BaseController
    constructor: (@_details)->
      _.assign @, @_details
    _constructPath: (pattern, data)->
      params = pattern.split '/'
      path = (for param in params
        if variables = param.match /^:(.*?)(\(.*?\))?$/
          variable = variables[1]
          value = data[variable]
          delete data[variable]
          value
        else
          param
      ).join "/"
      if EZAccess.hostname
        url = "//#{EZAccess.hostname}#{path}"
        if EZAccess.protocol
          "#{EZAccess.protocol}:#{url}"
        else
          url
      else
        path
    _serialize: (obj, prefix)->
      str = []
      unless obj?
        null
      else if obj.length?
        for value, i in obj
          key = if prefix then "#{prefix}[#{i}]" else i
          if value isnt undefined
            str.push if typeof value is 'object'
              @_serialize(value, key)
            else
              key + "=" + encodeURIComponent(value)
      else
        for key, value of obj
          key = if prefix then prefix + "[" + key + "]" else encodeURIComponent(key)
          if value isnt undefined
            str.push if typeof value is 'object'
              @_serialize(value, key)
            else
              key + "=" + encodeURIComponent(value)
      str.join "&"
    _constructQuery: (data)->
      result = @_serialize(data)
      if result.length > 0
        "?" + result
      else
        ""
    _isFunction: (obj)->
      !!(obj && obj.constructor && obj.call && obj.apply)

    _makeRequestBase: (method, path, data)->

      new Bluebird (resolve, reject)->
        xmlhttp = if window.XMLHttpRequest
          new XMLHttpRequest()
        else
          new ActiveXObject("Microsoft.XMLHTTP")

        xmlhttp.onreadystatechange = =>
          if xmlhttp.readyState is 4 and xmlhttp.status is 200
            try
              resolve JSON.parse xmlhttp.responseText
            catch e
              console.log "EZAccessError: Response not in valid JSON", xml.responseText
              reject error, "EZAccessError: Response not in valid JSON", xml.responseText

        if method is 'get'
          xmlhttp.open(method, path, true)
          xmlhttp.send()
        else
          xmlhttp.open(method, path, true)
          xmlhttp.setRequestHeader('Content-Type', 'application/json')
          xmlhttp.send JSON.stringify data

    interpretResult: (result)->
      if result.success
        result.response
      else
        error = new Error result.error
        error.errors = result.errors
        throw error

  class Controller extends BaseController
    _makeRequest: (routeDetails, args, controllerName, methodName)->
      data = EZAccess._extractData routeDetails.argList, args
      # TODO: Validate on the front end
      ( (data)=>
      #Validator.validate(routeDetails.validation, data).then (data)=>
        path = @_constructPath routeDetails.pattern, data
        
        path = path + @_constructQuery(data) if routeDetails.method is 'get'
        @_makeRequestBase(routeDetails.method, path, data)
        .then @interpretResult
      )(data)
  class BatchController extends BaseController
    constructor: (@_details)->
      super
    _makeRequest: (routeDetails, args, controllerName, methodName)->
      args: EZAccess._extractData routeDetails.argList, args
      controllerName: controllerName
      methodName: methodName

  class Batch extends BaseController
    constructor: ->
      @requests = {}
      @num = 0
      EZAccess.controllers.map (controllerName)=>
        @[controllerName] = Batch[controllerName]
    getRequestId: ->
      @num++
    get: (varName, request)->
      if _.isString varName
        @requests[varName] = request
      else
        for key, value of varName
          @get key, value
    flush: (ignoreFailures)->
      path = "/get-batch#{@_constructQuery @requests}"
      url = if EZAccess.hostname
        url = "//#{EZAccess.hostname}#{path}"
        if EZAccess.protocol
          "#{EZAccess.protocol}:#{url}"
        else
          url
      else
        path
      @_makeRequestBase 'get', url
      .then (results)=>
        if ignoreFailures
          results
        else
          _.mapValues results, @interpretResult
        
  EZAccess =
    BaseController: BaseController
    Controller: Controller
    BatchController: BatchController
    Batch: Batch
    controllers: []
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
)
