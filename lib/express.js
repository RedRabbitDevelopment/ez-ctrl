
import _ from 'lodash';
import inflection from 'inflection';
import path from 'path';
import Converter from './ez-converter';
import Validator from './ez-validator';
import UserError, {ServerError} from './userError';

let ExpressHandler = {
  methods: ['get', 'put', 'post', 'delete'],
  registerControllers(expressApp, controllers) {
    _.forEach(controllers, (Controller)=> {
      this.registerController(expressApp, Controller);
    }, this);
  },
  registerController(expressApp, Controller) {
    class ExpressController extends Controller {
      constructor(req, res, next) {
        super();
        this.request = req;
        this.response = res;
        this.next = next;
      }
      getData() {
        return _.extend({}, this.request.params, this.request.query, this.request.body);
      }
      * translateResponse() {
        if(super.translateResponse) {
          return super.translateResponse();
        }
        let response = {success: true};
        if(this.error) {
          response.success = false;
          if(!(this.error instanceof UserError)) {
            yield this.runLifeCycleMethod('onServerError', this.error);
            this.error = new ServerError();
          }
          response.error = this.error.message;
          response.errors = this.error.errors;
        } else {
          response.result = this.result;
        }
        return response;
      }
      * sendResponse() {
        if(this.error) {
          this.response.status(this.error.status || 500);
        } else {
          this.response.status(this.status || this.finishStatus || 200);
        }
        let response = yield this.translateResponse();
        let type = path.extname(this.request.path).substring(1) || 'json';
        switch(type) {
          case 'csv':
          case 'txt':
            // Think through
            if(response.success) {
              if(response.result.pipe) {
                return response.result.pipe(this.response);
              } else {
                return this.response.end(this.response);
              }
            }
          case 'html':
            return this.response.render(this.tableName + '/' + this.routeName, response);
          case 'json':
            return this.response.json(response);
          default:
            throw new Error(`Unknown return type '${type}'`);
        };
      }
    }
    let routes = ExpressController.getAllRoutes('express');
    for(let routeName in routes) {
      let routeDetails = routes[routeName];
      this.registerRoute(expressApp, routeName, routeDetails, ExpressController);
    }
  },
  registerRoute(expressApp, routeName, routeDetails, Controller) {
    let idPattern;
    let basePattern = '/' + Controller.tableName;
    if(Controller.idRegex) {
      idPattern = idRegex === false ? '' : `(${idRegex})`;
    } else {
      idPattern = '([0-9]+)';
    }
    let individualPattern = `${basePattern}/:id${idPattern}`
    let usesId = false;
    let method, pattern;
    let finishStatus = 200;
    switch(routeName) {
      case 'query':
        method = 'get'
        pattern = basePattern;
        break;
      case 'get':
        method = 'get';
        pattern = individualPattern;
        usesId = true;
        break;
      case 'add':
      case 'create':
      case 'post':
        method = 'post';
        pattern = basePattern;
        finishStatus = 201;
        break;
      case 'save':
      case 'update':
      case 'put':
        method = 'put';
        pattern = individualPattern;
        usesId = true;
        break;
      case 'delete':
        method = 'delete';
        pattern = individualPattern;
        usesId = true;
        finishStatus = 202;
        break;
      default:
        let remainingRoute = routeName;
        method = 'get';
        for(let m of this.methods) {
          if(routeName.indexOf(m) === 0) {
            method = m;
            remainingRoute = routeName.substring(method.length);
            break;
          }
        }
        
        // Convert MakeComment into make-comment
        remainingRoute = inflection.underscore(remainingRoute)
        remainingRoute = inflection.dasherize(remainingRoute)
        
        if(routeDetails.usesId) {
          pattern = individualPattern;
        } else {
          pattern = basePattern;
        }
        pattern += `/${remainingRoute}`;
    }
    pattern += '(\.(json|html|csv|txt))?';
    expressApp[method](pattern, (req, res, next)=> {
      let controller = new Controller(req, res, next);
      controller.finishStatus = finishStatus;
      controller[routeName]().then(null, function(error) {
        console.log('MajorServerError:', error.stack);
        res.json({
          success: false,
          error: 'ServerError'
        });
      }).done();
    });
  }
};

export default ExpressHandler;
