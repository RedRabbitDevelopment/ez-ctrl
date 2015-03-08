import inflection from 'inflection';
import _ from 'lodash';
import Promise from 'bluebird';
import FuncDetails from './func-details';

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
      if(!this.isIgnoring(routeDetails.ignore, 'static')) {
        this[routeName] = function(...args) {
          var controller = new this();
          return controller.runRoute(routeName, routeDetails, ...args);
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

  async runRoute(routeName, routeDetails, ...args) {
    try {
      this.args = args;
      this.routeName = routeName;
      this.routeDetails = routeDetails;
      await this.runLifeCycleMethod('initialize');
      this.data = await this.getData();
      await this.runLifeCycleMethod('afterGetData');
      let result = this.runLogic(this.data);
      this.result = await result;
      await this.runLifeCycleMethod('afterSuccess');
    } catch (e) {
      this.error = e;
      await this.runLifeCycleMethod('afterError');
    }
    await this.runLifeCycleMethod('beforeResponse');
    let returnVal = await this.sendResponse();
    this.logForked();
    return returnVal;
  }

  logForked() {
    Promise.all(this.forked).catch((error)=> {
      console.log('Forked Error:', error, error.stack);
    });
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

  async runLogic() {
    let logic = this.getLogicFunction();
    let args = FuncDetails.dataToArgs(logic, this.data);
    return await this.runFunction(logic, args);
  }

  async runFunction(fn, args) {
    if(_.isFunction(fn)) {
      return await fn.apply(this, args);
    }
  }

  async runLifeCycleMethod(methodName, ...args) {
    if(this[methodName]) {
      await this.runFunction(this[methodName], args);
    }
    if(this.routeDetails[methodName]) {
      await this.runFunction(this.routeDetails[methodName], args);
    }
  }
}

export default BaseController;
