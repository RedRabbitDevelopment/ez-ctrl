
import should from 'should';
import 'should-promised';
import {promisify, promisifyAll, promisifyGen, co, getNext} from '../lib/generatorUtils';

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
  describe('promisify', function() {
    it('should create a new promisified function', function() {
      return promisify(function(result, callback) {
        callback(null, 5);
      })(5).then(function(result) {
        result.should.equal(5);
      });
    });
    it('should use a rejection', function() {
      return promisify(function() {
        throw new Error('gah');
      })().should.be.rejectedWith('gah');
    });
  });
  describe('promisifyAll', function() {
    var Klass = null;
    beforeEach(function() {
      Klass = {
        asyncFn: function(result, callback) {
          setTimeout(function() {
            if(result instanceof Error) {
              callback(result);
            } else {
              callback(null, result);
            }
          });
        },
        asyncFnTwo: function(result, callback) {
          result.message += 'Two';
          this.asyncFn(result, callback);
        },
        nonFn: 5
      };
      promisifyAll(Klass);
    });
    it('should generate methods', function() {
      Klass.should.have.property('asyncFnAsync');
      Klass.should.have.property('asyncFnTwoAsync');
    });
    it('should keep the originals', function() {
      Klass.should.have.property('asyncFn');
      Klass.should.have.property('asyncFnTwo');
    });
    it('shouldn\'t modify non functions', function() {
      Klass.should.have.property('nonFn');
    });
    it('should return a promise', function() {
      return Klass.asyncFnAsync(55).then(function(result) {
        result.should.equal(55);
      });
    });
    it('should throw an error', function() {
      return Klass.asyncFnAsync(new Error('ha')).should.be.rejectedWith('ha');
    });
    it('should maintain self', function() {
      return Klass.asyncFnTwoAsync({message: 'gee'}).then(function(result) {
        result.should.have.property('message', 'geeTwo');
      });
    });
  });
  describe('promisifyGen', function() {
    class Klass {
      * fnOne(result) {
        return yield Promise.resolve(result);
      }
      * fnTwo(error) {
        return yield Promise.reject(error);
      }
      fnThree(five) {
        return five + 3;
      }
    }
    promisifyGen(Klass, ['fnOne', 'fnTwo']);
    it('should generate promisified versions of generator fns', function() {
      var k = new Klass();
      return k.fnOnePromise('happiness').should.be.eventually.equal('happiness');
    });
    it('should be a rejected promise', function() {
      var k = new Klass();
      return k.fnTwoPromise(new Error('happiness')).should.be.rejectedWith('happiness');
    });
  });
  describe('co', function() {
    it('should return a callable function', function() {
      function* gen() {
        (yield Promise.resolve(8)).should.equal(8);
        return 3;
      };
      return co(function* () {
        (yield Promise.resolve(5)).should.equal(5);
        (yield gen()).should.equal(3);
        return 'happiness';
      })().should.be.eventually.equal('happiness');
    });
  });
});
