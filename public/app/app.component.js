require('bootstrap');
require('./app.less');
require('../../utils/mixin');
var AuthService = require('./auth.service');

var RouteParams = ng.router.RouteParams
  , HomeComponent = require('./home.component')
  , CommunityComponent = require('./community/community.component')
  , MemberProfileComponent = require('./memberprofile.component')
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
  constructor: [function() {
  }],
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
