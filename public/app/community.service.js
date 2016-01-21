var Observable = Rx.Observable
  , Http = ng.http.Http
  , EventEmitter = ng.core.EventEmitter
  , RESTService = require('./rest.service')
  , AuthService = require('./auth.service')
;

var CommunityService = ng.core.Class({
  extends: RESTService,
  constructor: [Http, AuthService, function(http, authService){
    var self = this;
    RESTService.call(this, http);

    this.resourceUrl = 'communities';

    this._authService = authService;
  }],
  getMyCommunities: function() {
    return this._authService.getAuthUserCommunities();
  },
  getPublicCommunities: function() {
    if (!this._publicCommunities$) {
      var subject = new Rx.Subject();
      window.subject = subject

      this._publicCommunities$ = this.list({
        search: {
          find: JSON.stringify({public: true}),
        },
      }).map(function(res) {
        return res.json();
      }).merge(subject).map(function(r) {
        console.log(r);
        return r;
      }).publishReplay(1).refCount();
      
    }
    window.ll = this._publicCommunities$;
    this._publicCommunities$.subscribe(function(x){console.log('s1 ' + x)})
    return this._publicCommunities$;
  },
});

module.exports = CommunityService;


