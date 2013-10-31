
exports = ControllerManager = {
	controllers: [],
	getAllRoutes: function() {
		return _.reduce(this.controllers, function(memo, controller) {
			if(controller.modelName) {
				memo[controller.modelName] = controller.getRoutes();
			}
			return memo;
		}, {});
	}
};