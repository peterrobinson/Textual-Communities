var $ = require('jquery');
var UIService = require('./services/ui')
  , CommunityService = require('./services/community')
  , config = require('./config')
;
//require('jquery-ui/draggable');
//require('jquery-ui/resizable');
//require('jquery-ui/dialog');

var WriteCommentaryComponent = ng.core.Component({
  selector: 'tc-managemodal-write-commentary',
  templateUrl: '/app/writecommentary.html',
  inputs : ['community'],
  directives: [
    require('./directives/modaldraggable'), require('./directives/modalresizable')
  ],
}).Class({
  constructor: [
    CommunityService, UIService, function(
      communityService, uiService
    ) {
//    var Doc = TCService.Doc, doc = new Doc();
    $('#manageModal').width("750px");
    $('#manageModal').height("750px");
    this.success="";
    this.error="";
    this.communityService=communityService;
    this.uiService = uiService;
    this.preview="";
    this.commentary="";
    this.entity=uiService.state.community.attrs.abbr+"/entity=X:line=Y";
    this.entityTo="";
    this.commentaries=[];
    this.update=false;
    this.start=0;
    this.end=0;
    }],
  ngOnInit: function() {
  },
  approve: function(){
  	if (this.commentaries.length==0) {
  		this.error="Save the commentary before approving it";
  	} else if (this.commentary!=this.commentaries[0].text) {
  		this.error="Save the changes to the commentary before approving it";
  	} else {
  		var self=this;
  		$.post(config.BACKEND_URL+'approveCommentary?revision='+this.commentaries[0].id, function(res) {
  			if (res.success) {
  				self.error="";
  				self.success="Commentary approved";
  				self.checkCommentaries();
  				
  			} else {
  				self.error("Approval failed");
  			}
  		});
  	}
  },
  doItalic: function(event) { //do command/windows macros
  	var activeEl = document.activeElement;
  	var selectText=activeEl.value.slice(activeEl.selectionStart,activeEl.selectionEnd);
  	if (selectText.indexOf("<i>")==0) {
  		selectText=selectText.replace("<i>","").replace("</i>","");
  		var start=activeEl.selectionStart;
  		var end=activeEl.selectionEnd-7;
  		this.commentary=activeEl.value.slice(0, activeEl.selectionStart)+selectText+activeEl.value.slice(activeEl.selectionEnd);	
  	} else {
		var start=activeEl.selectionStart;
		var end=activeEl.selectionEnd+7; 	
		this.commentary=activeEl.value.slice(0, activeEl.selectionStart)+"<i>"+activeEl.value.slice(activeEl.selectionStart, activeEl.selectionEnd)+"</i>"+activeEl.value.slice(activeEl.selectionEnd);	
	}
  	setTimeout(function(){
  		var myEl=document.getElementById('editCommentary');
  		activeEl.setSelectionRange(start, end);
  	},250);
  },
  doBold: function(event) { //do command/windows macros
  	var activeEl = document.activeElement;
  	  	var selectText=activeEl.value.slice(activeEl.selectionStart,activeEl.selectionEnd);
  	if (selectText.indexOf("<b>")==0) {
  		selectText=selectText.replace("<b>","").replace("</b>","");
  		var start=activeEl.selectionStart;
  		var end=activeEl.selectionEnd-7;
  		this.commentary=activeEl.value.slice(0, activeEl.selectionStart)+selectText+activeEl.value.slice(activeEl.selectionEnd);	
  	} else {
		var start=activeEl.selectionStart;
		var end=activeEl.selectionEnd+7; 	
		this.commentary=activeEl.value.slice(0, activeEl.selectionStart)+"<b>"+activeEl.value.slice(activeEl.selectionStart, activeEl.selectionEnd)+"</b>"+activeEl.value.slice(activeEl.selectionEnd);	
   	}
   	setTimeout(function(){
  		var myEl=document.getElementById('editCommentary');
  		activeEl.setSelectionRange(start, end);
  	},250);
 },
  submit: function(){
    var self=this;
    var commentaryText=$('#Commentary').html();
    $.ajax({
      url: config.BACKEND_URL+'writeCommentary?community='+self.uiService.state.community.attrs.abbr,
      type: 'POST',
      data:  JSON.stringify({user: self.uiService.state.authUser._id, commentary: commentaryText, entity: self.entity, entityto: self.entityTo}),
      accepts: 'application/json',
      contentType: 'application/json; charset=utf-8',
      dataType: 'json'
    })
     .done(function( data ) {
       self.success="Commentary saved to database";
       self.error="";
       self.checkCommentaries();
      })
     .fail(function( jqXHR, textStatus, errorThrown) {
      self.success="Error " + errorThrown;
    });
  },
  closeModalIM: function() {
    this.success="";
    $('#manageModal').modal('hide');
  },
  clickEntityStart: function() {
  	if (this.commentaries.length>0) {
  		let doIt=false;
  		if (this.commentary!=this.commentaries[0].text) {
  		   doIt=confirm("Commentaries for "+this.entity+" are loaded, and there are unsaved changes in the commentary you are now editing. Continue?");
  		} else {
  		   doIt=confirm("Commentaries for "+this.entity+" are loaded. Do you want to edit a different commentary?");
  		} 
  		if (doIt) {
  			this.commentaries=[];
  			this.commentary="";
  			this.entityTo="";
 // 			this.checkCommentaries();
  		}
  	} else this.checkCommentaries();
  },
  clickEntityTo: function() {
  	var self=this;
  	var replaceEnt=this.entityTo.replace(this.uiService.state.community.attrs.abbr+"/",this.uiService.state.community.attrs.abbr+":");
  	let doIt=false;
  	if (this.commentaries.length>0) {
		if (this.commentary!=this.commentaries[0].text) {
			   doIt=confirm("Commentaries for "+this.entity+" are loaded, and there are unsaved changes in the commentary you are now editing. Continue?");
			} else {
			   doIt=confirm("Commentaries for "+this.entity+" are loaded. Do you want to edit a different commentary?");
			} 
			if (doIt) {
				this.commentaries=[];
				this.commentary="";
				this.entityTo="";
//				this.checkCommentaries();
			} else {
			  this.entityTo="";
			}
		}  else {
			$.post(config.BACKEND_URL+'isEntity?entity='+replaceEnt, function(res) {
				if (res.success) {
					self.checkCommentaries();
				} else {
					"Entity " + self.entity2 + " does not exist";
				}
			});
		}
  },
  checkCommentaries: function(){
  	if (this.entityTo=="") {
  		this.success="Checking for commentary on "+this.entity;
  	} else {
  		this.success="Checking for commentary on "+this.entity+" to "+this.entityTo;
  	}
  	var self=this;
  	var replaceEnt=this.entity.replace(this.uiService.state.community.attrs.abbr+"/",this.uiService.state.community.attrs.abbr+":")
  	 $.post(config.BACKEND_URL+'isEntity?entity='+replaceEnt, function(res) {
		if (res.success) {
			self.success="Entity " + self.entity + " exists";
			self.error="";
			 $.post(config.BACKEND_URL+'getCommentaries?entity='+self.entity+"&entityTo="+self.entityTo, function(res) {
			 	if (res.success) {
			 		if (self.entityTo=="") self.success="Entity" + self.entity + " exists, and there is commentary on it";
			 		else self.success="Entities" + self.entity + " and "+self.entityTo+" exist, and there is commentary on that range"
			 		self.commentaries=res.commentaries.reverse();
			 		self.commentary=self.commentaries[0].text;
			 		//right!
			 	} else {
			 		if (self.entityTo=="") self.success="Entity " + self.entity + " exists, but there is no commentary on it.";
			 		else "Entities" + self.entity + " and "+self.entityTo+" exist, but there is no commentary on that range"
			 	}	
			 });
		}
		else self.success="Entity " + self.entity + " does not exist";
	});
  },
  formatDate: function(rawdate) {
    var date = new Date(rawdate);
    var options = {
    year: "numeric", month: "short",
    day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false
    };
    return date.toLocaleTimeString("en-us", options);
  },
  choose: function(commentary) {
  	this.commentary=this.commentaries[parseInt($('#WCSelect option:selected').attr("data-index"))].text;
  }
});


module.exports = WriteCommentaryComponent;
