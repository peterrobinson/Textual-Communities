var mongoose = require('mongoose')
  , ObjectId = mongoose.Types.ObjectId
  , Schema = mongoose.Schema
  , extendNodeSchema = require('./extend-node-schema')
;


//we use this to hold temporary html files generated in the makeEdition process

const makeeditionSchema = new Schema({
    community: String,
    identifier: String,
    html: String
  });

module.exports = mongoose.model('MakeEdition', makeeditionSchema);