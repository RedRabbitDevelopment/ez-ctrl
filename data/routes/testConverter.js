
import Controller from '../../lib/ez-ctrl';
import Converter from '../../lib/converter';

let converter = new Converter();

export default class ConversionController extends Controller {
  async afterGetData() {
    this.data = await converter.convertData(this);
  }
};

ConversionController.modelName = 'Conversion';

ConversionController.defineRoutes({
  convertInt: {
    data: {
      value: {
        type: 'int'
      }
    },
    logic(value) {
      return value;
    }
  },
  convertStr: {
    data: {
      value: {
        type: 'text'
      }
    },
    logic(value) {
      return value;
    }
  },
  convertMult: {
    data: {
      intVal: {
        type: 'int'
      },
      strVal: {
        type: 'text'
      },
      array: {
        type: ['int']
      },
      /* Not yet implemented
      object: {
        type: {
          intVal: {
            type: 'int'
          },
          strVal: {
            type: 'text'
          },
          array: {
            type: ['int']
          }
          object: {
            type: {
              intVal: {
                type: 'int'
              },
              strVal: {
                type: 'text'
              },
              array: {
                type: ['int']
              }
            }
          }
        }
      }
      */
    },
    logic(_data) {
      return _data;
    }
  },
  renameField: {
    data: {
      previous: {
        type: 'str',
        rename: 'next'
      }
    },
    logic(next) {
      return next;
    }
  }
});

