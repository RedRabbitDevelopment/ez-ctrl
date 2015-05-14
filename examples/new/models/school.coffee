mongoose = require 'mongoose'

SchoolSchema = new mongoose.Schema
  name:
    required: true
    type: String
  canChoose:
    required: true
    default: false
    type: Boolean
  numStudents:
    required: false
    default: 0
    type: Number

module.exports = School = mongoose.model 'School', SchoolSchema
