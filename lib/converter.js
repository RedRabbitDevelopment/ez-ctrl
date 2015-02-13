import _ from 'lodash';
import {co} from './generatorUtils';

let Conversions = {
  int(value) {
    return Conversions.float(value);
  },
  text(value) {
    return value;
  },
  float(value) {
    return parseFloat(value);
  },
  boolean(value) {
    return _.isString(value) ? value === 'true' : !!value;
  },
  date(value) {
    return new Date(value);
  }
}

export default class Converter {
  constructor(conversions) {
    this.conversions = conversions || {};
  }
  * convertData(context) {
    var iterators = _.map(context.routeDetails.data, (info, key)=> {
      return this.convertField(info, key, context.data, context);
    });
    for(let iter of iterators) {
      yield iter;
    }
    return context.data;
  }
  * convertField(info, key, data, context) {
    if(info.type) {
      var converter = this.conversions[info.type] || Conversions[info.type];
      if(converter) {
        var name = info.rename || key;
        if(!data[key] && info.default) data[key] = info.default;
        data[name] = yield converter.call(context, data[key]);
        if(info.rename && !info.keepOriginal) delete data[key];
      }
    }
  }
};
