var _ = require('lodash')
  , RouteParams = ng.router.RouteParams
  , Router = ng.router.Router
  , Location = ng.router.Location
  , CommunityService = require('../services/community')
  , UIService = require('../services/ui')
;

var CommunityComponent = ng.core.Component({
  selector: 'tc-community',
  templateUrl: '/app/community/community.html',
  directives: [
    ng.router.ROUTER_DIRECTIVES,
    require('./about.component'),
    require('./home.component'),
    require('./view.component'),
    require('./manage.component'),
    require('../editcommunity.component'),
    require('../home.component'),
  ],
}).Class({
  constructor: [
    RouteParams, Router, Location, CommunityService, UIService,
  function(
    routeParams, router, location, communityService, uiService
  ) {
    this._routeParams = routeParams;
    this._router = router;
    this._location = location;
    this._communityService = communityService;
    this._uiService = uiService;
    var self = this
      , id = this._routeParams.get('id')
      , route = this._routeParams.get('route')
    ;
    this.state = uiService.state;
  }],
  ngOnInit: function() {
    var self = this
      , id = this._routeParams.get('id')
      , route = this._routeParams.get('route')
      , uiService = this._uiService
    ;
    this.route = route;
    //now, could be refresh after we deleted a community. in that case...don't try and select it!
    if (this._uiService.state.myCommunities[this._uiService.state.myCommunities.findIndex(x => x._id == id)]
      || this._uiService.state.publicCommunities[this._uiService.state.publicCommunities.findIndex(x => x._id == id)])
      this._communityService.selectCommunity(id);
    //else: leave community at null
  },
  navigate: function(route) {
    var community = this.state.community;
    var id = community ? community.getId() : this._routeParams.get('id');
    var instruction = this._router.generate([
      'Community', {id: id, route: route}
    ]);
    this._location.go(instruction.toRootUrl());
    this.route = route;
  },
  isLeader: function() {
    return (this._communityService.canAddDocument(this.state.community, this.state.authUser));
  }
});

module.exports = CommunityComponent;
