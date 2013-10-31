
ConverterMethods = {
	int: function(value) {
		return Converter.float(value);
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
				type = types[field].type;
				if(ConverterMethods[type]) {
					value = ConverterMethods[type];
				}
				data[field] = value;
			}
		}	
	},
	registerConverter: function(name, converter) {
		ConverterMethods[name] = converter;
	}
}
