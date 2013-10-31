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
      logic: function(id, _data) {
        // input can be (id, name, username, password) or (id, _data)
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
  
## API

### BaseController

  Exposed by `require('ez-controller').BaseController`.

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
    
  getAll: gets /users
  get: gets /users/:id
  add: puts /users
  save: posts /users/:id
  delete: deletes /users/:id
  
  The default method can be overridden by adding a method parameter in the route:
    
    ```js
    routes: {
    getAll: {
      method: "post",
      logic: function() {
        // Do stuff
      }
    }
  }
  ```
  
  ### custom routes:
  The http method is by default get, but you can change that by either adding a "method"
  parameter or by throwing the method at the beginning of the route name:
    
    ```js
    routes: {
      postLogin: function() {
        // Do stuff
      }
    }
    ```
  
  or
  
  
    ```js
      routes: {
      login: {
        method: "post",
        logic: function() {
          // Do stuff
        }
      }
    }
    ```

  ### validation:
  You can validation to any method with the validation parameter:
    
    ```js
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
    ```
  
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

### Validator.registerValidator(validatorName, message, validator);
  You can create custom validation methods by registering it:
  
    ```js
    Validator = require('ez-ctrl').Validator;
    
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
  
    ```
  
  validatorName: name to use in the validation parameter
  message: a message to send back when the validation fails. This can be a string or a function(validatorResult, validatorData) where
    validatorResult: the result of the validation
    validatorData: the data that was tagged onto the validation parameter
  validator: a function(value, validatorData, field):
    value: the value of the field
    validatorData: the data that was tagged onto the validation parameter
    field: the field name
  
  #### Converter.registerConverter(converterName, converterFunction);
  You can create custom converter by registering it:
  
  ```js
    Converter = require('ez-ctrl').Converter;
    
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
  
    ```
  
  converterName: name to use in the type parameter
  converter: a function(value):
    value: the value to be converted
  
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