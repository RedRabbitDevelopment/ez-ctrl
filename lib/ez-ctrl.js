import inflection from 'inflection';
import Promise from 'bluebird';
import _ from 'lodash';
import FuncDetails from './func-details';

class BaseController {

  static extend(options) {
    var Parent = this;
    class Klass extends Parent {}
    Klass.tableName = options.name;
    _.assign(Klass, options.statics);
    _.assign(Klass.prototype, options.methods);
    Klass.registerRoutes(options.routes);
    return Klass;
  }

  static get _routes() {
    return BaseController.weakMap.get(this);
  }

  static set _routes(obj) {
    BaseController.weakMap.set(this, obj);
  }

  static get tableName() {
    return inflection.tableize(this.modelName);
  }

  static getAllRoutes(ignore) {
    var routes = {};
    if(this.__proto__.getAllRoutes)
      routes = this.__proto__.getAllRoutes(ignore);
    let thisRoutes = _.pick(this._routes, (routeDetails)=> {
      return !this.isIgnoring(routeDetails.ignore, ignore)
    });
    return _.assign(routes, thisRoutes);
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

  get displayName() {
    return `${this.class.modelName}.${this.routeName}`;
  }

  getData() {
    return FuncDetails.argsToData(FuncDetails.extractArguments(this.getLogicFunction()), this.args);
  }

  getNext(iter, throwIt, val) {
    if(typeof val == 'undefined') {
      val = throwIt;
      throwIt = false;
    }
    let promise;
    var result;
    try {
      result = iter[throwIt ? 'throw' : 'next'](val);
      if(!result.value || _.isArray(result.value) || _.isString(result.value)) {
        promise = Promise.resolve(result.value);
      } else if(result.value.then) {
        promise = result.value;
      } else if(result.value[Symbol.iterator]) {
        promise = this.getNext(result.value);
      } else {
        promise = Promise.resolve(result.value);
      }
    } catch (e) {
      promise = Promise.reject(e);
      result = result || {done: true};
    }
    if(result.done) {
      return promise;
    } else {
      return promise.then(this.getNext.bind(this, iter), this.getNext.bind(this, iter, true));
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
      yield this.runLifeCycleMethod('afterError');
    }
    try {
      yield this.runLifeCycleMethod('beforeResponse');
      return yield this.sendResponse();
    } catch(e) {
      console.log('Unrecoverable Error:', e, e.stack);
    }
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

  *runLifeCycleMethod(methodName, ...args) {
    if(this[methodName]) {
      yield this.runFunction(this[methodName], args);
    }
    if(this.routeDetails[methodName]) {
      yield this.runFunction(this.routeDetails[methodName], args);
    }
  }
}

BaseController.weakMap = new WeakMap();

export default BaseController;
