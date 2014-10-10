FuncDetails = require('./func-details')
Converter = require('./converter')
Q = require('q')
_ = require('lodash')
inflection = require('inflection')
Converter = require('./converter')
Validator = require('../ez-access/validator')
UserError = require './userError'
multiparty = require 'multiparty'
util = require 'util'

module.exports = BaseController =
  isController: true
  isAbstract: true
  beforeEach: []
  middleware: []
  extend: (options) ->
    NewController = (routeDetails) ->
      _.extend(this, routeDetails)
      @forked = []
      if _.isFunction @initialize
        @initialize()
      if options.name
        BaseController.setBaseData.call(@, NewController.modelName)
      return
    _.extend(NewController, this)
    NewController.isAbstract = false
    _.extend NewController, options
    if options.name
      NewController.setBaseData(options.name, NewController.idRegex)
    NewController.beforeEach = @extendArray 'beforeEach', options.beforeEach
    NewController.middleware = @extendArray 'middleware', options.middleware
    _.extend(NewController.prototype, @prototype, options.methods)
    NewController
  
  extendArray: (name, extend)->
    newarray = if extend then @[name].concat extend else @[name].slice 0

  setBaseData: (name, idRegex)->
    @modelName = name
    @tableName = inflection.tableize(@modelName)
    @basePattern = "/" + @tableName
    idPattern = if idRegex?
      if idRegex is false then '' else "(#{idRegex})"
    else
      '([0-9]+)'
    @individualPattern = "#{@basePattern}/:id#{idPattern}"
    @methods = ["get", "put", "post", "delete"]
  
  getRouteDetails: (route) ->
    usesId = false
    routeDetails = @routes[route]
    switch route
      when "query"
        method = "get"
        pattern = @basePattern
      when "get"
        method = "get"
        pattern = @individualPattern
        usesId = true
      when "add" or "post"
        method = "post"
        pattern = @basePattern
      when "save" or 'put'
        method = "put"
        pattern = @individualPattern
        usesId = true
      when "delete"
        method = "delete"
        pattern = @individualPattern
        usesId = true
      else
        remainingRoute = route
        method = "get"
        for m in @methods
          if route.indexOf(m) is 0
            method = m
            remainingRoute = route.substring(method.length)
            break
        
        # Convert MakeComment into make-comment
        remainingRoute = inflection.underscore(remainingRoute)
        remainingRoute = inflection.dasherize(remainingRoute)
        
        if routeDetails.usesId
          pattern = @individualPattern + "/" + remainingRoute
        else
          pattern = @basePattern + "/" + remainingRoute
        
    if routeDetails.method
      method = routeDetails.method
    before = []
    before = before.concat @beforeEach if @beforeEach
    before = before.concat routeDetails.before if routeDetails.before
    if routeDetails.pattern
      pattern = routeDetails.pattern
    if routeDetails.usesId
      usesId = routeDetails.usesId
    logic = if _.isFunction(routeDetails) then routeDetails else routeDetails.logic
    validation = routeDetails.validation || {}
    # Add default id validation
    if usesId and not validation.id
      validation.id = required: true
    middleware = if routeDetails.middleware
      if _.isFunction routeDetails.middleware
        [routeDetails.middleware]
      else
        routeDetails.middleware
    else
      []

    returnType = routeDetails.return or 'json'
    
    details: routeDetails
    returnType: returnType
    method: method
    route: route
    logic: logic
    before: before
    pattern: pattern
    validation: validation
    usesId: usesId
    middleware: middleware
      
  registerRoute: (app, routeDetails) ->
    middleware = @getMiddleWare(routeDetails)
    app[routeDetails.method](routeDetails.pattern, middleware, @handleRequest.bind(this, routeDetails))
  
  getMiddleWare: (routeDetails)->
    @middleware.concat routeDetails.middleware
  
  handleRequest: (routeDetails, req, res, next) ->
    controller = new this(routeDetails)
    controller.handleRequest(req, res, next)
  
  getRoutes: () ->
    routes = {}
    routes[route] = @getRouteDetails(route) for route, r of @routes
    routes
    
  registerRoutes: (app) ->
    routes = @getRoutes()
    for route, routeDetails of routes
      @registerRoute(app, routeDetails)
  
  getController: (route)->
    routeDetails = @getRouteDetails route
    controller = new this routeDetails

