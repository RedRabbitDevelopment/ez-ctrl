import _ from 'lodash';

export function getNext(iter, throwIt, val) {
  if(typeof val == 'undefined') {
    val = throwIt;
    throwIt = false;
  }
  let promise;
  var result;
  try {
    result = iter[throwIt ? 'throw' : 'next'](val);
    if(!result.value || _.isArray(result.value) || _.isString(result.value)) {
      promise = Promise.resolve(result.value);
    } else if(result.value.then) {
      promise = result.value;
    } else if(result.value[Symbol.iterator]) {
      promise = getNext.call(this, result.value);
    } else {
      promise = Promise.resolve(result.value);
    }
  } catch (e) {
    promise = Promise.reject(e);
    result = result || {done: true};
  }
  if(result.done) {
    return promise;
  } else {
    return promise.then(getNext.bind(this, iter), getNext.bind(this, iter, true));
  }
}

export function promisify(Klass, methods) {
  let __proto = Klass.prototype;
  methods.forEach(function(method) {
    __proto[method + 'Promise'] = function() {
      return getNext(__proto[method].apply(this, arguments));
    }
  });
};
