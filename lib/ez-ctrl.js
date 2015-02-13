import inflection from 'inflection';
import _ from 'lodash';
import Promise from 'bluebird';
import FuncDetails from './func-details';
import {getNext} from './generatorUtils';

let PrivateRouteMap = new WeakMap();

class BaseController {

  constructor() {
    this.forked = [];
  }

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
    return PrivateRouteMap.get(this);
  }

  static set _routes(obj) {
    PrivateRouteMap.set(this, obj);
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
      let returnVal = yield this.sendResponse();
      this.logForked();
      return returnVal;
    } catch(e) {
      console.log('Unrecoverable Error:', e, e.stack);
    }
  }

  logForked() {
    Promise.all(this.forked).then(null, (error)=> {
      console.log('Forked Error:', error, error.stack);
    });
  }

  yieldValue(val) {
    return getNext(val);
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

export default BaseController;
