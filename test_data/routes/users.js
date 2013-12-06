// Generated by CoffeeScript 1.6.3
(function() {
  var MyBaseController, Q, UserData, data, middleware;

  Q = require('q');

  MyBaseController = require('./');

  data = require('../data');

  middleware = data.middleware;

  UserData = data.UserData;

  module.exports = MyBaseController.extend({
    name: "User",
    allowedErrors: ["Invalid username or password"],
    beforeEach: function(req, res, next) {
      middleware.userRan++;
      return next();
    },
    routes: {
      query: function() {
        return UserData;
      },
      get: function(id) {
        return UserData[id];
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
            unique: true,
            len: [9]
          },
          password: {
            required: true,
            type: 'alphanumeric',
            len: [9]
          }
        },
        logic: function(_data) {
          _data.id = UserData.length;
          _data.comments = [];
          UserData.push(_data);
          return true;
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
            len: 8
          },
          username: {
            type: 'alphanumeric',
            unique: true,
            len: 8
          },
          password: {
            type: 'alphanumeric',
            len: 8
          }
        },
        logic: function(id, _data) {
          var key, value;
          for (key in _data) {
            value = _data[key];
            UserData[id][key] = value;
          }
          return true;
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
          var user, _i, _len;
          for (_i = 0, _len = UserData.length; _i < _len; _i++) {
            user = UserData[_i];
            if (user.username === username) {
              if (user.password === password) {
                return true;
              } else {
                throw new Error("Invalid username or password");
              }
            }
          }
          throw new Error("Invalid username or password");
        }
      },
      faulty: function() {
        var method;
        method = null;
        method();
        return "Result";
      },
      usesId: {
        validation: {
          id: {
            type: 'int',
            required: true,
            inDb: true
          }
        },
        usesId: true,
        logic: function(id) {
          return "Result";
        }
      }
    }
  });

}).call(this);
