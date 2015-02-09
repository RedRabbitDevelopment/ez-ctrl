
import express from 'express';
import Promise from 'bluebird';
import ExpressHandler from '../lib/ez-express';
import BasicController, {middleware} from './routes/basic';
import {BaseController, SuperController, OtherController} from './routes/super';
import UserController from './routes/users';
import bodyParser from 'body-parser';

export default function start(port = 3000) {
  var app = express();
  app.use(bodyParser.json());
  ExpressHandler.registerControllers(app,
      [BasicController, SuperController, OtherController, UserController]);
  app.stop = function() {
    return new Promise( (resolve, reject)=>{
      app.server.close(resolve);
      app.server.on('error', reject);
    });
  }; 
  return new Promise( (resolve, reject)=>{
    app.server = app.listen(port, resolve);
    app.server.on('error', reject);
  })
    .then( ()=> app);
};

