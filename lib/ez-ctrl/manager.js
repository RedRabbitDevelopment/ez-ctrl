var _ = require('underscore');

module.exports = ControllerManager = {
	controllers: [],
	getAllRoutes: function() {
		return _.reduce(this.controllers, function(memo, controller) {
			if(controller.modelName) {
				memo[controller.modelName] = controller.getRoutes();
			}
			return memo;
		}, {});
	},
	registerRoutes: function(app) {
		_.forEach(this.controllers, function(controller) {
			controller.registerRoutes(app);
		});
	}
};