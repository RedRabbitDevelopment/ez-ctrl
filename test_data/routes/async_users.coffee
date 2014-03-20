Q = require('q')
MyBaseController = require './'
data = require '../data'
middleware = data.middleware
UserData = data.UserData

module.exports = MyBaseController.extend
  name: "AsyncUser"
  middleware: (req, res, next)->
    middleware.asyncRan++
    next()
  routes:
    query: -> #get /users Anything with "query" automatically is get /<tableize>
      # Get the users
      deferred = Q.defer()
      setTimeout ->
        deferred.resolve(UserData)
      , 25
      deferred.promise
    
    get: # get /users/:id Anything with "get" automatically is get /<tableize>/:id
      validation:
        id:
          required: true
          type: 'int'
          inDb: true
      logic: (id)->
        deferred = Q.defer()
        setTimeout ->
          deferred.resolve UserData[id]
        , 25
        deferred.promise
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
        deferred = Q.defer()
        setTimeout ->
          _data.id = UserData.length
          _data.comments = []
          UserData.push _data
          deferred.resolve true
        , 25
        deferred.promise
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
        deferred = Q.defer()
        setTimeout ->
          UserData[id][key] = value for key, value of _data
          deferred.resolve true
        , 25
        deferred.promise
        
    postLogin: # post<verb> is always /<tableize/verb
      validation:
        username:
          required: true
        password:
          required: true
      logic: (username, password)->
        deferred = Q.defer()
        setTimeout ->
          for user in UserData
            user = UserData[id]
            if user.username is username
              if user.password is password
                 deferred.resolve(true)
              else
                deferred.reject "Invalid username or password"
          deferred.reject("Invalid username or password")
        , 25
        deferred.promise
