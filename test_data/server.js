// Generated by CoffeeScript 1.6.3
(function() {
  var TestData, app, express, frontEnd, http;

  express = require('express');

  http = require('http');

  frontEnd = new (require('../index').FrontEnd)();

  app = express();

  app.use(express.json());

  app.use(express.urlencoded());

  app.use(express.bodyParser());

  app.use(express["static"](__dirname + "/server_public"));

  TestData = require('./data');

  frontEnd.registerRoutes(app);

  module.exports = {
    start: function(cb) {
      if (!cb) {
        cb = function() {};
      }
      this.server = http.createServer(app);
      return this.server.listen(3000, cb);
    },
    close: function(cb) {
      if (!cb) {
        cb = function() {};
      }
      return this.server.close(cb);
    }
  };

}).call(this);
