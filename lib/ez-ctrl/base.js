
import inflection from 'inflection';
import Promise from 'bluebird';
import _ from 'lodash';
import FuncDetails from '../utils/func-details';


class BaseController {

  static extend(name) {
    var Parent = this;
    let Klass = function() {
      if(Parent !== null) {
        Parent.apply(this, arguments);
      }
    };
    Klass.displayName = name + 'Controller';
    Klass.prototype = Object.create(Parent && Parent.prototype, {
      constructor: {
        value: Klass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if(Parent) Klass.__proto__ = Parent;
    return Klass;
  }
  static get _routes() {
    return BaseController.weakMap.get(this);
  }

  static set _routes(obj) {
    BaseController.weakMap.set(this, obj);
  }

  static getAllRoutes(ignore) {
    var routes = {};
    if(this.__proto__.getAllRoutes)
      routes = this.__proto__.getAllRoutes(ignore);
    let thisRoutes = _.filter(this._routes, (routeDetails)=> {
      this.isIgnoring(routeDetails.ignore, ignore)
    });
    return _.assign(routes, thisRoutes);
  }

  static get tableName() {
    if(this.modelName)
      return inflection.tableize(this.modelName);
  }
  initialize() {}
  afterGetData() {}
  afterSuccess() {}
  afterError() {}
  beforeResponse() {}

  static defineRoutes(routes) {
    if(!this._routes) this._routes = {};
    Object.assign(this._routes, routes);
    for(let routeName in routes) {
      let routeDetails = routes[routeName];
      this.prototype[routeName] = function(...args) {
        let iter = this.runRoute.apply(this, [routeName, routeDetails].concat(args));
        return this.getNext(iter);
      };
      if(!this.isIgnoring(routeDetails.ignore, 'static')) {
        this[routeName] = function(...args) {
          var controller = new this();
          return controller[routeName](...args);
        };
      }
    }
  }

  static isIgnoring(ignore, lookfor) {
    let strictIgnore = ignore && ignore !== 'static';
    let includedIgnore = ignore && ignore.indexOf && ignore.indexOf(lookfor) !== -1;
    return strictIgnore || includedIgnore;
  }

  getData() {
    return FuncDetails.argsToData(FuncDetails.extractArguments(this.getLogicFunction()), this.args);
  }

  getNext(iter, val) {
    var result = iter.next(val);
    let promise;
    if(!result.value || _.isArray(result.value) || _.isString(result.value)) {
      promise = Promise.resolve(result.value);
    } else if(result.value.then) {
      promise = result.value;
    } else if(result.value[Symbol.iterator]) {
      promise = this.getNext(result.value);
    } else {
      promise = Promise.resolve(result.value);
    }
    if(result.done) {
      return promise;
    } else {
      return promise.then(this.getNext.bind(this, iter));
    }
  }

  *runRoute(routeName, routeDetails, ...args) {
    try {
      this.args = args;
      this.routeName = routeName;
      this.routeDetails = routeDetails;
      yield this.runLifeCycleMethod('initialize');
      this.data = yield this.getData();
      yield this.runLifeCycleMethod('afterGetData');
      let result = this.runLogic(this.data);
      this.result = yield result;
      yield this.runLifeCycleMethod('afterSuccess');
    } catch (e) {
      this.error = e;
      console.log(e.stack);
      this.runLifeCycleMethod('afterError');
    }
    yield this.runLifeCycleMethod('beforeResponse');
    return this.sendResponse();
  }

  sendResponse() {
    if(this.error) {
      throw this.error;
    } else {
      return this.result;
    }
  }
  
  getLogicFunction() {
    if(_.isFunction(this.routeDetails)) {
      return this.routeDetails;
    } else {
      return this.routeDetails.logic;
    }
  }

  * runLogic() {
    let logic = this.getLogicFunction();
    let args = FuncDetails.dataToArgs(logic, this.data);
    return yield this.runFunction(logic, args);
  }

  * runFunction(fn, args) {
    if(_.isFunction(fn)) {
      return yield fn.apply(this, args);
    }
  }

  *runLifeCycleMethod(methodName) {
    if(this[methodName]) {
      yield this.runFunction(this[methodName]);
    }
    if(this.routeDetails[methodName]) {
      yield this.runFunction(this.routeDetails[methodName]);
    }
  }
}

BaseController.weakMap = new WeakMap();

export default BaseController;
