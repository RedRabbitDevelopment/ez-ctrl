
import _ from 'lodash';
import Promise from 'bluebird';
import inflection from 'inflection';
import path from 'path';
import Converter from './converter';
import Validator from './validator';
import UserError, {ServerError} from './userError';

let ExpressHandler = {
  methods: ['get', 'put', 'post', 'delete'],
  registerControllers(expressApp, controllers, registerBatch) {
    _.forEach(controllers, (Controller)=> {
      this.registerController(expressApp, Controller);
    }, this);
    if(registerBatch) {
      this.registerBatch(expressApp, controllers, registerBatch);
    }
  },
  registerBatch(expressApp, controllers, options) {
    let route = options.batchRoute || '/batch';
    controllers = _.indexBy(controllers, 'modelName');
    expressApp.get(route, (req, res, next)=> {
      Promise.props(_.mapValues(req.query, (info, keyVal)=> {
        let Controller = controllers[info.controller];
        if(!Controller || !Controller[info.method]) {
          return {
            success: false,
            error: 'NotFound'
          }
        }
        return Controller[info.method](info.args).then( (result)=> {
          return {
            success: true,
            result: result
          };
        }, (error)=> {
          return {
            success: false,
            error: error.message,
            errors: error.errors
          };
        });
      })).then( (result)=> {
        res.json(result);
      });
    });
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
      setStatus(result, success) {
        if(success) {
          this.response.status(this.status || this.finishStatus || 200);
        } else {
          this.response.status(result.status || 500);
        }
      }
      async runExpressRoute(routeName, routeDetails) {
        var response = {success: true};
        try {
          response.result = await this.runRoute(routeName, routeDetails);
          this.setStatus(response.result, true);
        } catch(error) {
          if(!(error instanceof UserError)) {
            await this.runLifeCycleMethod('onServerError', this.error);
            error = new ServerError();
          }
          response.success = false;
          response.error = error;
          this.setStatus(error, false);
        }
        this.runLifeCycleMethod('beforeSendResponse', response);
        let type = this.getRenderType(this.request.path);
        switch(type) {
          case 'csv':
          case 'txt':
            // Think through
            this.renderRaw(response);
          case 'html':
            return this.renderView(response);
          case 'json':
            return this.renderJson(response);
          default:
            throw new Error(`Unknown return type '${type}'`);
        };
      }
      getRenderType(pathname) {
        return path.extname(pathname).substring(1) || 'json';
      }
      renderRaw(response) {
        if(response.success) {
          if(response.result.pipe) {
            return response.result.pipe(this.response);
          } else {
            return this.response.end(response.result);
          }
        } else {
          return this.response.json(response);
        }
      }
      renderView(response) {
        let view = this.routeDetails.view || `${this.tableName}/${this.routeName}`;
        return this.response.render(view, response);
      }
      renderJson(response) {
        if(response.success) {
          response = response.result;
        } else {
          response = {
            error: response.error.message,
            errors: response.error.errors
          };
        }
        return this.response.json(response);
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
        method = 'get';
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
    method = routeDetails.method || method;
    pattern = routeDetails.pattern || pattern;
    expressApp[method](pattern, (req, res, next)=> {
      let controller = new Controller(req, res, next);
      controller.finishStatus = finishStatus;
      controller.runExpressRoute(routeName, routeDetails).catch(function(error) {
        console.log('MajorServerError:', error.stack);
        res.status(500).end();
      }).catch(console.error.bind(console));
    });
  }
};

export default ExpressHandler;
