
import Promise from 'bluebird';
import Controller from '../../lib/ez-ctrl/base';

export var middleware = {};

export default class BasicController extends Controller {
  *beforeResponse() {yield this.callMiddleWare('beforeResponse'); }
  *initialize() {yield this.callMiddleWare('initialize'); }
  *afterGetData() {yield this.callMiddleWare('afterGetData'); }
  *afterSuccess() {yield this.callMiddleWare('afterSuccess'); }
  *callMiddleWare(name) {
    yield Promise.delay(5);
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
  acceptArguments: {
    logic(a) {
      return a + 5;
    }
  },
  // if logic is the only attribute, you should be able to use it.
  resolvePromise(a) {
    return Promise.delay(100).then( ()=> a + ' dog');
  },
  * resolveGenerator() {
    let promiseResult = yield Promise.resolve('happy');
    let promiseResult2 = yield Promise.resolve('gee');
    return promiseResult + ":" + promiseResult2;
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
  return function*() {
    yield Promise.delay(5);
    middleware[attr + 'Date'] = Date.now();
  };
}
