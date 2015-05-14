
var Router = require('ez-ctrl').Router;
var School = require('../models/school');

var SchoolController = {
  query: function(data, options) {
    data.user_id = options.user.id;
    return School.findAll(data);
  },
  get: function(id, data, options) {
    return School.findById(id).then(function(school) {
      if(school.user_id !== options.user.id) {
        throw new Error();
      }
    });
  },
  create: function(data, options) {
    data.user_id = options.user.id;
    return School.create(data);
  },
  update: function(id, data, options) {
    return this.get(id).then(function(school) {
      unless
      school.set(data);
      school.saveAsync();
    });
  },
  batchUpdate: function(data, options) {
    data.user_id = options.user.id;
    return School.updateAsync(data);
  },
  delete: function(id, data, options) {
    return this.get(id).then(function(school) {
      return school.removeAsync();
    });
  }
  batchDelete: function(data, options) {
    data.user_id = options.user.id;
    return School.removeAsync(data);
  }
};

Router.registerController(SchoolController);
module.exports = SchoolController;
