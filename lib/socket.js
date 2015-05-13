
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
      constructor(routeName) {
        super(routeName);
      }
      getData() {
        return this.data;
      }
      async runSocketRouteAndRender(socket, cb) {
        cb(await this.runSocketRoute(socket));
      }
      async runSocketRoute(socket) {
        this.socket = socket;
        let response = {success: true};
        try {
          response.result = await this.runRoute();
        } catch(error) {
          this.error = error;
          response.success = false;
          if(!(this.error instanceof UserError)) {
            await this.runLifeCycleMethod('onServerError', this.error);
            this.error = new ServerError();
          }
          response.error = this.error.message;
          response.errors = this.error.errors;
        }
        return response;
      }
    }
    let routes = SocketController.getAllRoutes('socket');
    socketServer.on('connection', (socket)=> {
      console.log('got connection');
      _.forEach(routes, function(routeDetails, routeName) {
        let eventName = `${Controller.tableName}:${routeName}`;
        socket.on(eventName, (data, cb)=> {
          console.log('got event', eventName);
          if(!cb) {
            cb = data;
            data = {};
          }
          if(cb) {
            let controller = new SocketController(routeName);
            controller.data = data || {};
            controller.runSocketRouteAndRender(socket, cb).catch(console.error.bind(console));
          }
        });
      }, this);
    });
  }
};

export default SocketHandler;
