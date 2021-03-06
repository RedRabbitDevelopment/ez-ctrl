EZController
=======

## Installation

    $ npm i -S ez-ctrl

## Features

  * DRY - Write code once, use code everywhere.
  * Automatic generation of client-side code (via gulp-ez)
  * Middleware.
  * Compatible with Express, Socket.io, or any custom-run application.
  * Only write server-side and client-side validation once.

## Philosophy

  The EZController is not just a Ruby on Rails inspired application. EZController is
  all about annotating route information and passing that information down to the client
  to create truly isomorphic code.
  
  One example use case is input validation. It's considered good practice to run input
  validation on both the server and the client. You want the validation to run on the
  client for ease of use and speed, but you need the validation to run on the server
  for security reasons. Without EZController, you'd be rewriting that code in both
  places. With EZController, you write it once (on the server), pass that information
  down to the client, and you're set!
  
## API

### BaseController

  Exposed by `require('ez-ctrl')`.

### ControllerManager.registerRoutes(app)

  In order to allow your express server to route to your different logic methods, express needs to be aware of them.
  
    ExpressHandler = require('ez-ctrl').ExpressHandler;
    ExpressHandler.registerRoutes(app, [ControllerA, ControllerB]);

### BaseController.extend()

  Creates a new `Controller`.
  
  options:
  name: name of the controller. This will be prepended to the beginning of every route.
  i.e.:
  User: users
  Tweet: tweets
  UserComment: user_comments
  
  routes: all of the routes for that controller
  
  crud routes:
  The following are crud routes that are made easier for you:
    
  query: gets /users
  get: gets /users/:id
  add: puts /users
  save: posts /users/:id
  delete: deletes /users/:id
  
  The default method can be overridden by adding a method parameter in the route:
    
    routes: {
      query: {
        method: "post",
        logic: function() {
          // Do stuff
        }
      }
    }
  
### custom routes:
  The http method is by default get, but you can change that by either adding a "method"
  parameter or by throwing the method at the beginning of the route name:
    
    routes: {
      postLogin: function() {
        // Do stuff
      }
    }
  
  or
  
  
      routes: {
      login: {
        method: "post",
        logic: function() {
          // Do stuff
        }
      }
    }

### validation:
  You can validation to any method with the validation parameter:
    
    routes: {
      postLogin: {
        validation: {
          username: {
            required: true,
          },
          password: {
            required: true
          }
        },
        logic: function(username, password) {
          // Do stuff
        }
      }
    }
  
  The existing validation methods are:
  required: must be present
  float: must be a float
  int: must be an integer
  alphaNumeric: must be alpha-numeric
  type: set type to float, int, or alpha-numeric
  length: which includes it's own set of parameters:
  length: {gt: 8},
  length: {lt: 8},
  length: {between: [8, 16]}
  
  Not that setting the type may also run it through a conversion:
  type: 'int' - convert to an integer
  type: 'float' - convert to an integer

### Custom Validation
  You can create custom validation methods by registering it:
  
    Validator = require('ez-ctrl').Validator;
    // Validator.registerValidator(validatorName, message, validator);
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
  
    ...
    routes: {
      add: {
        validation: {
          username: {
            unique: true // validatorName: validatorData
          }
        }
        logic: function(username) {
        
        }
      }
    }
  
  
  validatorName: name to use in the validation parameter
  message: a message to send back when the validation fails. This can be a string or a function(validatorResult, validatorData) where
    validatorResult: the result of the validation
    validatorData: the data that was tagged onto the validation parameter
  validator: a function(value, validatorData, field):
    value: the value of the field
    validatorData: the data that was tagged onto the validation parameter
    field: the field name
  
### Custom Conversion
  You can create custom converter by registering it:
  
    Converter = require('ez-ctrl').Converter;
    // Converter.registerConverter(converterName, converterFunction);
    Converter.registerConverter("object", function(value) {
      return JSON.parse(value);
    });
  
    ...
    routes: {
      add: {
        validation: {
          username: {
            type: 'object'
          }
        }
        logic: function(username) {
        
        }
      }
    }
    
  converterName: name to use in the type parameter
  converter: a function(value):
    value: the value to be converted

### Front End Use
  After defining the controllers on the back-end, the API can easily accessed through a frontend library.
  Example:
    // On the browser
    User.login(username, password).then(function(result) {
      // do stuff
    }).fail(function(error) {
      // do stuff
    });
  
  Neat trick, the validation runs client side for quicker responses to errors! No more do you have to write validation code for both the client and
  server sides.
  
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
