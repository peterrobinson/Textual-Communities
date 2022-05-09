var $ = require('jquery');

var InfoMessageComponent = ng.core.Component({
  selector: 'tc-managemodal-info-message',
  templateUrl: '/app/infomessage.html',
  inputs : ['message', 'header', 'source'],
  directives: [
    require('./directives/modaldraggable')
  ],
}).Class({
  constructor: [ function() {
//    var Doc = TCService.Doc, doc = new Doc();
    $('#manageModal').width("300px");
    $('#manageModal').height("100px");
    }],
  closeModalIMLC: function() {
  	setTimeout(function() {
		this.message="";
		$('#MMADdiv').css("margin-top", "30px");
		$('#MMADbutton').css("margin-top", "20px");
		$('#manageModal').modal('hide');
	}, 1000);
  },
  ngOnChanges: function() {
      if (this.source=="committed") {
      this.closeModalIMLC();
      return;
    }
    if (this.source=="CollationBase") {
      $('#manageModal').width("400px");
      $('#manageModal').height("150px");
    }
    if (this.source=="accessControl") {
      $('#manageModal').width("500px");
      $('#manageModal').height("320px");
    } else {
      $('#manageModal').width("500px");
      $('#manageModal').height("320px");
    }
},
  doLoginModal: function() {
    $('#manageModal').modal('hide');
  }
});


module.exports = InfoMessageComponent;
