
import Controller from '../../lib/ez-ctrl';

function delay(milli) {
  return new Promise( (resolve)=> setTimeout(resolve, milli) );
}

export var middleware = {};

export default class BasicController extends Controller {
  async beforeResponse() {await this.callMiddleWare('beforeResponse'); }
  async initialize() {await this.callMiddleWare('initialize'); }
  async afterGetData() {await this.callMiddleWare('afterGetData'); }
  async afterSuccess() {await this.callMiddleWare('afterSuccess'); }
  async onServerError(error) {
    throw error;
  }
  async callMiddleWare(name) {
    await delay(5);
    if(middleware[name + 'MainDate']) throw new Error('Already ran ' + name);
    middleware[name + 'MainDate'] = Date.now();
  }
};

BasicController.modelName = 'Basic';

BasicController.defineRoutes({
  getRawValue: {
    logic() {
      return 5;
    }
  },
  getOtherAttribute: {
    otherAttribute: 'otherAttribute',
    logic() {
      return this.routeDetails.otherAttribute;
    }
  },
  acceptArguments: {
    logic(a) {
      return a + 5;
    }
  },
  // if logic is the only attribute, you should be able to use it.
  resolvePromise(a) {
    return delay(100).then( ()=> a + ' dog');
  },
  personalLifecycle: {
    beforeResponse: setNow('beforeResponse'),
    initialize: setNow('initialize'),
    afterSuccess: setNow('afterSuccess'),
    afterGetData: setNow('afterGetData'),
    logic() {}
  }
});

function setNow(attr) {
  return async function() {
    await delay(5);
    middleware[attr + 'Date'] = Date.now();
  };
}
