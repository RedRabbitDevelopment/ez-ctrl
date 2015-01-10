
import Promise from 'bluebird';
import Controller from '../../lib/ez-ctrl/base';
import Validator from '../../lib/ez-validator';
import Converter from '../../lib/ez-converter';
import User from '../models/user';

class BaseController extends Controller {
  *afterGetData() {
    yield super.afterGetData();
    this.data = yield Converter(this.data, this.routeDetails);
    yield Validator(this.data, this.routeDetails);
  }
}

export default class UserController extends BaseController {
  constructor() {
    super('User');
  }
  *afterGetData() {
    yield super.afterGetData();
    yield this.afterGetDataQueued();
    if(this.routeName === 'query') {
      yield this.afterGetDataForQuery();
    }
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
      firstname: {
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
        type: 'int',
        required: true
      }
    },
    logic(id) {
      return User.get(id);
    }
  },
  create: {
    data: {
      id: {
        type: 'int',
        required: true
      },
      firstname: {
        type: 'string',
        required: true
      },
      male: {
        type: 'boolean',
        required: true
      }
    },
    *afterGetData() {
      this.ranAfterGetData = true;
    },
    logic(id, _data) {
      return User.update(id, _data);
    }
  },
  update: {
    data: {
      id: {
        type: 'int',
        required: true
      },
      firstname: {
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
  }
});

