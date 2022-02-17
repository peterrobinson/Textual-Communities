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
  doSearch: function() {
  	var self=this;
  	var docId="";
  	var searchDocs=[];
  	if (!this.searchString) {this.error="You must specify a search string"; return;}
  	if (!this.searchAll && !this.document) {this.error="If you have not selected search all documents, you must specify a document to search"; return;}
  	if (!this.searchAll) {
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
});

module.exports = CommunitySearchComponent;
