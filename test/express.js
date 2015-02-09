
import 'should';
import _ from 'lodash';
import Promise from 'bluebird';
import request from 'request';
import start from '../data/express-server';
import {data} from '../data/models/user';
import UserController from '../data/routes/users';
var requestAsync = Promise.promisify(request);
var co = Promise.coroutine;

request = Promise.promisifyAll(request);

describe('Express Controller', ()=> {
  var server;
  var port = 3000;
  before(co(function*() {
    server = yield start(port);
  }));
  after(co(function*() {
    if(server) {
      yield server.stop(port);
    }
  }));
  beforeEach(function() {
    delete UserController.serverError;
    data.reset();
  });
  afterEach(function() {
    if(UserController.serverError) throw UserController.serverError;
  });
  describe('resolving', ()=> {
    function* makeRequest(url = '', options) {
      options = _.defaults({}, options, {
        expectedStatus: 200,
        method: 'GET',
        json: true
      });
      var [response, body] = yield requestAsync(`http://localhost:${port}${url}`, options);
      if(response.statusCode === 400 && options.expectedStatus !== response.statusCode) {
        throw new Error('ValidationError: ' + JSON.stringify(body.errors));
      }
      response.statusCode.should.equal(options.expectedStatus);
      return options.all ? body : body.result;
    };
    it('should resolve', co(function*() {
      var result = yield* makeRequest('/basics/raw-value');
      result.should.equal(5);
    }));
    it('should know query', co(function*() {
      var users = yield* makeRequest('/users');
      users.should.have.property('length', data.length);
    }));
    it('should know get', co(function*() {
      var user = yield* makeRequest('/users/1');
      user.should.have.property('id', 1);
      user.should.have.property('name', data[1].name);
    }));
    it('should know create', co(function*() {
      var before = data.length;
      var user = yield* makeRequest('/users', {
        method: 'POST',
        expectedStatus: 201,
        body: {name: 'booya', male: true}
      });
      user.should.have.property('id', 2);
      user.should.have.property('name', 'booya');
      data[before].should.have.property('name', 'booya');
      data.should.have.property('length', before + 1);
    }));
    it('should know update', co(function*() {
      var user = yield* makeRequest('/users/1', {
        method: 'PUT',
        body: {name: 'booya2'}
      });
      user.should.have.property('id', 1);
      user.should.have.property('name', 'booya2');
    }));
    it('should know delete', co(function*() {
      var before = data.length;
      var user = yield* makeRequest('/users/1', {
        method: 'DELETE',
        expectedStatus: 202
      });
      data.should.have.property('length', before - 1);
    }));
    it('should be able to handle unexpected errors', co(function*() {
      var response = yield* makeRequest('/users/unexpected-error', {
        expectedStatus: 500,
        all: true
      });
      response.should.have.property('success', false);
      response.should.have.property('error', 'ServerError');
      delete UserController.serverError;
    }));
    it('should be able to handle status errors', co(function*() {
      var response = yield* makeRequest('/users/13', {
        expectedStatus: 404,
        all: true
      });
      response.should.have.property('success', false);
      response.should.have.property('error', 'NotFound');
    }));
  });
});

