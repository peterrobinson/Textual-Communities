const _ = require('lodash')
  , async = require('async')
  , express = require('express')
  , router = express.Router()
  , Resource = require('./resource')
  , models = require('../models')
  , Error = require('../common/error')
  , Community = models.Community
  , Doc = models.Doc
  , Revision = models.Revision
  , TEI = models.TEI
;

const ParameterError = Error.extend('ParameterError');

router.use(function(req, res, next) {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
      'Origin, X-Requested-With, Content-Type, Accept, Key, Cache-Control',
  });
  next();
});

function _getDependency(req, doc, callback) {
  console.log("xxx");
  async.parallel([
    function(cb) {
       console.log("in _getDependency doc.js outer");
      if (req.body.parent) {
        console.log("in _getDependency doc.js inner");
        Doc.findOne({_id: req.body.parent}, cb);
      } else {
        cb(null);
      }
    },
    function(cb) {
       console.log("in _getDependency doc.js 2 outer");
      if (req.body.after) {
        console.log("in _getDependency doc.js 2 inner");
        Doc.findOne({_id: req.body.after}, cb);
      } else {
        cb(null);
      }
    },
    function(cb) {
    console.log("in _getDependency doc.js 3 outer");
      if (req.body.community) {
        console.log("in _getDependency doc.js 3a inner for community "+req.body.community);
        Community.findOne({_id: req.body.community}).then(function(community){
        	console.log("in _getDependency doc.js 3a inner dinner ");
        	cb(null, community)});
      } else {
        cb(null);
      }
    },
    function(cb) {
      console.log("in _getDependency doc.js 4");
      if (req.body.revision) {
        let revision = new Revision({
          doc: doc._id,
          user: req.user._id,
          text: req.body.revision,
          community: req.body.doc.community,
          status: Revision.status.IN_PROGRESS,
        });
        revision.save(cb);
      } else {
        cb(null);
      }
    },
  ], function(err, results) {
    console.log("in _getDependency doc.js 6 ");
    const parent = results[0]
      , after = results[1]
      , community = results[2]
    ;
    console.log("parent "+parent+" after "+after+" community "+community.name);
    if (!!(parent || after) === !!community) {
      // only need community when create root document
      // Don't need community if given parent or after
      return callback(new ParameterError(
        'should not use parent/after/community at same time'));
    } else {
      console.log("in _getDependency doc.js 5");
      callback(null, parent, after, community);
    }
  });
}

var DocResource = _.inherit(Resource, function(opts) {
  console.log("asfas adsda")
  Resource.call(this, Doc, opts);
}, {
  // POST: /api/docs/:id/
  //  body: {
  //    parent | after | community,
  //    tei,  // will auto create empty page if tei is empty
  //    doc,  // should contain valid label and name
  //  }
  beforeCreate: function(req, res, next) {
    console.log("xxxx")
    const docData = req.body.doc
      , tei = req.body.tei
    ;
    if (!req.body.commit) {
      return next(new ParameterError(
        'Create Doc is Not Allowed, should use commit'));
    }
    return function(callback) {
      console.log("go here guys callback "+callback)
      // TODO: should check against a TEI schema
      // if (!validTEI(tei)) cb(new TEIError());
      let obj = new Doc(_.omit(Doc.clean(docData), ['children', 'ancestors']));
      async.waterfall([
        function(cb) {
          _getDependency(req, obj, cb);
        },
        function(parent, after, community) {
          console.log("beforeCreate 1")
          const cb = _.last(arguments);
          if (after) {
            return Doc.insertAfter(after, obj, cb);
          } else if (parent) {
            return Doc.insertFirst(parent, obj, cb);
          } else if (community) {
            console.log("we are adding here");
            async.parallel([
              function(cb1) {
              	console.log("we are adding here 1");
                community.addDocument(obj, cb1);
              },
              function(cb1) {
              	console.log("we are adding here 1 again");
                obj.save().then(function(doc) {
                  cb1(null, doc);
                });
              },
            ], function(err, results) {
              cb(err, _.get(results, 1));
            });
          }
        },
      ], function(err, doc) {
      	console.log("error?? "+err);
        console.log("creating doc "+doc.name);
        callback(err, doc);
      });
    };
  },
  beforeUpdate: function(req, res, next) {
  	console.log("about to commit 2?");
    return function(obj, cb) {
      var body = req.body;
      // normal update can only update name/image
      // change ancestors and children is NOT ALLOWED
      if (!body.commit) {
        obj.set(_.omit(Doc.clean(_.assign(
          {_id: obj._id, },
          body
        )), ['children', 'ancestors']));
      }
      cb(null, obj);
    };
  },
  execSave: function(req, res, next) {
  	console.log("about to commit 1? ");
    if (!req.body.commit) {
       return function(obj, callback) {
        obj.save(function(err, obj) {
          callback(err, obj);
        });
      };
    }
    console.log("about to commit 1xxyy? ");
    return function(obj, callback) {
    	console.log("about to commit 1xxyy?sss "+obj.name)
        return async.waterfall([
        function(cb) {
        	console.log("about to commit 1xxyy?sss zzz "+obj.name)
            obj.commit({
            revision: req.body.revision,
            tei: req.body.tei,
            community: req.body.doc.community,
            res: res,
            doc: _.assign(req.body.doc, {_id: obj._id}),
          }, cb);
        },
        function(doc) {
          const cb = _.last(arguments);
          if (req.body.revision) {
          	console.log("we have a revision "+req.body.revision)
            Revision.updateOne({_id: new ObjectId(req.body.revision)}, {                                                                                                                                                                                                                                                    
              committed: new Date(),
              status: 'COMMITTED', community: req.body.doc.community,
            })
            .then(cb);
          } else {
            doc.meta = {
              committed: new Date(),
              user: req.user._id,
            }
            console.log("about to save again ");
            doc.save().then(cb);
          }
        },
        function() {
          console.log("finished commit xxxx for "+obj.name)
          const cb = _.last(arguments);
          cb(null, obj);
        }
      ], function (err, obj){
      	console.log("finished commit xxxx yyyy for "+obj+" error "+err)
      	callback(err)
      });
    };
  },
});


var docResource = new DocResource({id: 'doc'});
docResource.serve(router, '');
router.get('/:id/texts', function(req, res, next) {
  console.log('get texts');
  Doc.getTexts(req.params.id, function(err, texts) {
     if (err) {
      next(err);
    } else {
//      console.log(texts.length);
      res.json(texts);
    }
  });
});


router.get('/:id/links', function(req, res, next) {
  var docId = req.params.id;
  console.log("getting links")
  Doc.getOutterTextBounds(docId, function(err, leftBound, rightBound) {
    if (err) {
      return next(err);
    }
    res.json({
      prevs: leftBound,
      nexts: rightBound,
    });
  });
});

module.exports = router;
