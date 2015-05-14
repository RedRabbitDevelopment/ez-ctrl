import inflection from 'inflection';
import _ from 'lodash';
import Promise from 'bluebird';
import FuncDetails from './func-details';

class BaseController {

  constructor(routeName) {
    this.routeName = routeName;
    this.routeDetails = this.constructor.getAllRoutes()[routeName];
    if(!this.routeDetails) {
      throw new Error('UndefinedRoute');
    }
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
    return _.clone(this.__routes, true);
  }

  static set _routes(obj) {
    this.__routes = obj;
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
    return _.extend({}, routes, thisRoutes);
  }

  async initialize() {}
  async afterGetData() {}
  async afterSuccess() {}
  async afterError() {}
  async beforeResponse() {}

  static defineRoutes(routes) {
    if(!this._routes) this._routes = {};
    this._routes = _.extend(this._routes, routes);
    for(let routeName in this.getAllRoutes('static')) {
      this[routeName] = function(...args) {
        let controller = new this(routeName);
        return controller.runRoute(...args);
      }
    }
  }

  static isIgnoring(ignore, lookfor) {
    let strictIgnore = ignore && ignore !== 'static';
    let includedIgnore = ignore && ignore.indexOf && ignore.indexOf(lookfor) !== -1;
    return strictIgnore || includedIgnore;
  }

  get displayName() {
    return `${this.constructor.modelName}.${this.routeName}`;
  }

  async runRoute(...args) {
    try {
      this.args = args;
      await this.runLifeCycleMethod('initialize');
      this.data = await this.getData();
      await this.runLifeCycleMethod('afterGetData');
      this.result = await this.runLogic();
      await this.runLifeCycleMethod('afterSuccess');
    } catch (e) {
      this.error = e;
      await this.runLifeCycleMethod('afterError');
    }
    await this.runLifeCycleMethod('beforeResponse');
    let returnVal = await this.sendResponse();
    return returnVal;
  }

  fork(fn) {
    this.forked.push(Promise.try(fn));
  }

  waitOnForked() {
    return Promise.all(this.forked);
  }

  sendResponse() {
    if(this.error) {
      throw this.error;
    } else {
      return this.result;
    }
  }

  static getLogicFunction(routeDetails, context) {
    let logic = routeDetails;
    logic = logic.logic || logic;
    if(_.isFunction(logic)) {
      return logic;
    } else if(_.isString(logic)) {
      return context[this.routeDetails];
    } else {
      throw new Error('Cannot find logic function for ' + this.routeName);
    }
  }
  
  getLogicFunction() {
    return this.constructor.getLogicFunction(this.routeDetails, this);
  }

  async runLogic() {
    let logic = this.getLogicFunction();
    let args = FuncDetails.dataToArgs(logic, this.data);
    return await this.runFunction(logic, args);
  }

  getData() {
    let fnArgs = FuncDetails.extractArguments(this.getLogicFunction());
    this.usedArgs = true;
    return FuncDetails.argsToData(fnArgs, this.args);
  }

  async runLifeCycleMethod(methodName, ...args) {
    if(this[methodName]) {
      await this.runFunction(this[methodName], args);
    }
    if(this.routeDetails[methodName]) {
      await this.runFunction(this.routeDetails[methodName], args);
    }
  }

  async runFunction(fn, args) {
    if(_.isFunction(fn)) {
      return await fn.apply(this, args);
    }
  }

}

export default BaseController;
