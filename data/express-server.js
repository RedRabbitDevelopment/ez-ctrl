
import express from 'express';
import ExpressHandler from '../lib/express';
import BasicController, {middleware} from './routes/basic';
import UserController from './routes/users';
import bodyParser from 'body-parser';

export default function start(port = 3000) {
  var app = express();
  app.use(bodyParser.json());
  let expressHandler = new ExpressHandler(app);
  expressHandler.registerControllers([BasicController, UserController]);
  expressHandler.registerBatch();
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

if(process.env.RUN_SERVER) {
  start();
}
