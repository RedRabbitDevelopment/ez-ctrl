
import _ from 'lodash';
import UserError, {ValidationError} from './userError'

let Validations = {
  isBoolean(value) {
    if(!_.isBoolean(value)) {
      throw new UserError('must be a boolean');
    }
  },
  isDate(value) {
    if(!(value instanceof Date)) {
      throw new UserError('must be a date');
    }
  },
  isImage() { return true; },
  isFile() { return true; },
  isText(value) {
    if(!_.isString(value)) {
      throw new UserError('must be a string');
    }
  },
  isAlphanumeric(value) {
    if(!value.match(/^[a-zA-Z0-9]$/)) {
      throw new UserError('must be alphanumeric');
    }
  },
  length(value, info) {
    Validations.bounds(value.length, info);
  },
  bounds(value, info) {
    var {$gt, $lt, $eq, $lte, $gte} = info;
    if(typeof $gt !== 'undefined' && $gt > value) {
      throw new UserError('must be greater than ' + $gt);
    } else if(typeof $lt !== 'undefined' && $lt > value) {
      throw new UserError('must be less than ' + $lt);
    } else if(typeof $lte !== 'undefined' && $lte >= value) {
      throw new UserError('must be less than or equal to ' + $lte);
    } else if(typeof $gte !== 'undefined' && $gte <= value) {
      throw new UserError('must be greater than or equal to ' + $gte);
    } else if(typeof $eq !== 'undefined' && $eq <= value) {
      throw new UserError('must be ' + $eq + ' long');
    }
  },
  matchesRegex(value, $regex) {
    var $message = 'must match the regex ' + $regex.toString();
    if($regex.$regex) {
      $message = $regex.$message || $message;
      $regex = $regex.$regex;
    }
    if(!value.match($regex)) {
      throw new UserError($message);
    }
  }
};

export default class Validator {
  constructor(validations) {
    this.validations = _.extend({}, Validations, validations);
  }
  *validateData(context) {
    var errors = yield this.validateObject(context.routeDetails.data, context.data, context);
    if(errors) {
      throw new ValidationError(errors);
    }
  }
  *validateObject(validationInfo, data, context) {
    var errors = {};
    var iterators = _.map(validationInfo, (info, key)=> {
      return this.validateField(errors, info, key, data, context);
    });
    for(let iter of iterators) {
      yield iter;
    }
    return Object.keys(errors).length ? errors : null;
  }
  * validateField(errors, info, key, data, context) {
    var name = info.rename || key;
    if(info.required || !_.isUndefined(data[name])) {
      if(info.required && _.isUndefined(data[name])) {
        return errors[key] = 'is required';
      }
      var isObject = _.isObject(info.type);
      var isArray = _.isArray(info.type);
      if(isObject || isArray) {
        if(_.isObject(data[name]) == isObject && _.isArray(data[name]) == isArray) {
          var type = isObject ? type : type[0];
          var errors = yield this.validateObject(info.type, data[name], context);
          if(errors) {
            _.forEach(errors, function(value, errorKey) {
              errors[key + '.' + errorKey] = value;
            });
          }
        } else {
          errors[key] = 'must be an ' + (isObject ? 'object' : 'array');
        }
      } else if(info.type) {
        var typeValidator = `is${info.type[0].toUpperCase()}${info.type.substring(1)}`;
        yield this.runAValidation(errors, typeValidator, context, data[name], null, {
          key: key,
          validationData: info
        });
      }
      var iters = _(info).omit(['type', 'required']).map( (value, validation)=> {
        if(this.validations[validation]) {
          return this.runAValidation(errors, validation, context, data[name], value, {
            key: key,
            validationData: info
          });
        }
      }).value();
      for(let iter of iters) {
        yield iter;
      };
    }
  }
  * runAValidation(errors, fnName, context, value, validationInfo, info) {
    if(this.validations[fnName]) {
      try {
        yield this.validations[fnName].call(context, value, validationInfo, info);
      } catch(e) {
        if(!(e instanceof UserError)) {
          throw e;
        }
        errors[info.key] = e.message;
      }
    }
  }
};
