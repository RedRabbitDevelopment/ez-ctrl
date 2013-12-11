_ = require 'underscore'

ConverterMethods =
	# Doesn't run parseInt, because that will just concatenate the decimal!
	int: (value)->
		return ConverterMethods.float(value)
	
	float: (value)->
		return parseFloat(value)
	
	boolean: (value)->
		if _.isString value
			value is 'true'
		else
			!!value

module.exports = Converter =
	convert: (types, data)->
		for field, value of types
			value = data[field]
			if value
				data[field] = @convertField(value, types[field].type)
		data
	
	convertField: (value, type)->
		if(ConverterMethods[type])
			ConverterMethods[type](value)
		else
			value
	
	registerConverter: (name, converter)->
		ConverterMethods[name] = converter
