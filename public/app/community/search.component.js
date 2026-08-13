var UIService = require('../services/ui')
, config = require('../config')
, async = require('async')
, $ = require('jquery')
, DocService = require('../services/doc')
, Router = ng.router.Router
, BrowserFunctionService = require('../services/functions')
;

var CommunitySearchComponent = ng.core.Component({
  selector: 'tc-community-search',
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
 	this.findString=true;
    this.findUncommitted=false;
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
  doSearch: function() {   //are we using this? at all???
  	var self=this;
  	var docId="";  
  	var searchDocs=[];
  	if (!this.searchString) {this.error="You must specify a search string"; return;}
 // 	if (!this.searchAll && !this.document) {this.error="If you have not selected search all documents, you must specify a document or entity to search"; return;}
  	if (!this.searchAll) {
  		//first, search a doc
  		if (this.document=="" && this.entity=="") {
  			alert("If you are not searching every document: you must specify either a document of an entity to search");
  			return;
  		} else if (this.document!="" && this.entity!="") {
  			alert("If you are not searching every document: you can specify either a document of an entity to search but not both");
  			return;
  		} else if (this.document!="") {
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
		} else if (this.entity!="") { //right! let's  get all the documents that have this entity...
		   //http://localhost:3000/uri/urn:det:tc:usask:CTP2/entity=GP:document=*?type=list
//		   $.get("http://localhost:3000/uri/urn:det:tc:usask:CTP2/entity="+this.entity+":document=*?type=list", function (doclist) {
			$.get(config.host_url+'/uri/urn:det:tc:usask:CTP2/entity='+this.entity+':document=*?type=list', function (doclist) {
				$("#TCsearchResults").html("");
				let docIndex=0;
				$.get(config.BACKEND_URL+'getDocNames/?community='+self.state.community._id, function (res) {
					//tedious. We have to look up name in doclist then in self.state.documents to get our document id
					for (let i=0; i<doclist.length; i++) {
						let myN=res.findIndex(name=>name.name[0]==doclist[i].name[0	])
						doclist[i]._id=self.community.attrs.documents[myN]._id;
						doclist[i].attrs=self.community.attrs.documents[myN].attrs;
					}
					async.mapSeries(doclist, function(thisDoc, callback1) {
						docIndex++;
						if (self.stopSearch) {
							callback1("stopped");
							return;
						}
						self.docService.refreshDocument(thisDoc).subscribe(function(mydoc) {
							//but we ONLY want to search pages with this entity! so filter only those pages containing WBP
							$.get(config.host_url+'/uri/urn:det:tc:usask:CTP2/entity='+self.entity+':document='+mydoc.attrs.name+':pb=*?type=list', function (doclist2) {
								//edit the children of myDoc to remove those not in doclist2
								var index=0;
								for (let i=0;i<mydoc.attrs.children.length; i++) {
									let present=doclist2.filter(page=>page[0]==mydoc.attrs.children[i].attrs.name);
									if (present.length==0) {
										mydoc.attrs.children.splice(i, 1);
										i--;
									}
								}
								self.nPages=mydoc.attrs.children.length;
								self.document=mydoc.attrs.name;
								self.inSearch=true;
								let pageIndex=0;
								document.getElementById("TCsearchResults").insertAdjacentHTML('beforeend',"<br/>Searching "+self.nPages+" pages in "+self.document+".");
								async.mapSeries(mydoc.attrs.children, function(thisPage, callback2){
									pageIndex++;
//									document.getElementById("TCsearchResults").insertAdjacentHTML('beforeend',"<br/>Searching "+thisPage.attrs.name[0]+" in "+self.document+", "+pageIndex+" of "+self.nPages);
									self.nPage=++index;
									self.pageN=thisPage.attrs.name;
									var pageId=thisPage._id;
									$.get(config.BACKEND_URL+'getRevisions/?page='+pageId, function(revisions) {
										//is the string in the text???
										let nResults=0;
										let offset=0;
										if (revisions.length) {
											while (revisions[0].text.indexOf(self.searchString, offset)>-1) {
												nResults++;
												offset=revisions[0].text.indexOf(self.searchString, offset)+self.searchString.length+1;
											}
											if (nResults>0) {
												document.getElementById("TCsearchResults").insertAdjacentHTML('beforeend',"<br/>"+nResults+" instances of \""+self.searchString.replace("<", "&lt;")+"\" found in <a target='new' href='"+config.host_url+"/app/community/?id="+self.community._id+"&route=view&document="+thisDoc._id+"&page="+thisPage._id+"'>"+thisPage.attrs.name+"</a> in "+self.document+".");
											}
											callback2(null);
										} else {
											self.docService.getTextTree(thisPage).subscribe(function(teiRoot) {
												offset=0;
												var dbRevision = self.docService.json2xml(BrowserFunctionService.prettyTei(teiRoot));
												while (dbRevision.indexOf(self.searchString, offset)>-1) {
													nResults++;
													offset=dbRevision.indexOf(self.searchString, offset)+self.searchString.length+1;
												}
												if (nResults>0) {
													document.getElementById("TCsearchResults").insertAdjacentHTML('beforeend',"<br/>"+nResults+" instances of \""+self.searchString.replace("<", "&lt;")+"\" found in <a target='new' href='"+config.host_url+"/app/community/?id="+self.community._id+"&route=view&document="+thisDoc._id+"&page="+thisPage._id+"'>"+thisPage.attrs.name+"</a> in "+self.document+".");
												}	
												callback2(null);
											});
										}					
									}); 
								}, function (err) {
									callback1(null);
								});
							});
						});
					}, function (err) {
						let boo=1;
					});
				});
			});
		}
  	} else { //I don't think this is used now at all
  		searchDocs=this.community.attrs.documents;
		this.error="";
		this.stopSearch=false
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
							if (revisions[0].text.indexOf(self.searchString)>-1) {
								document.getElementById("TCsearchResults").insertAdjacentHTML('beforeend',"<br/>"+self.searchString+" found in <a target='new' href='"+config.host_url+"/app/community/?id="+self.community._id+"&route=view&document="+thisDoc._id+"&page="+thisPage._id+"'>"+thisPage.attrs.name+"</a> in "+self.document+". Transcription status is "+revisions[0].status+", last saved on "+self.formatDate(revisions[0].created));
							}
							callback(null);
						} else {
							self.docService.getTextTree(thisPage).subscribe(function(teiRoot) {
								var dbRevision = self.docService.json2xml(BrowserFunctionService.prettyTei(teiRoot));
								if (dbRevision.indexOf(self.searchString)>-1) {
									document.getElementById("TCsearchResults").insertAdjacentHTML('beforeend',"<br/>"+self.searchString+" found in <a target='new' href='"+config.host_url+"/app/community/?id="+self.community._id+"&route=view&document="+thisDoc._id+"&page="+thisPage._id+"'>"+thisPage.attrs.name+"</a> in "+self.document+". Transcription status is committed, no transcriptions since document loading");
								}
								callback(null);
							 });
						}
					});
			
				}, function(err){
					callback1(null);
				});
			});
		});
	 }
  }
});

module.exports = CommunitySearchComponent;
