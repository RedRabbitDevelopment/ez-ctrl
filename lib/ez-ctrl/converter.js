
ConverterMethods = {
	int: function(value) {
		return Converter.float(value);
	},
	float: function(value) {
		return parseFloat(value);
	}
};

exports = Converter = {
	registerConverter: function(name, converter) {
		ConverterMethods[name] = converter;
	}
}
