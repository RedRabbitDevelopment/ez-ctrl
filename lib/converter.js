import _ from 'lodash';

let Conversions = {
  int(value) {
    return Conversions.float(value);
  },
  text(value) {
    return '' + value;
  },
  float(value) {
    return parseFloat(value);
  },
  boolean(value) {
    return _.isString(value) ? value === 'true' : !!value;
  },
  date(value) {
    return new Date(value);
  },
  array(value) {
    console.log('converting', value);
    return _.isArray(value) ? value : void 0;
  }
}

export default class Converter {
  constructor(conversions) {
    this.conversions = conversions || {};
  }
  async convertData(context) {
    var iterators = _.map(context.routeDetails.data, (info, key)=> {
      return this.convertField(info, key, context.data, context);
    });
    for(let iter of iterators) {
      await iter;
    }
    return context.data;
  }
  async convertField(info, key, data, context) {
    if(info.type) {
      var converter = this.getConverter(info.type);
      if(converter) {
        var name = info.rename || key;
        if(!data[key] && info.default) data[key] = info.default;
        data[name] = await converter.call(context, data[key]);
        if(info.rename && !info.keepOriginal) delete data[key];
      }
    }
  }
  getConverter(type) {
    if(_.isArray(type)) {
      [type] = type;
      let converter = this.getConverter(type);
      if(converter) {
        return function arrayConverter(value) {
          if(value.forEach) {
            value.forEach(function(value, i, array) {
              array[i] = converter.call(this, value);
            });
          }
          return value;
        }
      } else {
        return;
      }
    } else if (_.isString(type)) {
      return this.conversions[type] || Conversions[type];
    } else {
      throw new Error('Invalid conversion type ' + type + ' expected a string or an array');
    }
    if(_.isObject(type)) {
      // Work in progress
      return function objectConverter(obj) {
        _.forEach(obj, (value, key, obj)=> {
          obj[key] = converter.call(this, value);
        });
      };
    }
  }
};
