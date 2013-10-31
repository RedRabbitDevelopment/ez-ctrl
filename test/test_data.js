var Q = require('q'),
	base = require('../index'),
	BaseController = base.BaseController,
	Validator = base.Validator;

var UserData = null;
exports.resetData = function() {
	UserData = [{
		name: "Nathan Tate",
		username: "yourdeveloperfriend",
		password: "password1"
	},{
		name: "Shirle Tate",
		username: "hotstuff5",
		password: "password2"
	},{
		name: "Baby Tate",
		username: "soonToCome",
		password: "password3"
	}];
}
exports.getData = function() {
	return UserData;
}
exports.resetData();

// Test synchronous validator
Validator.registerValidator("unique", function(validatorResult, validatorData) {
	return validatorData ? "must be unique" : "must not be unique";	
}, function(value, data, field) {
	var i, user, isUnique = true;
	for(i = 0, _len = UserData.length; i < _len;i++) {
		user = UserData[i];
		if(user[field] == value) {
			isUnique = false;
		}
	}
	return isUnique == data;
});
// Test asynchronous validator
Validator.registerValidator("inDb", function(validatorResult, validatorData) {
	return validatorData ? "does not exist" : "must not exist";	
}, function(value, data, field) {
	var deferred = Q.defer();
	setTimeout(function() {
		var i, user,
			found = UserData.length > value;
		if(found == data) {
			deferred.resolve();
		} else {
			deferred.reject();
		}
	}, 1000);
	return deferred.promise;
});
Validator.on("error", console.log);

exports.errors = [];

MyBaseController = BaseController.extend({});
MyBaseController.prototype.logError = function(error) {
	/* Recommended:
	console.log("ServerError", error.message);
	console.log(error.stack);
	*/
	exports.errors.push(error);
};

exports.UserController = MyBaseController.extend({
	name: "User",
	routes: {
		getAll: function() { // get /users Anything with "getAll" automatically is get /<tableize>
			// Get the users
			return UserData;
		},
		get: { // get /users/:id Anything with "get" automatically is get /<tableize>/:id
			validation: {
				id: {
					required: true,
					type: 'int',
					inDb: true
				}
			},
			logic: function(id) {
				return UserData[id];
			}
		},
		add: { // put /users Anything with "add" automatically is put /<tableize>
			validation: {
				name: {
					required: true,
					type: "text",
					length: {
						gt: 8
					}
				},
				username: {
					required: true,
					type: 'alphaNumeric',
					unique: true, // Backend Only
					length: {
						gt: 9
					}
				},
				password: {
					required: true,
					type: 'alphaNumeric',
					length: {
						gt: 8
					}
				}
			},
			logic: function(data) {
				data.id = UserData.length;
				data.comments = []
				UserData.push(data);
				return true;
			}
		},
		save: { // post /users/:id Anything with "save" automatically is post /<tableize>/:id
			validation: {
				id:  {
					required: true,
					type: 'int', 
					inDb: true
				},
				name: {
					length: {
						gt: 8
					}
				},
				username: {
					type: 'alphaNumeric',
					unique: true,
					length: {
						gt: 8
					}
				},
				password: {
					type: 'alphaNumeric',
					length: {
						gt: 8
					}
				}
			},
			logic: function(id, _data) {
				for(var key in _data) {
					UserData[id][key] = _data[key];
				}
				return true;
			}
		},
		postLogin: { // post<verb> is always /<tableize/verb
			validation: {
				username: {
					required: true,
				},
				password: {
					required: true
				}
			},
			logic: function(username, password) {
				var user;
				for(var id in UserData) {
					user = UserData[id];
					if(user.username == username) {
						if(user.password == password) {
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
			var method = null;
			// Purposefully throw error
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

exports.AsyncUserController = MyBaseController.extend({
	name: "AsyncUser",
	routes: {
		getAll: function() { // get /users Anything with "getAll" automatically is get /<tableize>
			// Get the users
			var deferred = Q.defer();
			setTimeout(function() {
				deferred.resolve(UserData);
			}, 1000);
			return deferred.promise;
		},
		get: { // get /users/:id Anything with "get" automatically is get /<tableize>/:id
			validation: {
				id: {
					required: true,
					type: 'int',
					inDb: true
				}
			},
			logic: function(id) {
				var deferred = Q.defer();
				setTimeout(function() {
					deferred.resolve(UserData[id]);
				}, 1000);
				return deferred.promise;
			}
		},
		add: { // put /users Anything with "add" automatically is put /<tableize>
			validation: {
				name: {
					required: true,
					type: "text",
					length: {
						gt: 8
					}
				},
				username: {
					required: true,
					type: 'alphaNumeric',
					length: {
						gt: 8
					}
				},
				password: {
					required: true,
					length: {
						gt: 8
					},
					type: 'alphaNumeric',
					unique: true // Backend Only
				}
			},
			logic: function(_data) {
				var deferred = Q.defer();
				setTimeout(function() {
					_data.id = UserData.length;
					_data.comments = []
					UserData.push(_data);
					deferred.resolve(true);
				}, 1000);
				return deferred.promise;
			}
		},
		save: { // post /users/:id Anything with "save" automatically is post /<tableize>/:id
			validation: {
				id:  {
					required: true,
					type: 'int', 
					inDb: true
				},
				name: {
					required: true,
					length: {
						gt: 8
					}
				},
				username: {
					type: 'alphaNumeric',
					length: {
						gt: 8
					}
				},
				password: {
					type: 'alphaNumeric',
					length: {
						gt: 8
					}
				}
			},
			logic: function(id, _data) {
				var deferred = Q.defer();
				setTimeout(function() {
					for(var key in _data) {
						UserData[id][key] = _data[key];
					}
					deferred.resolve(true);
				}, 1000);
				return deferred.promise;
			}
		},
		postLogin: { // post<verb> is always /<tableize/verb
			validation: {
				username: {
					required: true,
				},
				password: {
					required: true
				}
			},
			logic: function(username, password) {
				var deferred = Q.defer();
				setTimeout(function() {
					var user;
					for(var id in UserData) {
						user = UserData[id];
						if(user.username == username) {
							if(user.password == password) {
							 	deferred.resolve(true);
							} else {
								deferred.reject("Invalid username or password");
							}
						}
					}
					deferred.reject("Invalid username or password");
				}, 1000);
				return deferred.promise;
			}
		}
	}
});
