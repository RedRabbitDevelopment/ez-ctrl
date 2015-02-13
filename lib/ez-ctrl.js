import inflection from 'inflection';
import _ from 'lodash';
import FuncDetails from './func-details';
import {getNext} from './generatorUtils';

class BaseController {

  static extend(options) {
    var Parent = this;
    class Klass extends Parent {}
    Klass.modelName = options.modelName;
    _.assign(Klass, options.statics);
    _.assign(Klass.prototype, options.methods);
    Klass.defineRoutes(options.routes);
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
        let iter = this.runRoute(routeName, routeDetails, ...args);
        return getNext(iter);
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

  *runRoute(routeName, routeDetails, ...args) {
    try {
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
