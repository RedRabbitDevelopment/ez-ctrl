_ = require('underscore')
Q = require 'q'
fs = require 'fs'

module.exports = class ControllerManager
  constructor: ->
    @controllers = []
  getAllRoutes: ()->
    _.reduce @controllers, (memo, controller)->
      if controller.modelName
        memo[controller.modelName] = controller.getRoutes()
      memo
    , {}
  readdir: (dirname)->
    Q.nfcall(fs.readdir, dirname).then (files)=>
      @loadFiles dirname, files, '.js'
      if @controllers.length is 0
        @loadFiles dirname, files, '.coffee'
  loadFiles: (dirname, files, ext)->
    for file in files
      unless -1 is index = file.indexOf ext
        file = file.substr 0, index
        Controller = require dirname + "/" + file
        if Controller.isController and not Controller.isAbstract
          @addController Controller
  registerRoutes: (app)->
    for controller in @controllers
      controller.registerRoutes app
  
  addController: (ctrl)->
    @controllers.push ctrl

