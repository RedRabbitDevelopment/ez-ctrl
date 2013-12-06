// Generated by CoffeeScript 1.6.3
(function() {
  var MyBaseController, Q, UserData, data, middleware;

  Q = require('q');

  MyBaseController = require('./');

  data = require('../data');

  middleware = data.middleware;

  UserData = data.UserData;

  module.exports = MyBaseController.extend({
    name: "AsyncUser",
    beforeEach: function(req, res, next) {
      middleware.asyncRan++;
      return next();
    },
    routes: {
      query: function() {
        var deferred;
        deferred = Q.defer();
        setTimeout(function() {
          return deferred.resolve(UserData);
        }, 25);
        return deferred.promise;
      },
      get: {
        validation: {
          id: {
            required: true,
            type: 'int',
            inDb: true
          }
        },
        logic: function(id) {
          var deferred;
          deferred = Q.defer();
          setTimeout(function() {
            return deferred.resolve(UserData[id]);
          }, 25);
          return deferred.promise;
        }
      },
      add: {
        validation: {
          name: {
            required: true,
            len: 8
          },
          username: {
            required: true,
            type: 'alphanumeric',
            len: 8
          },
          password: {
            required: true,
            len: 8,
            type: 'alphanumeric',
            unique: true
          }
        },
        logic: function(_data) {
          var deferred;
          deferred = Q.defer();
          setTimeout(function() {
            _data.id = UserData.length;
            _data.comments = [];
            UserData.push(_data);
            return deferred.resolve(true);
          }, 25);
          return deferred.promise;
        }
      },
      save: {
        validation: {
          id: {
            required: true,
            type: 'int',
            inDb: true
          },
          name: {
            required: true,
            len: 8
          },
          username: {
            type: 'alphaNumeric',
            len: 8
          },
          password: {
            type: 'alphaNumeric',
            len: 8
          }
        },
        logic: function(id, _data) {
          var deferred;
          deferred = Q.defer();
          setTimeout(function() {
            var key, value;
            for (key in _data) {
              value = _data[key];
              UserData[id][key] = value;
            }
            return deferred.resolve(true);
          }, 25);
          return deferred.promise;
        }
      },
      postLogin: {
        validation: {
          username: {
            required: true
          },
          password: {
            required: true
          }
        },
        logic: function(username, password) {
          var deferred;
          deferred = Q.defer();
          setTimeout(function() {
            var user, _i, _len;
            for (_i = 0, _len = UserData.length; _i < _len; _i++) {
              user = UserData[_i];
              user = UserData[id];
              if (user.username === username) {
                if (user.password === password) {
                  deferred.resolve(true);
                } else {
                  deferred.reject("Invalid username or password");
                }
              }
            }
            return deferred.reject("Invalid username or password");
          }, 25);
          return deferred.promise;
        }
      }
    }
  });

}).call(this);
