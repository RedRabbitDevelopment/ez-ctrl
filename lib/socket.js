
import _ from 'lodash';
import inflection from 'inflection';
import path from 'path';
import Converter from './converter';
import Validator from './validator';
import UserError, {ServerError} from './userError';

let SocketHandler = {
  registerControllers(socketServer, controllers) {
    for(let Controller of controllers) {
      this.registerController(socketServer, Controller);
    }
  },
  registerController(socketServer, Controller) {
    class SocketController extends Controller {
      constructor(socket, cb) {
        super();
        this.socket = socket;
        this.cb = cb;
      }
      getData() {
        return this.args[0];
      }
      async translateResponse() {
        if(super.translateResponse) {
          return super.translateResponse();
        }
        let response = {success: true};
        if(this.error) {
          response.success = false;
          if(!(this.error instanceof UserError)) {
            await this.runLifeCycleMethod('onServerError', this.error);
            this.error = new ServerError();
          }
          response.error = this.error.message;
          response.errors = this.error.errors;
        } else {
          response.result = this.result;
        }
        return response;
      }
      async sendResponse() {
        this.cb(await this.translateResponse());
      }
    }
    let routes = SocketController.getAllRoutes('socket');
    socketServer.on('connection', (socket)=> {
      _.forEach(routes, function(routeDetails, routeName) {
        let eventName = `${Controller.tableName}:${routeName}`;
        socket.on(eventName, (data, cb)=> {
          if(!cb) {
            cb = data;
            data = {};
          }
          if(cb) {
            let controller = new SocketController(socket, cb);
            controller[routeName](data || {}).catch(console.error.bind(console));
          }
        });
      }, this);
    });
  }
};

export default SocketHandler;
