
import 'should';
import {data} from '../data/models/user';
import UserController from '../data/routes/users';
import SocketServer from '../data/socket-server';
import Promise from 'bluebird';
import SocketClient from 'socket.io-client';
import {co} from '../lib/generatorUtils';

describe('Socket Handler', ()=> {
  var close;
  var manager;
  before(function() {
    close = SocketServer();
    manager = SocketClient('http://localhost:3000');
  });
  after(function() {
    close && close();
  });
  beforeEach(function() {
    delete UserController.serverError;
    data.reset();
  });
  afterEach(function() {
    if(UserController.serverError) throw UserController.serverError;
  });
  it('should be able to receive a call', co(function*() {
    var response = yield new Promise( (resolve, reject)=> {
      manager.emit('users:query', resolve);
    });
    response.should.have.property('success', true);
    response.should.have.property('result');
    response.result.should.have.property('length', data.length);
  }));
  it('should pass data along', co(function*() {
    var before = data.length;
    var response = yield new Promise( (resolve, reject)=> {
      manager.emit('users:create', {
          name: 'Stephanie',
          male: false
      }, resolve);
    });
    response.should.have.property('success', true);
    response.result.should.have.property('id', data[data.length - 1].id);
    data.should.have.property('length', before + 1);
  }));
});
