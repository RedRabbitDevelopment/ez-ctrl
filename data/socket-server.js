import http from 'http';
import express from 'express';
import SocketHandler from '../lib/socket';
import UserController from './routes/users';
var SocketIO = require('socket.io');

export default function start(port = 3000) {
  let app = express();
  let server = http.createServer(app);
  let io = SocketIO(server, {serveClient: false});
  return new Promise( (resolve, reject)=> {
    server.listen(port, resolve);
  }).then( ()=> {
    let socketHandler = new SocketHandler(io);
    socketHandler.registerController(UserController);
    return function stop() {
      return new Promise( (resolve, reject)=> {
        io.close();
        server.on('close', ()=> {
          resolve();
        });
        server.on('error', reject);
      });
    };
  });
};
