require('bootstrap');
require('./app.less');
require('../../utils/mixin');
var AuthService = require('./auth.service');

var RouteParams = ng.router.RouteParams
  , HomeComponent = require('./home.component')
  , CommunityComponent = require('./community/community.component')
;

var MemberProfileComponent = ng.core.Component({
  selector: 'tc-member-profile',
  template: '<div>foo</div>'
}).Class({
  constructor: function() {

  },
});

function checkCommunity (community) {
    var message="";
    if (!community.name) {
      message="Community name cannot be blank";
    } else if (!community.abbr) {
      message="Community abbreviation cannot be blank";
    } else if (community.name.length>19) {
      message="Community name "+community.name+" must be less than 20 characters";
    } else if (community.abbr.length>4)  {
      message="Community abbreviation "+community.abbr+" must be less than 5 characters";
    } else if (community.longName && community.longName.length>80) {
      message="Community long name "+community.longName+" must be less than 80 characters";
    }
    return message;
}




var CreateCommunityComponent = ng.core.Component({
  selector: 'tc-create-community',
  templateUrl: 'community/tmpl/create.html',
  directives: [require('./editcommunity.component')],
}).Class({
  constructor: [AuthService, function(authService) {
    var self=this;
    this.community = {};
    authService.authUser$.subscribe(function(authUser) {
      self.authUser = authUser;
    });
    this.name="me";
  }],
});


var AppComponent = ng.core.Component({
  selector: 'tc-app',
  templateUrl: '/app/app.html',
  directives: [
    ng.router.ROUTER_DIRECTIVES,
    require('./header.component'),
  ],
}).Class({
  constructor: [function() {
    console.log('App');
  }],
});
ng.router.RouteConfig([{
  path: '/app/', name: 'Default', component: HomeComponent, useAsDefault: true,
}, {
  path: '/app/home', name: 'Home', component: HomeComponent,
}, {
  path: '/app/new-community', name: 'CreateCommunity',
  component: CreateCommunityComponent
}, {
  path: '/app/community/**', name: 'Community',
  component: CommunityComponent,
}, {
  path: '/app/profile', name: 'MemberProfile',
  component: MemberProfileComponent
}])(AppComponent);


module.exports = AppComponent;

/*

tcApp.controller('AppCtrl', [
  '$scope', 'TCService', '$q', '$http', '$location', '$window',
  function($scope, TCService, $q, $http, $location, $window) {
}]);




var $ = require('jquery')
  , _ = require('lodash')
  , angular = require('angular')
  , config = require('../config')
  , login = require('./login.js')
;

var allCommunities=[];
var tcApp = angular.module('TCApp', [
  'ngRoute', 'ngResource', 'ngSanitize', 'jdFontselect',
  require('./community').name,
]);


tcApp
  .config(function($routeProvider) {
    $routeProvider.when('/', {
      templateUrl:'home.html'
    })
    .when('/profile', {
      templateUrl: 'profile.html'
    })
    .when('/about', {
      templateUrl: 'about.html'
    })
    .when('/community/new', {
      controller: 'CreateCommunityCtrl',
      templateUrl: 'community/tmpl/create.html'
    })
    .when('/community/:communityId/:params*', {
      controller: 'CommunityCtrl',
      templateUrl: 'community/index.html'
    })
    .otherwise({
      templateUrl:'home.html'
    });
  })
  .factory('TCService', TCService)
;



tcApp.directive('tcHeader', require('tc-header/tc-header.js'));




/*
var AppCtrl = function(TCService, $q, $http, $location, $window) {
  var Community = TCService.Community
    , authUser = TCService.app.authUser
    , vm = this
  ;
  vm.hideHeader = false;
  vm.authUser = authUser;
  vm.communities = TCService.app.communities;
  vm.login = login;

  if ($location.search().prompt !== 'redirectModal') {
    vm.loginFrame = '/auth';
  } else {
    vm.loginFrame = '';
    $window.parent.angular.element('#frame').scope().login.closeModal();
  }
};
_.assign(AppCtrl.prototype, {
  logout: function() {
    TCService.logout();
  },
});
AppCtrl.$inject = ['TCService', '$q', '$http', '$location', '$window'];
tcApp.controller('AppCtrl', AppCtrl);
*/