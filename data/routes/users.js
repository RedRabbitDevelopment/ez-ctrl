
import {NotFoundError} from '../../lib/userError';
import Controller from '../../lib/ez-ctrl';
import Validator from '../../lib/validator';
import Converter from '../../lib/converter';
import User from '../models/user';

var models = {User};

var converter = new Converter({
  model: async function fetchModel(id) {
    id = parseFloat(id);
    return await models[this.constructor.modelName].get(id);
  }
});
var validator = new Validator({
  isModel: function() {
    return true;
  }  
});

class BaseController extends Controller {
  async afterGetData() {
    await super.afterGetData();
    this.data = await converter.convertData(this);
    await validator.validateData(this);
  }
}

export default class UserController extends BaseController {
  async afterGetData() {
    await super.afterGetData();
    await this.afterGetDataQueued();
    if(this.routeName === 'query') {
      await this.afterGetDataForQuery();
    }
  }
  onServerError(error) {
    UserController.serverError = error;
  }
  afterSuccess() {
  }
  afterGetDataQueued() {
  }
  afterGetDataForQuery() {
  }
}

UserController.modelName = 'User';

UserController.defineRoutes({
  query: {
    data: {
      name: {
        type: 'string'
      },
      male: {
        type: 'boolean'
      }
    },
    logic(_data) {
      return User.query(_data).then( (users)=> {
        return users;
      });
    }
  },
  get: {
    data: {
      id: {
        type: 'model',
        required: false,
        rename: 'user'
      }
    },
    logic(user) {
      if(!user)
        throw new NotFoundError();
      return user;
    }
  },
  create: {
    data: {
      name: {
        type: 'string',
        required: true
      },
      male: {
        type: 'boolean',
        required: true
      }
    },
    logic(_data) {
      return User.create(_data);
    }
  },
  update: {
    data: {
      id: {
        type: 'int',
        required: true
      },
      name: {
        type: 'string'
      },
      male: {
        type: 'boolean'
      }
    },
    logic(id, _data) {
      return User.update(id, _data);
    }
  },
  delete: {
    data: {
      id: {
        type: 'int',
        required: true
      }
    },
    logic(id) {
      return User.remove(id);
    }
  },
  getMales: {
    data: {
      isMale: {
        type: 'boolean',
        default: true
      }
    },
    logic(isMale) {
      return User.query({male: isMale});
    }
  },
  getUnexpectedError: {
    logic() {
      throw new Error('This is unexpected');
    }
  }
});

