
import UserController from './routes/users';
import express from 'express';
import ExpressHandler from '../lib/ez-express';
import request from 'request';

let app = express();

ExpressHandler.registerControllers(app, [UserController]);

app.listen(3000, ()=> {
  request.get('http://localhost:3000/users', function(err, response, body) {
    console.log('here', body);
  });
});
