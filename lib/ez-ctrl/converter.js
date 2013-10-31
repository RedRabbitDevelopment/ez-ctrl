
ConverterMethods = {
	// Doesn't run parseInt, because that will just concatenate the decimal!
	int: function(value) {
		return ConverterMethods.float(value);
	},
	float: function(value) {
		return parseFloat(value);
	}
};

module.exports = Converter = {
	convert: function(types, data) {
		for(field in types) {
			value = data[field];
			if(value) {
				//console.log(data, field, value, types[field])
				data[field] = this.convertField(value, types[field].type);
			}
		}
		return data;
	},
	convertField: function(value, type) {
		if(ConverterMethods[type])
			return ConverterMethods[type](value);
		return value;
	},
	registerConverter: function(name, converter) {
		ConverterMethods[name] = converter;
	}
}
