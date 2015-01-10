
import 'inflection'

let SocketHandler = {
  registerControllers(socketServer, controllers) {
    for(let Controller of controllers) {
      this.registerController(socketServer, Controller);
    }
  },
  registerController(socketServer, Controller) {
    class SocketController extends Controller {
      constructor(socket, id) {
        super();
        this.socket = socket;
        this.id = id;
      }
      getData() {
        this.data = this.args;
      }
      sendResponse() {
        let response = {success: true};
        if(this.error) {
          response.success = false;
          response.error = this.error.message;
          response.errors = this.error.errors;
        } else {
          response.result = this.result;
        }
        this.socket.emit(this.id, response);
      }
    }
    let routes = SocketController.getAllRoutes('socket');
    socketServer.on('connection', (socket)=> {
      for(let routeName in routes) {
        let eventName = `${Controller.tableName}:${routeName}`;
        let routeDetails = routes[routeName];
        socket.on(eventName, (data)=> {
          let controller = new SocketController(socket, data.id);
          controller[routeName](data.data).done();
        });
      }
    });
  }
};

export default SocketHandler;
