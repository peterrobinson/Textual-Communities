var UIService = require('../services/ui')
, config = require('../config')
, async = require('async')
, $ = require('jquery')
, DocService = require('../services/doc')
, Router = ng.router.Router
, BrowserFunctionService = require('../services/functions')
;

var CommunityUncommittedComponent = ng.core.Component({
  selector: 'tc-community-uncommitted',
  templateUrl: '/app/community/search.html',
  inputs: [
    'community',
  ],
}).Class({
  constructor: [Router, UIService, DocService, function(router, uiService, docService) {
    this.state = uiService.state;
    this._router = router;
    this.uiService=uiService;
    this.docService=docService;
    this.searchAll=false;
    this.document="";
    this.entity="";
    this.docnames=[];
    this.nPages=0;
    this.findUncommitted=true;
    this.findString=false;
    this.inSearch=false;
     this.pageN="";
    this.nPage=0;
    this.error="";
    this.searchString="";
    this.stopSearch=false;
  }],
  ngOnInit: function() {
    var self=this;
     $.get(config.BACKEND_URL+'getDocNames/?community='+this.state.community._id, function(res) {
     	self.docnames=res;
     });

  },
  formatDate: function(rawdate) {
    var date = new Date(rawdate);
    var months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return date.getDate()+" "+months[date.getMonth()]+" "+date.getFullYear();
//    return date.toDateString()
  },
  doSearch: function() {
  	var self=this;
  	var docId="";
  	var searchDocs=[];
  	if (!this.searchAll && !this.document && !this.entity) {this.error="If you have not selected search all documents, you must specify either a document or an entity to search"; return;}
  	if (!this.searchAll) {
  		if (this.document!="" && this.entity!="") {
  			alert("If you are not searching every document: you can specify either a document of an entity to search but not both");
  			return;
		}
		if (this.document!="") {
			for (let i=0; i<this.docnames.length; i++) {
				if (this.docnames[i].name==this.document) {
					docId=this.community.attrs.documents[i]._id;
					searchDocs.push(this.community.attrs.documents[i]);
					i=this.docnames.length;
				}
			}
			if (docId=="") {
				this.error='"' + this.document+'" is not the name of a document in the '+this.state.community.attrs.abbr+' community'; 
				return;
			}
		} else if (this.entity!="") { 
		//right! let's get it
			async.waterfall([
				function (cb1) { 
					if (!self.docnames) {
						$.get(config.BACKEND_URL+'getDocNames/?community='+self.state.community._id, function (docnames) {
							self.docnames=docnames;
							cb1(null, []);
						});
					} else {
						cb1(null, []);
					} 
				},
				function (arguments, cb1) {
					$.get(config.host_url+'/uri/urn:det:tc:usask:'+self.state.community.attrs.abbr+'/entity='+self.entity+':document=*?type=list', function (doclist) {
			//			self.error=doclist.length+" documents found containing "+self.entity;
						if (doclist.length==0) {
							cb1("No documents found containing top-level entity "+self.entity, []);
						} else {
							cb1(null, doclist);
						}
					}); 
				},
				function(doclist, cb1) {  //these are the documents that have the pages we need to test
					async.mapSeries(doclist, function (thisdoc, cb2) {
						let searchDoc=null;
						for (let i=0; i<self.docnames.length; i++) {
							if (thisdoc.name[0]==self.docnames[i].name[0]) searchDoc=self.community.attrs.documents[i];
						}	
						if (searchDoc) {
							self.docService.refreshDocument(searchDoc).subscribe(function(mydoc) {
								// now get pages in this document which have this entity
								document.getElementById("TCsearchResults").insertAdjacentHTML('beforeend',"<br/>Searching "+thisdoc.name[0]+" for uncommitted pages");
								$.get(config.host_url+'/uri/urn:det:tc:usask:'+self.state.community.attrs.abbr+'/entity='+self.entity+':document='+thisdoc.name[0]+':pb=*?type=list', function(pagelist) {
									async.mapSeries(pagelist, function(revisionPage, cb3){
										let mypage=mydoc.attrs.children.filter(page=>page.attrs.name==revisionPage[0])[0];
										$.get(config.BACKEND_URL+'getRevisions/?page='+mypage._id, function(revisions) {
											if (revisions.length) {
												if (self.findUncommitted) {
													if (revisions[0].status!="COMMITTED") {
														document.getElementById("TCsearchResults").insertAdjacentHTML('beforeend',"<br/> Status of latest transcription in <a target='new' href='"+config.host_url+"/app/community/?id="+self.community._id+"&route=view&document="+mydoc._id+"&page="+mypage._id+"'>"+mypage.attrs.name+"</a> in "+thisdoc.name[0]+" is "+revisions[0].status+", last saved on "+self.formatDate(revisions[0].created));
														cb3(null);
													} else {
														cb3(null);
													}
												}  else {
													cb3(null);
												}
											} else {
												cb3(null);
											}
										});
									}, function (err) {
										cb2(err);
									})
								})
							})
						} else {
							cb2("Can't find record for document "+thisdoc.name[0]);
						}	
					}, function (err) {
						cb1(err, [])
					});
		/*			$.get(config.host_url+'/uri/urn:det:tc:usask:'+self.state.community.attrs.abbr+'/entity='+self.entity+':document='+'Hg'+':pb=*?type=list', function(pagelist) {
					
					}); */
				}
			], function (err) {
				if (err) self.error=err;
				return;
			});
		}
  	} else {
  		searchDocs=this.community.attrs.documents;
  	}
	this.error="";
	this.stopSearch=false;
	$("#TCsearchResults").html("");
	async.mapSeries(searchDocs, function(thisDoc, callback1) {
		self.docService.refreshDocument(thisDoc).subscribe(function(mydoc) {
			self.nPages=mydoc.attrs.children.length;
			self.document=mydoc.attrs.name;
			self.inSearch=true;
			var index=0;
			async.mapSeries(mydoc.attrs.children, function(thisPage, callback){
				if (self.stopSearch) {
					callback("search stopped");
					return;
				}
				self.nPage=++index;
				self.pageN=thisPage.attrs.name;
				var pageId=thisPage._id;
				$.get(config.BACKEND_URL+'getRevisions/?page='+pageId, function(revisions) {
					if (revisions.length) {
						if (self.findUncommitted) {
							if (revisions[0].status!="COMMITTED") {
								document.getElementById("TCsearchResults").insertAdjacentHTML('beforeend',"<br/> Status of latest transcription in <a target='new' href='"+config.host_url+"/app/community/?id="+self.community._id+"&route=view&document="+thisDoc._id+"&page="+thisPage._id+"'>"+thisPage.attrs.name+"</a> in "+self.document+" is "+revisions[0].status+", last saved on "+self.formatDate(revisions[0].created));
							}
						} 
					} 
					callback(null);
				});
		
			}, function(err){
				callback1(null);
			});
		});
	});
  }
});

module.exports = CommunityUncommittedComponent;
