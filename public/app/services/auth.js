var Http = ng.http.Http
  , forwardRef = ng.core.forwardRef
  , Inject = ng.core.Inject
  , RESTService = require('./rest')
  , UIService = require('./ui')
  , CommunityService = require('./community')
  , User = require('../models/user')
  , Rx = require('rxjs')
  , DualFunctionService = require('../services/dualfunctions')
  , $ = require('jquery')
  , config = require('../config')
  , async = require('async')
;

var AuthService = ng.core.Class({
  extends: RESTService,
  constructor: [Http, UIService, CommunityService,
    function(http, uiService, communityService){
    var self = this;
    RESTService.call(this, http);
    this.resourceUrl = 'auth';

    this._uiService = uiService;
    this._communityService = communityService;

    uiService.authService$.subscribe(function(event) {
      if (event.type === 'refreshAuthUser') {
        self.refreshAuthUser().subscribe();
      }
    })
  }],
  modelClass: function() {
    return User;
  },
  refreshAuthUser: function() { //rewritten to use cookies to maintain user state
    var uiService = this._uiService
      , communityService = this._communityService;
	return this.detail(null, {
      search: {
        populate: JSON.stringify('memberships.community'),
      },
    }).map(function(authUser) {
      if (uiService.state.authUser !== authUser) {
        //read the cookie here!
        //begin rewritten code
        let authUser2=JSON.parse(DualFunctionService.getCookie("TCUser"));
        if (Object.keys(authUser2).length!=0) { // we have a cookie. rewrite authUser with values from the cookie
        	authUser.attrs.local=authUser2.local;
        	authUser.attrs.memberships=authUser2.memberships;
        	if (authUser2.hasOwnProperty("google")) {
        		authUser.attrs["google"]=authUser2.google;
        	} else {
        		if (authUser.hasOwnProperty("google")) {
        			delete authUser.attrs.google;
        		}
        	}
        	if (authUser2.hasOwnProperty("facebook")) {
        		authUser.attrs["facebook"]=authUser2.facebook;
        	} else {
        		if (authUser.hasOwnProperty("facebook")) {
        			delete authUser.attrs.facebook;
        		}
        	}
        	if (authUser2.hasOwnProperty("twitter")) {
        		authUser.attrs["twitter"]=authUser2.twitter;
        	} else {
        		if (authUser.hasOwnProperty("twitter")) {
        			delete authUser.attrs.twitter;
        		}
        	}   
        	//populate memberships
        	let index=0;
        	async.mapSeries(authUser.attrs.memberships, function(membership, cb) {
        		$.post(config.BACKEND_URL+"getCommunity/"+membership.community, function (result) {
        			var foo=1;
        			authUser.attrs.memberships[index++].community={attrs:result}
        			cb(null, []);
        		})
        	}, function (err){
        	  //rest goes here
        	  var memberships = _.get(authUser, 'attrs.memberships', []);
			  if (memberships.length === 1) {
				communityService.selectCommunity(_.get(memberships, '0.community'));
			  }
			  uiService.setState(
				'myCommunities', 
				_.map(memberships, function(membership) {
				  return membership.community;
				})
			  );
			  uiService.setState('authUser', authUser);
        	})
        } else {
			if (authUser) {  
			  var memberships = _.get(authUser, 'attrs.memberships', []);
			  if (memberships.length === 1) {
				communityService.selectCommunity(_.get(memberships, '0.community'));
			  }
			  uiService.setState(
				'myCommunities', 
				_.map(memberships, function(membership) {
				  return membership.community;
				})
			  );
			}
			uiService.setState('authUser', authUser); 
		}
        
    	//end rewritten code
/*        if (authUser) {  //original here
          var memberships = _.get(authUser, 'attrs.memberships', []);
          if (memberships.length === 1) {
            communityService.selectCommunity(_.get(memberships, '0.community'));
          }
          uiService.setState(
            'myCommunities', 
            _.map(memberships, function(membership) {
              return membership.community;
            })
          );
        }
        uiService.setState('authUser', authUser); */
      } else {
      	return authUser;
      }
    });
  },
  refresh: function() {
    this._refresh.next(null);
  },
  logout: function() {
    var self = this;
    this.http.get('/auth/logout/').subscribe(function() {
      self.refreshAuthUser().subscribe();
    });
  },
});


module.exports = AuthService;


