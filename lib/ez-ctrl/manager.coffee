_ = require('underscore')
Q = require 'q'
fs = require 'fs'

module.exports = class ControllerManager
  constructor: ->
    @controllers = {}
  getAllRoutes: ()->
    _.reduce @controllers, (memo, controller)->
      if controller.modelName
        memo[controller.modelName] = controller.getRoutes()
      memo
    , {}
  readdir: (dirname)->
    Q.nfcall(fs.readdir, dirname).then (files)=>
      @loadFiles dirname, files, '.js'
      if Object.keys(@controllers).length is 0
        @loadFiles dirname, files, '.coffee'
  loadFiles: (dirname, files, ext)->
    for file in files
      hasExtension = -1 isnt (index = file.indexOf(ext))
      isTest = -1 is file.indexOf '.spec' + ext
      isHidden = 0 is file.indexOf '.'
      if hasExtension and not isTest and not isHidden
        file = file.substr 0, index
        Controller = require dirname + "/" + file
        @addController Controller
  registerRoutes: (app)->
    for name, controller of @controllers
      controller.registerRoutes app
  
  addController: (ctrl)->
    if ctrl and ctrl.isController and not ctrl.isAbstract
      @controllers[ctrl.name] = ctrl

