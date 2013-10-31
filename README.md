ez-ctrl
=======

```js
var EZController = require('ez-ctrl').BaseController;
UserController = BaseController.extend({
	name: "User",
	routes: {
		getAll: function() { // Anything with "getAll" automatically is get /users
			// Return raw data which is translated into JSON
			return UserData;
		},
		get: { // Anything with "get" automatically is get /users/:id
			validation: {
				id: {
					required: true,
					type: 'int', // convert string inputs to integer
					inDb: true // create custom validation
				}
			},
			logic: function(id) {
				// Note, id is already clean! No need to check if it exists!
				// Return any promise
				var deferred = Q.defer();
				setTimeout(function() {
					deferred.resolve(UserData[id]);
				}, 25);
				return deferred.promise;
			}
		},
		add: { // Anything with "add" automatically is put /users
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
					unique: true,
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
		save: { // Anything with "save" automatically is post /users/:id
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
			logic: function(id, _data) { // use input like (id, name, username, password) or (id, _data)
				for(var key in _data) {
					UserData[id][key] = _data[key];
				}
				return true;
			}
		},
		postLogin: { // post<verb> is always /users/verb
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
							throw new Error("Invalid username or password"); // Throw errors
						}
					}
				}
				throw new Error("Invalid username or password");
			}
		},
		action: { // any action is /users/action
			validation: {
				id: {
					type: 'int',
					required: true,
					inDb: true
				}
			},
			logic: function() {
				return "Result";
			}
		}
		usesIdAction: { // any action with usesId is /users/:id/action
			validation: {
				id: {
					type: 'int',
					required: true,
					inDb: true
				}
			},
			logic: function(id) {
				return "Result";
			}
		}
	}
});


```

## Installation

    $ npm install ez-ctrl

## Features

  * Built on [Express](https://raw.github.com/visionmedia/express)
  * Has all the same features as express
  * Decouples data retrieval, data validation, and logic for better testing
  * DRY - focus more on logic and less on sanitation
  * DRY - validate input on the front-end and back-end simultaneously (coming soon!)

## Philosophy

  The EZController philosophy was inspired by Ruby on Rails, but with a few
  changes. The basic idea is to make testing for validation, routing, and
  logic built right in, by removing most references to req and res in the
  business logic of the application.
  
  Also, in the future, we hope to be able to create a way for the developers
  to reuse the validation code on the front-end, essentially building 
  front-end and back-end validation at the same time.

## License

(The MIT License)

Copyright (c) 2009-2012 TJ Holowaychuk &lt;tj@vision-media.ca&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.