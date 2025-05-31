var $ = require('jquery')
  , async = require('async')
  , UIService = require('./services/ui')
  , DocService = require('./services/doc')
  , RESTService = require('./services/rest')
  , Dropzone = require('dropzone')
  , config = require('./config')
;


var RepairCommunityComponent = ng.core.Component({
  selector: 'tc-managemodal-repaircommunity',
  templateUrl: '/app/repaircommunity.html',
  directives: [
    require('./directives/modaldraggable'),
    require('./directives/modalresizable'),
  ],
  inputs: [
    'community'
  ]
}).Class({
  constructor: [
    UIService, DocService, RESTService,
  function(
    uiService, docService, restService
  ) {
    this._docService = docService;
    this.uiService = uiService;
    this.restService = restService;
    this.state = uiService.state;
    this.message="";
    this.success="";
    this.isChecked=false;
    this.checkResult="";
    this.inSearch=false;
    this.deleteGhosts=false;
    this.stopSearchButton=false;
     $('#manageModal').width("600px");
     $('#manageModal').height("500px");

//    this.pdfjsLib = window['pdfjs-dist/build/pdf'];
//	this.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://mozilla.github.io/pdf.js/build/pdf.worker.js';
  }],
  ngOnInit: function() {
	var foo=1;

  },
  checkEntities: function() {
    this.message="";
    this.success="";
 	if (typeof this.community.attrs.entities == "undefined" || this.community.attrs.entities.length==0) {
 		this.message="No entities found in this community. You need to commit a page containing an XML content element with a \"n\" attribute, for example:\r<p n=\"1\">My page</p>";
 	 } else if (typeof this.community.attrs.entities[0].attrs.name == "undefined" || this.community.attrs.entities[0].attrs.name=="") {
 		this.message="One or more entities have been found in this community, but the entity has not been properly declared"; 	 
 	 } else {
 	 	let nNotTerminal=0;
 	 	let strNotTerminal="";
 	 	let nTerminal=0;
 	 	let strTerminal="";
 	 	let flagRaised=false;
 	 	let message=";"
 		for (let i=0; i<this.community.attrs.entities.length; i++) {
 			if (this.community.attrs.entities[i].attrs.isTerminal) {
 				nTerminal++;
 				if (strTerminal!="") strTerminal+=", ";
 				strTerminal+=this.community.attrs.entities[i].attrs.name;
 				flagRaised=true;
 			} else {
 				nNotTerminal++;
 				if (strNotTerminal!="") strNotTerminal+=", ";
 				strNotTerminal+=this.community.attrs.entities[i].attrs.name;
 			}
 		}
 	 	message=this.community.attrs.entities.length+" entities found. ";
 	 	if (nNotTerminal>0) message+=nNotTerminal+" are not terminal and likely valid: \r"+strNotTerminal+". "
 	 	if (nTerminal>0) {
 	 		this.isChecked=true;
 	 		message+=nTerminal+" are terminal: \n"+strTerminal+". It is likely these are ghosts. Press Delete Toplevel Terminal Entities to delete these.";
 	 	} 
 	 	if (flagRaised) {
 	 		this.message=message;
 	 	} else {
 	 		this.success=message;
 	 	}
 	 }
  },
  deleteEntities: function (){
  	 var self=this;
  	 $.get(config.BACKEND_URL+'repairEntities/?community='+this.state.community.attrs.abbr, function(res) {
            var i=0;
            for (i=0; i<res.foundEntities.length; i++) {
              if (i<self.state.community.attrs.entities.length) {
                self.state.community.attrs.entities[i].attrs.name=res.foundEntities[i].name;
                self.state.community.attrs.entities[i].attrs.entityName=res.foundEntities[i].entityName;
              } else self.state.community.attrs.entities.push({name:res.foundEntities[i].name, entityName:res.foundEntities[i].entityName});
            }
            if (i<self.state.community.attrs.entities.length) {
              while (i<self.state.community.attrs.entities.length) {
                self.state.community.attrs.entities.pop();
              }
            }
            self.success="Entity list repaired.";
            self.isChecked=false;
            self.message="";
            if (self.state.community.attrs.rebuildents==undefined) {
				self.state.community.attrs.rebuildents=false;
				self._communityService.createCommunity(this.state.community.attrs).subscribe(function(community) {
				  //all ok
				},function(err) {
					if (err) self.message=err.json().message;
				});
   			 }
        });
   },
   checkTEIGhosts: function (){
  	 var self=this;
  	 self.inSearch=true;
  	 self.ghosts=[];
  	 self.currDoc="";
  	 self.nTEIs=0;
  	 self.currNDoc=0;
  	 self.nDocs=self.community.attrs.documents.length;
  	 self.currPage="";
  	 self.currNPage=0;
  	 self.currNPages=0;
  	 self.stopSearchButton=true;
     async.mapSeries(self.community.attrs.documents, function(document, cb1){
  	 	 self._docService.refreshDocument(document).subscribe(function(mydoc) {
  	 	     self.currDoc=document.attrs.name;
  	 	     self.currNDoc++;
  	 	     self.currNPages=mydoc.attrs.children.length;
  	 	     self.currNPage=0;
  	 	     if (self.stopSearch) {
  	 	     	cb1("search stopped")
  	 	     } else {
				 async.mapSeries(mydoc.attrs.children, function(mypage, cb2) {
					self.currPage=mypage.attrs.name;
					self.currNPage++;
					//identify the ghosts on each page.. ie, find the teis which have this page, check the elements below to see if they have documents
					if (self.stopSearch) {
						cb2("search stopped")
					 }  else {
					 	$.get(config.BACKEND_URL+'getTEIGhosts/?community='+this.state.community.attrs.abbr+"&page="+mypage._id+"&pageStr="+self.currPage+"&docStr="+self.currDoc, function(res) {
							//return a list of ghosts, if any
							self.ghosts=self.ghosts.concat(res.ghosts);
							self.nTEIs+=res.nTEIs;
							cb2(null);
						});
					}
				 }, function (err) {
					cb1(err);
				 })
			}
     	 });
  	 }, function (err) {
  	 	//finished looking in all documents
  	 	self.stopSearchButton=false;
  	 	if (err=="search stopped" && self.ghosts.length==0) {
  	 		self.message="Search stopped."
  	 	} else if (self.ghosts.length==0) {
  	 		self.success="Finished Search."
  	 	} else if (self.ghosts.length>0){
  	 	   self.message=self.ghosts.length+" ghost elements found: that is, elements which may not appear in a current document. This can lead to unpredictable collation results. Press See Ghost Elements to see what these are."
  		   self.deleteGhosts=true;
  	 	}
  	 });    
   },
  seeFoundGhosts: function() {
  	 this.deleteGhosts=false;
  	 var ghostStr="";
  	 for (i=0; i<this.ghosts.length; i++) {
  	 	if (i>0) ghostStr+="; "
  	 	ghostStr+=this.ghosts[i].tei.entityName+" at "+this.ghosts[i].doc+" "+this.ghosts[i].page;
  	 }
  	 this.message="The possible ghosts found were: "+ghostStr;
  },
  stop: function () {
  	this.stopSearch=true;
  	this.stopSearchButton=false;
  	if (this.ghosts.length>0) {
  		this.message=this.ghosts.length+" ghost elements found: that is, elements which do not appear in a current document. This can lead to unpredictable collation results. Press Delete Ghost Elements to delete these."
  		this.deleteGhosts=true;
  	}
  },
  closeModalRC: function() {
  	this.message="";
  	this.success="";
    $('#manageModal').modal('hide');
  }
});


module.exports = RepairCommunityComponent;
