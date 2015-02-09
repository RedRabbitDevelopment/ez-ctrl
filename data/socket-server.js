
import Promise from 'bluebird';
import SocketIO from 'socket.io';
import SocketHandler from '../lib/socket';
import UserController from './routes/users';
import http from 'http';

export default function start(port = 3000) {
  let app = new SocketIO();
  app.serveClient(false);
  SocketHandler.registerController(app, UserController);
  var io = app.listen(port);
  return function stop() {
    app.close();
  };
};
