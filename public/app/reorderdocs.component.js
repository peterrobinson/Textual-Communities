var $ = require('jquery');
var URI = require('urijs')
  , Router = ng.router.Router
  , UIService = require('./services/ui')
  , DocService = require('./services/doc')
  , config = require('./config')
;


var ReorderDocsComponent = ng.core.Component({
  selector: 'tc-managemodal-reorderdocs',
  templateUrl: '/app/reorderdocs.html',
  inputs: ['community'],
  directives: [
    require('./directives/modaldraggable')
  ],
}).Class({
  constructor: [Router, DocService, UIService, function(
    router, docService, uiService
  ) {
    var self=this;
//    var Doc = TCService.Doc, doc = new Doc();
    this.doc = {name:"", label: 'text'};
    $('#manageModal').width("420px");
    $('#manageModal').height("600px");
    this.message="";
    this.success="";
    this.uiService = uiService;
    this.state= uiService.state;
    this._docService = docService;
    this._router = router;
    /*this for scope variables */
    this.state = uiService.state;
  }],
  ngOnInit: function(){
     $("#TCReorderDocs" ).sortable({});
     let self=this;
 //    this.origpdocsids=this.community.attrs.documents(function(doc) {return(doc)});
     if (this.state.authUser && this.state.authUser.attrs.memberships.length) {
      for (var i=0; i<this.state.authUser.attrs.memberships.length; i++) {
        if (this.state.authUser.attrs.memberships[i].community.attrs._id==this.state.community.attrs._id)
          this.role=this.state.authUser.attrs.memberships[i].role;
          this.state.role=this.role;
          this.GAid=this.state.authUser._id;
      }
    } else {this.state.role="NONE"; this.role="NONE"; this.GAid="VISITOR"}
    if (this.state.authUser && this.state.authUser.attrs.local && this.state.authUser.attrs.local.email=="peter.robinson@usask.ca") {this.state.role="LEADER"; this.role="LEADER";}
    $.get(config.BACKEND_URL+'getDocNames/?community='+this.community._id)
		.done ( function(res) {
	//   	  console.log("succeed");
		  self.docnames=res;
		  for (var i=0; i<self.community.attrs.documents.length; i++) {
			self.community.attrs.documents[i].attrs.name=res[i].name;
			if (Object.keys(res[i].control).length>0) self.community.attrs.documents[i].attrs.control=res[i].control;
			self.community.attrs.documents[i].isDocImageTranscriptLocked=self.checkDocImageTranscriptLocked(self.community.attrs.documents[i]);
			if (self.community.attrs.documents[i].attrs.children.length==0 && res[i].npages!=0)
			  self.community.attrs.documents[i].attrs.children[0]={attrs:"dummy"}  //idea is to force not to show add page if we have pages */
		  }
		})
		.fail(function( jqXHR, textStatus, errorThrown ) {
			console.log(jqXHR);
			console.log(textStatus);
			console.log(errorThrown );
	 });
  },
  nullSuccess: function(){
  },
  ngOnChanges: function() {
  },
  checkDocImageTranscriptLocked: function(doc) {
    //is the community locked?
    if (this.role=="CREATOR" || this.role=="LEADER") return false;   //always veiwable
    if (this.role=="NONE") {
        if (doc.attrs.control && doc.attrs.control.images=="ALL" && doc.attrs.control.transcripts=="ALL") return false;
        if (doc.attrs.control && (doc.attrs.control.images!="ALL" || doc.attrs.control.transcripts!="ALL")) return true;
        if (this.state.community.attrs.control.images=="ALL" && this.state.community.attrs.control.transcripts=="ALL") return false;
        if (this.state.community.attrs.control.images!="ALL" || this.state.community.attrs.control.transcripts!="ALL") return true;
        return true;
    }
    if (this.role=="VIEWER") {
          if ((doc.attrs.control && doc.attrs.control.images=="ALL" || doc.attrs.control && doc.attrs.control.images=="VIEWERS") && (doc.attrs.control.transcripts=="ALL" || doc.attrs.control.transcripts=="VIEWERS")) return false;
          if ((this.state.community.attrs.control.images=="ALL" || this.state.community.attrs.control.images=="VIEWERS") && (this.state.community.attrs.control.transcripts=="ALL" || this.state.community.attrs.control.transcripts=="VIEWERS")) return false;
          return true;
      }
    if (this.role=="MEMBER") {
        if ((doc.attrs.control && doc.attrs.control.images=="ALL" || doc.attrs.control && doc.attrs.control.images=="VIEWERS" || doc.attrs.control && doc.attrs.control.images=="MEMBERS") && (doc.attrs.control.transcripts=="ALL" || doc.attrs.control.transcripts=="VIEWERS" || doc.attrs.control && doc.attrs.control.images=="MEMBERS")) return false;
        if ((this.state.community.attrs.control.images=="ALL" || this.state.community.attrs.control.images=="VIEWERS"  || this.state.community.attrs.control.images=="MEMBERS") && (this.state.community.attrs.control.transcripts=="ALL" || this.state.community.attrs.control.transcripts=="VIEWERS" || this.state.community.attrs.control.transcripts=="MEMBERS")) return false;
        return true;
    }
  },
  closeModalRD: function() {
    this.message=this.success="";
    $('#MMADdiv').css("margin-top", "30px");
    $('#MMADbutton').css("margin-top", "20px");
    this.doc = {name:"", label: 'text'};
    $('#manageModal').modal('hide');
  //     location.reload(true); //don't reload whole window. That's ugly
  },
  submit: function() {
  	//remake the docs list in this order...
  	let newDocs=[], newDocIds=[], newConfigCE=[];
  	let revDocs=$("#TCReorderDocs li");
  	let self=this;
  	for (let i=0; i<revDocs.length; i++) {
  		let myDoc=this.community.attrs.documents.filter(doc=>doc._id==$(revDocs[i]).attr("id"))[0];
  		if (this.community.attrs.hasOwnProperty("ceconfig")) {
  			let myDocCE=this.community.attrs.ceconfig.witnesses.filter(ceDoc=>ceDoc==myDoc.attrs.name)[0];
  			if (myDocCE) {
  				newConfigCE.push(String(myDoc.attrs.name));
  			}
  		}
  		newDocs.push(myDoc);
  		newDocIds.push($(revDocs[i]).attr("id"))
  	}
  	this.community.attrs.documents=newDocs;
  	if (newConfigCE.length>0) {
  		this.community.attrs.ceconfig.witnesses=newConfigCE;
  	}
  	//save new order
  	 $.ajax({
      	url:config.BACKEND_URL+'reorderDocs',
      	type: 'POST',
      	data: JSON.stringify({community: self.community.attrs.abbr, newDocIds:newDocIds, newConfigCE:newConfigCE}),
		accepts: 'application/json',
		contentType: 'application/json; charset=utf-8',
		dataType: 'json'
	})
	 .done (function(result) {
	    let foo=1;
  	 })
	.fail(function( jqXHR, textStatus, errorThrown) {
		alert( "error" + errorThrown );
    }); 
  }
});

module.exports = ReorderDocsComponent;
