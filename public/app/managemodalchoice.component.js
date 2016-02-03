var $ = require('jquery');
var URI = require('urijs')
  , UIService = require('./ui.service')
  , CommunityService = require('./community.service')
  , AuthService = require('./auth.service')
  , TCService = require('./tc')
//require('jquery-ui/draggable');
//require('jquery-ui/resizable');
//require('jquery-ui/dialog');

var ManageModalChoiceComponent = ng.core.Component({
  selector: 'tc-managemodal-adddocument',
  templateUrl: '/community/manage/tmpl/add-document.html'
}).Class({
  constructor: [CommunityService, AuthService, UIService, function(communityService, authService, uiService) {
    this._uiService = uiService;
    var self=this;
//    var Doc = TCService.Doc, doc = new Doc();
    this.doc = {name:""};
    $('#manageModal').width("350px");
    $('#manageModal').height("188px");
    this.message="";
    this.success="";
    this._uiService.community$.subscribe(function(id){
      self.community = communityService.get(id);
    });
    /*this for scope variables */
  }],
  submit: function() {
    if (this.doc.name == undefined || this.doc.name.trim()=="" ) {
      this.message = 'The document must have a name';
      $('#MMADdiv').css("margin-top", "0px");
      $('#MMADbutton').css("margin-top", "10px");
      return
    }
  },
  closeModalAD: function() {
    this.message=this.success=this.doc.name="";
    $('#MMADdiv').css("margin-top", "30px");
    $('#MMADbutton').css("margin-top", "20px");
    $('#manageModal').modal('hide');
  }
});

module.exports = ManageModalChoiceComponent;