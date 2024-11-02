var AuthService = require('./services/auth');

var RouteParams = ng.router.RouteParams
  , HomeComponent = require('./home.component')
  , CommunityComponent = require('./community/community.component')
  , MemberProfileComponent = require('./memberprofile.component')
  , CommunityService = require('./services/community')
  , UIService = require('./services/ui')
;

var AppComponent = ng.core.Component({
  selector: 'tc-app',
  templateUrl: '/app/app.html',
  directives: [
    ng.router.ROUTER_DIRECTIVES,
    require('./header.component'),
    require('./memberprofile.component'),
    require('./directives/filereader'),
  ],
}).Class({
  constructor: [
    AuthService, CommunityService, UIService,
    function(authService, communityService, uiService) {
    authService.refreshAuthUser().subscribe();
    communityService.refreshPublicCommunities().subscribe();
    this.state = uiService.state;
    //let's load up the user here before we go any further
  }],
  isAuthUser: function() {
  	if (!this.state.authUser) {
  		return false
  	} else {
  		return true;
  	}
  }
});
ng.router.RouteConfig([{
  path: '/app/', name: 'Default', component: HomeComponent, useAsDefault: true,
}, {
  path: '/app/home', name: 'Home', component: HomeComponent,
}, {
  path: '/app/new-community', name: 'CreateCommunity',
  component: require('./createcommunity.component')
}, {
  path: '/app/community/**', name: 'Community',
  component: CommunityComponent,
}, {
  path: '/app/profile', name: 'MemberProfile',
  component: MemberProfileComponent
}])(AppComponent);

module.exports = AppComponent;
