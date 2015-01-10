
import 'should';
import Promise from 'bluebird';
import {data} from '../test_data/models/user';
import BasicController, {middleware} from '../test_data/routes/basic';
import {BaseController, SuperController, OtherController} from '../test_data/routes/super';

import path from 'path';
console.log(path.extname('/booya/one').substring(1));
describe('Calling Statically', function() {
  beforeEach(()=> {
    for(let key in middleware) delete middleware[key];
  });
  describe('resolving', function() {
    it('should always return a promise', Promise.coroutine(function*() {
      var result = yield BasicController.getRawValue();
      result.should.equal(5);
    }));

    it('should accept arguments', Promise.coroutine(function*() {
      var result = yield BasicController.acceptArguments(3);
      result.should.equal(8);
    }));

    it('should be able to resolve a promise', Promise.coroutine(function*() {
      var result = yield BasicController.resolvePromise('happy');
      result.should.equal('happy dog');
    }));

    it('should be able to resolve a generator', Promise.coroutine(function*() {
      var result = yield BasicController.resolveGenerator();
      result.should.equal('happy:gee');
    }));
  });
  describe('LifeCycle Functions', function() {
    it('should go in a specific order', Promise.coroutine(function*() {
      yield BasicController.personalLifecycle();
      var lifecycle = [
        'initialize',
        'afterGetData',
        'afterSuccess',
        'beforeResponse'
      ];
      var order = [
        'Main',
        ''
      ];
      var last = 0;
      for(let cycle of lifecycle) {
        for(let type of order) {
          let date = middleware[`${cycle}${type}Date`];
          date.should.be.greaterThan(last);
          last = date;
        }
      }
    }));
  });
  describe('Inheritance', function() {
    it('should not override anything on the base controller', Promise.coroutine(function*() {
      (yield BaseController.overridden()).should.equal('base');
    }));
    it('should override on the child controllers', Promise.coroutine(function*() {
      (yield SuperController.overridden()).should.equal('super');
      (yield OtherController.overridden()).should.equal('other');
    }));
    it('should not override non-conflicting methods', Promise.coroutine(function*() {
      (yield SuperController.custom()).should.equal('super');
      (yield OtherController.custom()).should.equal('other');
      (yield SuperController.notOverriden()).should.equal('base');
      (yield OtherController.notOverriden()).should.equal('base');
    }));
    it('should be able to call other methods', Promise.coroutine(function*() {
      (yield SuperController.callOtherMethod()).should.equal('super');
      (yield OtherController.callOtherMethod()).should.equal('other');
      (yield BaseController.callOtherMethod()).should.equal('base');
    }));
  });
});