BaseController.prototype =
  handleRequest: (req, res, next) ->
    @request = req
    @response = res
    @next = next
    @steps([
      @getData
      @runBefore
      @convert
      @validate
      @runLogic
      @translateSuccessResponse
    ]).fail (reason)=>
      @translateErrorResponse reason
    .then (result)=>
      @send result
    .fail (reason) =>
      @logError 'UnhandledError', reason
    .then =>
      @handleForked()

  handleForked: ->
    Q.allSettled @forked
    .then (results)=>
      results.forEach (result)=>
        unless result.state is 'fulfilled'
          @logError 'ForkError', result.reason

  getDisplayName: ->
    "#{@modelName}.#{@route}"

  steps: (steps, first)->
    promise = Q.when first
    steps.reduce (promise, step)=>
      promise.then step.bind @
    , promise

  run: (req, res, data)->
    @request = req
    @response = res
    @steps([
      @runBefore
      @convert
      @validate
      @runLogic
      @translateSuccessResponse
    ], data).fail (reason)=>
      @translateErrorResponse reason
    .then (result)=>
      @handleForked()
      result
  
  runBefore: (data, i = 0)->
    if i < @before.length
      Q.fcall(=> @applyFunction(@before[i], data))
      .then =>
        @runBefore data, i + 1
    else
      data

  runLogic: (data)->
    Q.fcall =>
      @applyFunction @logic, data

  clean: (object)->
    unless object
      null
    else
      JSON.parse JSON.stringify object

  testLogic: (data)->
    @runLogic @clean data
    .then @clean
  
  applyFunction: (fn, data)->
    args = FuncDetails.dataToArgs(fn, data)
    fn.apply(@, args)
  
  getRequestData: (field, type) ->
    if type is 'file' or type is 'image'
      if @files
        @files[field]?[0]
      else
        @parseFiles().then =>
          @files?[field]?[0]
    else
      Q.fcall => @request.param(field)
    
  parseFiles: ->
    form = new multiparty.Form()
    Q.ninvoke(form, 'parse', @request).spread( (fields, files)=>
      @files = files
    ).fail (error)=>
      if error.message is 'Expected CR Received 45'
        @files = {}
      else
        throw error

  getData: () ->
    data = {}
    promises = for field, value of @validation
      ( (field, value)=>
        @getRequestData(field, value.type).then (value)->
          if value?
            data[field] = value
      )(field, value)
    Q.all(promises).then ->
      data
    
  translateSuccessResponse: (response) ->
    if @returnType is 'json'
      success: true
      response: response
    else
      response
      
  translateErrorResponse: (error) ->
    # Only allow deliberate messages
    message = unless error instanceof UserError
      if _.isFunction @logError
        @logError('ServerError', error)
      "Server Error"
    else
      errors = error.errors
      error.message
    if @returnType is 'json'
      success: false
      error: message
      errors: errors
    else
      @next error
      @sent = true

  send: (result)->
    unless @sent
      @sent = true
      @_send(result)

  _send: (result)->
    switch @returnType
      when 'stream'
        result.pipe @response
      when 'raw'
        @response.end result
      else
        @response.json result
    
  
  convert: (data) ->
    Converter.convert @validation, data
  
  validate: (data)->
    Validator.validate(@validation, data, @modelName)
  
  throwValidationError: (errors)->
    @throwError 'Validate', errors

  throwError: (message, errors)->
    error = new UserError message
    error.errors = errors
    throw error

