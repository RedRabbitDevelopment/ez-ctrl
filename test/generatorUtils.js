
import Promise from 'bluebird';
import should from 'should';
import 'should-promised';
import {getNext} from '../lib/generatorUtils';
var co = Promise.coroutine;

describe('Generator Utils', function() {
  describe('getNext', function() {
    function* createIter(yields, expectations) {
      for(let i = 0; i < yields.length; i++) {
        let result = yield yields[i];
        should(result).equal(expectations[i]);
      }
    };
    it('should be able to intrepret raw values', function() {
      var arr = [5, 4, 3];
      var rawValues = [5, 'string', arr, undefined, null];
      return getNext(createIter(rawValues, rawValues));
    });
    it('should be able to interpret promises', function() {
      var promises = [];
      var expectations = [];
      for(let i = 0; i < 5; i++) {
        promises.push(Promise.resolve(i));
        expectations.push(i);
      }
      return getNext(createIter(promises, expectations));
    });
    it('should be able to interpret generators', function() {
      var deep = function* (result, depth) {
        if(depth > 0) {
          should(yield deep(result, depth - 1)).equal(result);
        }
        return yield result;
      };
      var generators = [
        deep('happy', 5),
        deep(8, 2)
      ];
      var expectations = ['happy', 8];
      return getNext(createIter(generators, expectations));
    });
    it('should be able to catch errors', function() {
      return getNext((function* () {
        throw new Error('gah');        
      })()).should.be.rejectedWith('gah');
    });
    it('should be able to throw errors', function() {
      return getNext((function*() {
        let error = false;
        try {
          yield Promise.reject('gah');
        } catch(e) {
          error = e;
        }
        error.should.be.ok.and.equal('gah');
      })());
    });
  });
});
