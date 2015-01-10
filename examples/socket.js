
import http from 'http';
import fs from 'fs';
import url from 'url';
import Socket from 'socket.io';
import UserController from './routes/users';
import SocketHandler from '../lib/ez-socket.js';
import SocketClient from 'socket.io-client';

var app = http.createServer(handler);
var io = Socket(app);

function handler(req, res) {
  var path = url.parse(req.url);
  fs.createReadStream(`${__dirname}/public${path.pathname}`).pipe(res);
}

SocketHandler.registerControllers(io, [UserController]);

app.listen(3000, ()=> {
  let client = SocketClient.connect('http://localhost:3000');
  client.on('connect', function() {
    console.log('connect');
    client.emit('users:query', {
      id: 5
    });
    client.on(5, console.log.bind(console, 'result'));
  });
});
