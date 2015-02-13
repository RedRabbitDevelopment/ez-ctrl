
import 'should';
import Promise from 'bluebird';
import {co} from '../lib/generatorUtils';
import {data} from '../data/models/user';
import BasicController, {middleware} from '../data/routes/basic';
import {BaseController, SuperController, OtherController} from '../data/routes/super';

describe('Calling Statically', ()=> {
  beforeEach(()=> {
    for(let key in middleware) delete middleware[key];
  });
  describe('resolving', ()=> {
    it('should always return a promise', co(function*() {
      var result = yield BasicController.getRawValue();
      result.should.equal(5);
    }));

    it('should accept arguments', co(function*() {
      var result = yield BasicController.acceptArguments(3);
      result.should.equal(8);
    }));

    it('should be able to resolve a promise', co(function*() {
      var result = yield BasicController.resolvePromise('happy');
      result.should.equal('happy dog');
    }));

    it('should be able to resolve a generator', co(function*() {
      var result = yield BasicController.resolveGenerator();
      result.should.equal('happy:gee');
    }));
  });
  describe('LifeCycle Functions', ()=> {
    it('should go in a specific order', co(function*() {
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
  describe('Inheritance', ()=> {
    it('should not override anything on the base controller', co(function*() {
      (yield BaseController.overridden()).should.equal('base');
    }));
    it('should override on the child controllers', co(function*() {
      (yield SuperController.overridden()).should.equal('super');
      (yield OtherController.overridden()).should.equal('other');
    }));
    it('should not override non-conflicting methods', co(function*() {
      (yield SuperController.custom()).should.equal('super');
      (yield OtherController.custom()).should.equal('other');
      (yield SuperController.notOverriden()).should.equal('base');
      (yield OtherController.notOverriden()).should.equal('base');
    }));
    it('should be able to call other methods', co(function*() {
      (yield SuperController.callOtherMethod()).should.equal('super');
      (yield OtherController.callOtherMethod()).should.equal('other');
      (yield BaseController.callOtherMethod()).should.equal('base');
    }));
  });
});
