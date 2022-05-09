var mongoose = require('mongoose')
  , ObjectId = mongoose.Types.ObjectId
  , Schema = mongoose.Schema
  , extendNodeSchema = require('./extend-node-schema')
;


//we are going to search on the 
//note: we use the index of the variant in the matrix to find the variant. variants[0]=lemma, always
//1-9 are variants[1] etc, a is variants[10]
const commentarySchema = new Schema({
    community: String,
    entity: String,
    created: {type: Date, default: Date.now},
    committed: {type: Date},
    entityto: String,
    revisions: [{type: Schema.Types.ObjectId, ref: 'Revision'}]
 });

module.exports = mongoose.model('Commentary', commentarySchema);