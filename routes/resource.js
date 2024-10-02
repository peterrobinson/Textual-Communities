var _ = require('lodash')
  , async = require('async')
;

function _parseJSON(data, defaultResult) {
  try {
    return JSON.parse(data);
  } catch (e) {
    return (defaultResult === void 0) ? null : defaultResult;
  }
}

var Resource = function(model, opts) {
  var isAuthenticated = _.bind(this.isAuthenticated, this);
  this.model = model;
  this.options = _.assign({
    auth: {
      create: isAuthenticated,
      update: isAuthenticated,
      delete: isAuthenticated,
      detail: isAuthenticated,
    }
  }, opts);
};
_.assign(Resource.prototype, {
  serve: function(router, name, opts) {
    var options = _.assign({
      id: 'id',
    }, this.options, opts);
    if (name !== '') {
      name = '/' + name;
    }
    if(name == '/users') {
      router.route(name)
        .get(options.auth.detail, this.list())
        .post(options.auth.create, this.create())
      ;
    }
    else {
//     console.log("here too"+JSON.stringify(options))
      router.route(name)
        .get(this.list())
        .post(options.auth.create, this.create())
      ;
    }

    router.route(name + '/:' + options.id)
      .get(this.detail())
      .put(options.auth.update, this.update())
      .patch(options.auth.update, this.patch())
      .delete(options.auth.delete, this.remove())
    ;
  },
  isAuthenticated: function(req, res, next) {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.sendStatus(403);
    }
  },
  getQuery: function(req) {
 // 	console.log("a query");
    var urlQuery = req.query || {}
      , find = _parseJSON(urlQuery.find)
      , select = _parseJSON(urlQuery.select)
      , sort = _parseJSON(urlQuery.sort)
      , populate = _parseJSON(urlQuery.populate)
      , model = this.model
      , query
      , optFields
    ;
//    console.log(JSON.stringify(urlQuery.find)+" find");
    query = model.find(find);
    if (select) {
      query = query.select(select);
    }
    if (sort) {
      query = query.sort(sort);
    }
    if (populate) {
//    	console.log("populate")
      if (!_.isArray(populate)) {
        populate = [populate];
      }
      _.each(populate, function(field) {
        query = query.populate(field);
      });
    }
//    console.log("returning query")
//    console.log(query)
    return query;
  },
  beforeCreate: function(req, res, next) {
//   	console.log("help me out 1")   
    var obj = new this.model(req.body);
    return function(cb) {
      cb(null, obj);
    };
  },
  beforeUpdate: function(req, res, next) {
//  	console.log("help me out")
    return function(obj, cb) {
      obj.set(req.body);
      cb(null, obj);
    };
  },
  execSave: function(req, res, next) {
    return function(obj, cb) {
/*      obj.save(function(err, obj, numberAffected) {
        cb(err, obj);
      }); */
      obj.save().then(result=> {
//        console.log("getting result back")
      	cb(null, result);
      }).catch(err=>callback(err));
    };
  },
  afterCreate: function(req, res, next) {
    return function(obj) {
      const cb = _.last(arguments);
      cb(null, obj);
    };
  },
  afterUpdate: function(req, res, next) {
//    console.log("start after update");
    return function(obj, cb) {
//      console.log("back to here");
//      console.log(obj);
      cb(null, obj);
    };
  },
  sendData: function(req, res, next) {
 //    console.log("sending stuff back")
//    console.log("this"+JSON.stringify(this));
//    console.log("fields1 "+req.query.fields);
    //this function _parseJSON seems to be failing... so replace .
    var fields = _parseJSON(req.query.fields, []), optFields  ;
//	var fields = JSON.parse(JSON.stringify(req.query.fields)), optFields  ;
//	console.log("processing fields2 ")
//    console.log("fields2 "+JSON.stringify(fields));
    if (!_.isArray(fields)) {
      fields = [fields];
    }
    function _sendData(err, data) {
//       console.log("this is where it all goes back in _send  ")
//       console.log("error xx? "+err);
//       console.log("data " );
      if (err) {
//        console.log("have error")
        res.json({'data':data,'error':err}); //this is really a horrid hack. But I can't see any other way of getting the error data back..
    //does not seem any way of picking up the value of the error in the calling function
    //.subscribe does NOT pick up the res value in the return (this is available in the response body of the call
  // but to get at it we will have to get away from the subscribe method)
    //    return next(err);
    //wierd here...
    //ok... this goes somewhere wierd before coming back to subscription in viewer...
  //      res.json(data);
      } else {
//      	console.log("returning data")
        res.json(data);
      }
    }
//    console.log("do I have fields 1")
    fields = _.intersection(fields, this.model.optionalFields);
//    console.log("still do I have fields xxx "+fields.length );
    return function(err, data) {  //for some reason: when committing a document the data is put in the first parameter, not the second
/*      if (data=="undefined") { //somehow, the callback here is not sending back to paramenters, only one
      	data=err;
      	err=null;
      } */
//      console.log("do I have fields 2 data "+ + "error "+err)
//      console.log("come back with error..."+err)
//      console.log("come back with data ")
      if (!data) {
//      	console.log("switching values")
      	data=err;
      	err=null;
      }
      if (fields.length > 0) {
        var isArray = _.isArray(data);
        async.map(isArray ? data : [data], function(doc, callback) {
          var obj = doc.toObject();
          async.each(fields, function(field, cb) {
            doc['get' + field].call(doc, function(err, value) {
              obj[field] = value;
              cb(err);
            });
          }, function(err) {
//          	console.log("what am I returning")
            callback(err, obj);
          });
        }, function(err, objs) {
//          console.log("going from here")
          return _sendData(err, isArray ? objs : objs[0]);
        });
      } else {
//      	console.log("right oh send data now ")
        _sendData(err, data);
      }
    };
  },
  list: function() {
    return _.bind(function(req, res, next) {  //thanks to braza from Stackoverflow for sorting this out!!!
		var query = this.getQuery(req);
		const callback = this.sendData(req, res, next);
		query.exec().then(result => {
			callback(null, result);
		}).catch(err => callback(err));
	}, this)
  },
  create: function() {
    return _.bind(function(req, res, next) {
      async.waterfall([
        this.beforeCreate(req, res, next),
        this.execSave(req, res, next),
        this.afterCreate(req, res, next),
      ], this.sendData(req, res, next));
    }, this);
  },
  detail: function() {
  	   return _.bind(function(req, res, next) {  
		var query = this.getQuery(req).findOne({
		 _id: req.params[this.options.id]
		});
		const callback = this.sendData(req, res, next);
		query.exec().then(result => {
			callback(null, result);
		}).catch(err => callback(err));
	}, this)
  },
/*    return _.bind(function(req, res, next) {
      var query = this.getQuery(req).findOne({
        _id: req.params[this.options.id]
      });
      async.waterfall([
        _.bind(query.exec, query),
      ], this.sendData(req, res, next));
    }, this);
  }, */
  
  update: function() {
  	
    return _.bind(function(req, res, next) {
      var query = this.getQuery(req).findOne({
        _id: req.params[this.options.id]
      });
     const task1 = (callback) => {
        query.exec()
        .then(function(result){
        	callback(null, result)
        })
 	}
/*      let fun=function () {
      	  const callback=_.last(arguments);
		   query.exec().then(function (result) {
//			  console.log("calling back with "+result)
			 return callback(result);
		})
	 }; */
//	 console.log("here we are in updatevvvvv")
      async.waterfall([
  //       _.bind(query.exec, query),
 		task1,
        this.beforeUpdate(req, res, next),
        this.execSave(req, res, next),
        this.afterUpdate(req, res, next),
      ], this.sendData(req, res, next));
    }, this);
  },
  patch: function() {
    return this.update.apply(this, arguments);
  },
  remove: function() {
    return _.bind(function(req, res, next) {
      this.getQuery(req).remove({
        _id: req.params[this.options.id]
      }, function(err) {
        if (err) {
          next(err);
        } else {
          res.json({message: 'Successfully deleted'});
        }
      });
    }, this);
  },
});

module.exports = Resource;
