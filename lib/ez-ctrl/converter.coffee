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
	
	date: (value)->
		new Date(value)

module.exports = Converter =
	convert: (types, data)->
		for field, value of types
			value = data[field]
			if value
				data[field] = @convertField(value, types[field].type)
		data
	
	convertField: (value, type)->
		if _.isArray type or _.isArray value
			unless _.isArray type and _.isArray value
				value
			else
				for index, val in value
					value[index] = @convertField val, type[0]
				value
		else if(ConverterMethods[type])
			ConverterMethods[type](value)
		else
			value
	
	registerConverter: (name, converter)->
		ConverterMethods[name] = converter
