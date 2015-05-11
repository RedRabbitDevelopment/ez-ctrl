Bluebird = require 'bluebird'
MyBaseController = require './'
data = require '../data'
middleware = data.middleware
beforeEach = data.beforeEach
UserData = data.UserData

timeout = (time)->
  new Bluebird (resolve)->
    setTimeout resolve, time
module.exports = MyBaseController.extend
  name: "AsyncUser"
  beforeEach: [->
    beforeEach.asyncRan++
  , ->
    beforeEach.asyncRan++
  ]
  middleware: (req, res, next)->
    middleware.asyncRan++
    next()
  routes:
    query: #get /users Anything with "query" automatically is get /<tableize>
      validation:
        optional:
          type: 'int'
          required: false
          default: 5
      logic: (optional)->
        # Get the users
        timeout(25).then -> UserData
    get: # get /users/:id Anything with "get" automatically is get /<tableize>/:id
      validation:
        id:
          required: true
          type: 'int'
          inDb: true
      logic: (id)->
        timeout(25).then -> UserData[id]
    add: # put /users Anything with "add" automatically is put /<tableize>
      validation:
        name:
          required: true
          len: 8
        username:
          required: true
          type: 'alphanumeric'
          len: 8
        password:
          required: true
          len: 8
          type: 'alphanumeric'
          unique: true # Backend Only
      logic: (_data)->
        timeout(25).then ->
          _data.id = UserData.length
          _data.comments = []
          UserData.push _data
          true
    save: # post /users/:id Anything with "save" automatically is post /<tableize>/:id
      validation:
        id:
          required: true
          type: 'int'
          inDb: true
        name:
          required: true
          len: 8
        username:
          type: 'alphaNumeric'
          len: 8
        password:
          type: 'alphaNumeric'
          len: 8
      logic: (id, _data)->
        timeout(25).then ->
          UserData[id][key] = value for key, value of _data
          true
        
    postLogin: # post<verb> is always /<tableize/verb
      validation:
        username:
          required: true
        password:
          required: true
      logic: (username, password)->
        timeout(25).then ->
          for user in UserData
            user = UserData[id]
            if user.username is username
              if user.password is password
                 return true
              else
                throw new UserError "Invalid username or password"
          throw new UserError "Invalid username or password"
    beforeEachCrazy:
      before: ->
        beforeEach.other.crazy = true
      logic: ->
        true
