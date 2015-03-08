
import 'should';
import _ from 'lodash';
import Promise from 'bluebird';
import request from 'request';
import start from '../data/express-server';
import {data} from '../data/models/user';
import UserController from '../data/routes/users';
var requestAsync = Promise.promisify(request);
request = Promise.promisifyAll(request);

describe('Express Controller', ()=> {
  var server;
  var port = 3000;
  before(async function() {
    server = await start(port);
  });
  after(async function() {
    if(server) {
      await server.stop(port);
    }
  });
  beforeEach(function() {
    delete UserController.serverError;
    data.reset();
  });
  afterEach(function() {
    if(UserController.serverError) throw UserController.serverError;
  });
  describe('resolving', ()=> {
    async function makeRequest(url = '', options) {
      options = _.defaults({}, options, {
        expectedStatus: 200,
        method: 'GET',
        json: true
      });
      var [response, body] = await requestAsync(`http://localhost:${port}${url}`, options);
      if(response.statusCode === 400 && options.expectedStatus !== response.statusCode) {
        throw new Error('ValidationError: ' + JSON.stringify(body.errors));
      }
      response.statusCode.should.equal(options.expectedStatus);
      return options.all ? {
        response,
        body
      } : body;
    };
    it('should resolve', async function() {
      var result = await makeRequest('/basics/raw-value');
      result.should.equal(5);
    });
    it('should know query', async function() {
      var users = await makeRequest('/users');
      users.should.have.property('length', data.length);
    });
    it('should know get', async function() {
      var user = await makeRequest('/users/1');
      user.should.have.property('id', 1);
      user.should.have.property('name', data[1].name);
    });
    it('should know create', async function() {
      var before = data.length;
      var user = await makeRequest('/users', {
        method: 'POST',
        expectedStatus: 201,
        body: {name: 'booya', male: true}
      });
      user.should.have.property('id', 2);
      user.should.have.property('name', 'booya');
      data[before].should.have.property('name', 'booya');
      data.should.have.property('length', before + 1);
    });
    it('should know update', async function() {
      var user = await makeRequest('/users/1', {
        method: 'PUT',
        body: {name: 'booya2'}
      });
      user.should.have.property('id', 1);
      user.should.have.property('name', 'booya2');
    });
    it('should know delete', async function() {
      var before = data.length;
      var user = await makeRequest('/users/1', {
        method: 'DELETE',
        expectedStatus: 202
      });
      data.should.have.property('length', before - 1);
    });
    it('should be able to handle unexpected errors', async function() {
      var response = await makeRequest('/users/unexpected-error', {
        expectedStatus: 500
      });
      response.should.have.property('error', 'ServerError');
      delete UserController.serverError;
    });
    it('should be able to handle status errors', async function() {
      var response = await makeRequest('/users/13', {
        expectedStatus: 404
      });
      response.should.have.property('error', 'NotFound');
    });
  });
});

