
import 'should';
import Promise from 'bluebird';
import BasicController, {middleware} from '../test_data/basic';
import {BaseController, SuperController, OtherController} from '../test_data/super';
var co = Promise.coroutine;

describe('Calling Statically', ()=> {
  beforeEach(()=> {
    for(let key in middleware) delete middleware[key];
  });
  describe('resolving', ()=> {
    it('should always return a promise', async function() {
      var result = await BasicController.getRawValue();
      result.should.equal(5);
    });

    it('should accept arguments', async function() {
      var result = await BasicController.acceptArguments(3);
      result.should.equal(8);
    });

    it('should be able to resolve a promise', async function() {
      var result = await BasicController.resolvePromise('happy');
      result.should.equal('happy dog');
    });

    it('should include other attributes', async function() {
      var result = await BasicController.getOtherAttribute();
      result.should.equal('otherAttribute');
    });
  });
  describe('LifeCycle Functions', ()=> {
    it('should go in a specific order', async function() {
      await BasicController.personalLifecycle();
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
    });
  });
  describe('Inheritance', ()=> {
    it('should not override anything on the base controller', async function() {
      (await BaseController.overridden()).should.equal('base');
    });
    it('should override on the child controllers', async function() {
      (await SuperController.overridden()).should.equal('super');
      (await OtherController.overridden()).should.equal('other');
    });
    it('should not override non-conflicting methods', async function() {
      (await SuperController.custom()).should.equal('super');
      (await OtherController.custom()).should.equal('other');
      (await SuperController.notOverriden()).should.equal('base');
      (await OtherController.notOverriden()).should.equal('base');
    });
  });
});
