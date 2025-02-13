var UIService = require('../services/ui')
, config = require('../config')
, async = require('async')
, $ = require('jquery')
, DocService = require('../services/doc')
, RESTService = require('../services/rest')
, Router = ng.router.Router
, BrowserFunctionService = require('../services/functions')
, JSZip = require('jszip')
, JSZipUtils = require('jszip-utils')
, FileSaver = require ('file-saver')
, BrowserFunctionService = require('../services/functions')
;



var CommunityMakeEditionComponent = ng.core.Component({
  selector: 'tc-community-makeEdition',
  templateUrl: '/app/community/makeedition.html',
//  styleUrls: ['/app/community/view.css'],
  inputs: [
    'community',
  ],
  directives: [
    require('../directives/filereader'),
  ],
}).Class({
  constructor: [Router, UIService, DocService, RESTService, function(router, uiService, docService, restService) {
    this.state = uiService.state;
    this._router = router;
    this.uiService=uiService;
    this.restService=restService
    this.docService=docService;
    this.error="";
    this.edition={whole:true, title: "An edition of "+this.state.community.attrs.longName, editor:"Edited by "+this.state.authUser.attrs.local.name, documents:[], messages:""};
  }],
  ngOnInit: function() {  //identify servers where stuff is coming from
  	this.edition.TCUrl=config.host_url;
  	this.edition.TCimagesUrl=config.host_url;
   	this.edition.imagesCommunity=this.community.attrs.abbr; 	
   	this.edition.TCCommunity=this.community.attrs.abbr;
   	this.config={};
   	this.config.universalBannerTemplate="/app/data/makeEdition/common/core/driver/universalbannertemplate.html";
   	this.config.universalBannerLocation="edition/common/local/xml/universalbanner.xml";
   	this.config.universalBannerDriverJs="/app/data/makeEdition/common/core/driver/driverbanner.js";
   	this.config.aliasesFile="/app/data/makeEdition/common/core/js/aliases.js";
    this.config.editorialTemplate="/app/data/makeEdition/common/core/driver/editorialtemplate.html";
    this.config.editorialDriverJs="/app/data/makeEdition/common/core/driver/drivereditorial.js";
    this.config.editorialJs="/app/data/makeEdition/common/core/js/editorialJs.js";
    this.config.indexTemplate="/app/data/makeEdition/common/core/driver/indextemplate.html";
    this.config.indexDriverJs="/app/data/makeEdition/common/core/driver/driverindex.js";
    this.config.indexJs="/app/data/makeEdition/common/core/js/indexJs.js";
    this.config.pagesTemplate="/app/data/makeEdition/common/core/driver/transcriptpagestemplate.html";
    this.config.pagesDriverJs="/app/data/makeEdition/common/core/driver/drivertranscriptpages.js";
    this.config.pagesJs="/app/data/makeEdition/common/core/js/pagesJs.js";
    this.config.collationTemplate="/app/data/makeEdition/common/core/driver/collationtemplate.html";
    this.config.vBaseTemplate="/app/data/makeEdition/common/core/driver/vbasetemplate.html";
    this.config.vBaseDriverJs="/app/data/makeEdition/common/core/driver/drivervbase.js"; 
    this.config.vBaseJs="/app/data/makeEdition/common/core/js/vBaseJs.js";
    this.config.vBaseJson="";
    this.config.collationDriverJs="/app/data/makeEdition/common/core/driver/drivercollation.js"; 
    this.config.collutilsJs="/app/data/makeEdition/common/core/js/collationutils.js";
    this.config.collationJs="/app/data/makeEdition/common/core/js/collationJs.js";
    this.config.splash="/app/data/makeEdition/common/core/images/splash.jpg";
  	this.config.hasVBase=false;
  	this.config.compareTemplate="/app/data/makeEdition/common/core/driver/comparetemplate.html";
  	this.config.makeCompareElements=30;
    this.config.compareDriverJs="/app/data/makeEdition/common/core/driver/drivercompare.js"; 
    this.config.compareJs="/app/data/makeEdition/common/core/js/compareJs.js";
  },
  toggleType: function(value) {
  	this.edition.whole=value;
  	if (this.edition.whole) {
  		this.error="";
  		this.edition.title="An edition of "+this.state.community.attrs.longName;
		this.edition.shorttitle=this.state.community.attrs.longName;
		this.edition.editor="Edited by "+this.state.authUser.attrs.local.name;
  	}
  },
  filechange: function(filecontent) {
  try {
     this.config = JSON.parse(filecontent);
     this.error="";
     $("#MEProgress").removeClass("alert alert-danger");
     $("#MEProgress").html("");
     if (this.config.hasOwnProperty("standalone") && this.config.standalone) this.edition.whole=false; //triggers use of sequential processing while using core values in config file to locate materials, set editor files
     if (this.config.hasOwnProperty("standalone") && !this.config.standalone) this.edition.whole=true; //process as standalone without generating or using files
     if (this.config.hasOwnProperty("longTitle")) this.edition.title=this.config.longTitle;
     if (this.config.hasOwnProperty("shortTitle")) this.edition.shorttitle=this.config.shortTitle;
     if (this.config.hasOwnProperty("editor")) this.edition.editor=this.config.editor;    
     if (this.config.hasOwnProperty("TCUrl")) this.edition.TCUrl=this.config.TCUrl;    
     if (this.config.hasOwnProperty("TCimagesUrl")) this.edition.TCimagesUrl=this.config.TCimagesUrl;    
     if (this.config.hasOwnProperty("imagesCommunity")) this.edition.imagesCommunity=this.config.imagesCommunity; 
     if (this.config.hasOwnProperty("TCCommunity")) this.edition.TCCommunity=this.config.TCCommunity; 
     if (!this.config.hasOwnProperty("universalBannerTemplate")) this.config.universalBannerTemplate="/app/data/makeEdition/common/core/driver/universalbannertemplate.html"; 
     if (!this.config.hasOwnProperty("universalBannerLocation")) this.config.universalBannerLocation="edition/common/local/xml/universalbanner.xml"; 
     if (!this.config.hasOwnProperty("universalBannerDriverJs")) this.config.universalBannerDriverJs="/app/data/makeEdition/common/core/driver/driverbanner.js"; 
     if (!this.config.hasOwnProperty("editorialTemplate")) this.config.editorialTemplate="/app/data/makeEdition/common/core/driver/editorialtemplate.html"; 
     if (!this.config.hasOwnProperty("editorialDriverJs")) this.config.editorialDriverJs="/app/data/makeEdition/common/core/driver/drivereditorial.js"; 
     if (!this.config.hasOwnProperty("editorialJs")) this.config.editorialJs="/app/data/makeEdition/common/core/js/editorialJs.js";    
     if (!this.config.hasOwnProperty("aliasesFile"))  	this.config.aliasesFile="/app/data/makeEdition/common/core/js/aliases.js";
     if (!this.config.hasOwnProperty("entityPagesFile"))  	this.config.entityPagesFile="edition/common/local/js/entityPages.js";
     if (!this.config.hasOwnProperty("indexTemplate")) this.config.indexTemplate="/app/data/makeEdition/common/core/driver/indextemplate.html"; 
     if (!this.config.hasOwnProperty("indexDriverJs")) this.config.indexDriverJs="/app/data/makeEdition/common/core/driver/driverindex.js"; 
     if (!this.config.hasOwnProperty("indexJs")) this.config.indexJs="/app/data/makeEdition/common/core/js/indexJs.js";
     if (!this.config.hasOwnProperty("pagesTemplate")) this.config.pagesTemplate="/app/data/makeEdition/common/core/driver/transcriptpagestemplate.html"; 
     if (!this.config.hasOwnProperty("pagesDriverJs")) this.config.pagesDriverJs="/app/data/makeEdition/common/core/driver/drivertranscriptpages.js"; 
     if (!this.config.hasOwnProperty("pagesJs")) this.config.pagesJs="/app/data/makeEdition/common/core/js/pagesJs.js";
     if (!this.config.hasOwnProperty("collationTemplate")) this.config.collationTemplate="/app/data/makeEdition/common/core/driver/collationtemplate.html"; 
     if (!this.config.hasOwnProperty("vBaseTemplate")) this.config.vBaseTemplate="/app/data/makeEdition/common/core/driver/vbasetemplate.html"; 
     if (!this.config.hasOwnProperty("collationDriverJs")) this.config.collationDriverJs="/app/data/makeEdition/common/core/driver/drivercollation.js"; 
     if (!this.config.hasOwnProperty("vBaseDriverJs")) this.config.vBaseDriverJs="/app/data/makeEdition/common/core/driver/drivervbase.js"; 
     if (!this.config.hasOwnProperty("vBaseJs")) this.config.vBaseJs="/app/data/makeEdition/common/core/js/vBaseJs.js";
     if (!this.config.hasOwnProperty("collutilsJs")) this.config.collutilsJs="/app/data/makeEdition/common/core/js/collationutils.js";
     if (!this.config.hasOwnProperty("collationJs")) this.config.collationJs="/app/data/makeEdition/common/core/js/collationJs.js";
	 if (!this.config.hasOwnProperty("hasVBase"))  	this.config.hasVBase=false;
     if (!this.config.hasOwnProperty("splash")) this.config.splash="/app/data/makeEdition/common/core/images/splash.jpg";
     if (!this.config.hasOwnProperty("compareTemplate")) this.config.compareTemplate="/app/data/makeEdition/common/core/driver/comparetemplate.html"; 
     if (!this.config.hasOwnProperty("makeCompareElements")) this.config.makeCompareElements=30; 
	 if (!this.config.hasOwnProperty("compareDriverJs")) this.config.compareDriverJs="/app/data/makeEdition/common/core/driver/drivercompare.js"; 
	 if (!this.config.hasOwnProperty("compareJs")) this.config.compareJs="/app/data/makeEdition/common/core/js/compareJs.js"; 

   //if not whole, then these properties must be set: give a warning
     if (!this.edition.whole && this.config.hasOwnProperty("standalone") && this.config.standalone) {
     	if (!this.config.hasOwnProperty("makePageEntities") || !this.config.hasOwnProperty("makeEntityPages") || !this.config.hasOwnProperty("makeEditorial") || !this.config.hasOwnProperty("makeSourceWitnesses") || !this.config.hasOwnProperty("makePagesHtml") || !this.config.hasOwnProperty("makeMenu") || !this.config.hasOwnProperty("makeCollation") || !this.config.hasOwnProperty("makeCompare") || !this.config.hasOwnProperty("makeWitnessInf")) {
     		this.error="You have set standalone to true but not set values for at least one of makeSourceWitnesses makeWitnessInf makePageEntities makeEntityPages makeEditorial makeMenu makePagesHtml makeCollation makeCompare. Please check the configuration file."
     	}
   	  }
  	} catch (e) {
		this.error+=e.message;
		this.edition.title="An edition of "+this.state.community.attrs.longName;
		this.edition.editor=this.state.authUser.attrs.local.name;
   	}
  },
  submit: function() {
  	this.error="";
  	var self=this;
  	const zip = new JSZip();
  	var entityPages=[];
  	var pageEntities=[];
	async.waterfall([
		function (cb1) {
			$("#MEProgress").html("Loading base files");
			loadBaseFiles(zip, self, function callback(result){
				cb1(result,[]);
			});
		},
		function(arguments, cb1) {
			makeDocInfo(self, zip, function callback (result){
				cb1(result,[]);
			});
		},
		function(arguments, cb1) {
			makeHeaderInfo(self, zip, function callback(result) {
				cb1(result,[]);
			});
		}, 
		function(arguments, cb1) { //identify all pages of all documents sought, and which pages have entities we are looking for
			makePageEntities(self, pageEntities, self.edition.documents, zip, function callback(result) {
				cb1(result,[]);
			});
		},
		function (arguments, cb1) {  //make or load an entities file
			makeEntityPages(self, zip, entityPages, function callback(result) {
				cb1(result,[]);
			});
		},
		function (arguments, cb1) {//load aliases file, if we have one
			loadAliases(self, zip, function callback(result) {
				cb1(result,[]);
			});
		},
		function(arguments, cb1) { //Creating editorial HTML files and menu to link to them
			makeEditorial(self, zip, function callback(result) {
				cb1(result,[]);
			});
		}, 
		function(arguments, cb1) { //Creating editorial HTML files and menu to link to them
			makeMenu(self, zip, function callback(result) {
				cb1(result,[]);
			});
		}, 
		function(arguments, cb1) {
			makeUniversalBanner(self, zip, function callback(result) {
				cb1(result, []);
			});
		},
		function(arguments, cb1) {
			makeEditorialPages(self, zip, function callback(result) {
				cb1(result, []);
			});
		},
		function(arguments, cb1) {  //read-in barebones index file; later inject data into it ready to use 
			makeIndexFile(self, zip, function callback(result) {
				cb1(result,[]);
			});
		}, 
		function (arguments, cb1) {  //we make the collation
			loadStemmatics(self, zip, function callback(result) {
				cb1(result,[]);
			});
		}, 
		function(arguments, cb1) {  //actually makes the pages for the documents...
			makeHTMLPages(self, zip, self.edition.documents, pageEntities, function callback(result) {
				cb1(result,[]);
			});  
		},
		function(arguments, cb1) {
			updateImages(self, zip, self.edition.documents, function callback(result) {
				cb1(result,[]);
			});
		},
		function (arguments, cb1) {  //we make the collation
			makeCollation(self, zip, function callback(result) {
				cb1(result,[]);
			});
		},
		function (arguments, cb1) {  //we make the collation
			makeVBase(self, zip, function callback(result) {
				cb1(result,[]);
			});
		},
		function (arguments, cb1) { //write the compare files
			makeCompare(self, zip, entityPages, function callback(result) {
				cb1(result,[]);
			});
		}
	], function (err) {
		if (err) {
			$("#MEProgress").html(self.edition.messages+" Error, edition not written: "+err);
			$("#MEProgress").addClass("alert alert-danger")
		} else {
			$("#MEProgress").html("Generating zipfile");								 
			zip.generateAsync({ type: 'blob' }).then(function (content) {
				FileSaver.saveAs(content, 'edition.zip'); 
				if (self.edition.documents.length==0) {
					self.edition.messages+="Warning: edition completed, but it appears no pages for expression as HTML were found. ";
				}
				if (self.edition.messages!="") {
					$("#MEProgress").addClass("alert alert-danger");
				}
				$("#MEProgress").html(self.edition.messages+"Edition completed");
				return;
			});
		}
	}); 	  	
  }
});


function loadBaseFiles(zip, self, callback) {
  async.waterfall([
	function(cb) {
		self.restService.http.get('/app/data/makeEdition/common/core/js/async.js').subscribe(function(myfile) {
			zip.file('edition/common/core/js/async.js',myfile._body);
			cb(null, []);
		})
	},
	function(arguments, cb) {
		self.restService.http.get('/app/data/makeEdition/common/core/js/clay.js').subscribe(function(myfile) {
			zip.file('edition/common/core/js/clay.js',myfile._body);
			cb(null, []);
		})
	},
	 function(arguments, cb) {
		self.restService.http.get('/app/data/makeEdition/common/core/js/split.js').subscribe(function(myfile) {
			zip.file('edition/common/core/js/split.js',myfile._body);
			cb(null, []);
		})
	},
	 function(arguments, cb) {
		self.restService.http.get('/app/data/makeEdition/common/core/js/common.js').subscribe(function(myfile) {
			zip.file('edition/common/core/js/common.js',myfile._body);
			cb(null, []);
		})
	},
/*	function(arguments, cb) {
		self.restService.http.get('/app/data/makeEdition/common/core/js/transcript.js').subscribe(function(myfile) {
			zip.file('edition/common/core/js/transcript.js',myfile._body);
			cb(null, []);
		})
	}, */
	function(arguments, cb) {
		self.restService.http.get('/app/data/makeEdition/common/core/css/banner.css').subscribe(function(myfile) {
			zip.file('edition/common/core/css/banner.css',myfile._body);
			cb(null, []);
		})
	},
	function(arguments, cb) {
		self.restService.http.get('/app/data/makeEdition/common/core/js/banner.js').subscribe(function(myfile) {
			zip.file('edition/common/core/js/banner.js',myfile._body);
			cb(null, []);
		})
	},
	function(arguments, cb) {
		self.restService.http.get('/app/data/makeEdition/common/core/js/jquery.min.js').subscribe(function(myfile) {
			zip.file('edition/common/core/js/jquery.min.js',myfile._body);
			cb(null, []);
		})
	},
	function(arguments, cb) {
		self.restService.http.get('/app/data/makeEdition/common/core/js/openseadragon.js').subscribe(function(myfile) {
			zip.file('edition/common/core/js/openseadragon.js',myfile._body);
			cb(null, []);
		})
	},
	function(arguments, cb) {
		self.restService.http.get('/app/data/makeEdition/common/core/js/palette.js').subscribe(function(myfile) {
			zip.file('edition/common/core/js/palette.js',myfile._body);
			cb(null, []);
		})
	},
/*	function(arguments, cb) {
		self.restService.http.get('/app/data/makeEdition/common/core/js/collation.js').subscribe(function(myfile) {
			zip.file('edition/common/core/js/collation.js',myfile._body);
			cb(null, []);
		})
	}, */
	function(arguments, cb) {
		self.restService.http.get('/app/data/makeEdition/common/core/js/dw_tooltips/js/dw_event.js').subscribe(function(myfile) {
			zip.file('edition/common/core/js/dw_tooltips/js/dw_event.js',myfile._body);
			cb(null, []);
		})
	},
	function(arguments, cb) {
		self.restService.http.get('/app/data/makeEdition/common/core/js/dw_tooltips/js/dw_tooltip_aux.js').subscribe(function(myfile) {
			zip.file('edition/common/core/js/dw_tooltips/js/dw_tooltip_aux.js',myfile._body);
			cb(null, []);
		})
	},
	function(arguments, cb) {
		self.restService.http.get('/app/data/makeEdition/common/core/js/dw_tooltips/js/dw_tooltip.js').subscribe(function(myfile) {
			zip.file('edition/common/core/js/dw_tooltips/js/dw_tooltip.js',myfile._body);
			cb(null, []);
		})
	}, 
	function(arguments, cb) {
		self.restService.http.get('/app/data/makeEdition/common/core/js/dw_tooltips/js/dw_viewport.js').subscribe(function(myfile) {
			zip.file('edition/common/core/js/dw_tooltips/js/dw_viewport.js',myfile._body);
			cb(null, []);
		})
	},
	function(arguments, cb) {
		self.restService.http.get('/app/data/makeEdition/common/core/js/dw_tooltips/js/dw_viewport.js').subscribe(function(myfile) {
			zip.file('edition/common/core/js/dw_tooltips/js/dw_viewport.js',myfile._body);
			cb(null, []);
		})
	},
	function(arguments, cb) {
		self.restService.http.get('/app/data/makeEdition/common/core/js/pagesJs.js').subscribe(function(myfile) {
			zip.file('edition/common/core/js/pagesJs.js',myfile._body);
			cb(null, []);
		})
	},
	function(arguments, cb) {
		self.restService.http.get('/app/data/makeEdition/common/core/js/collationJs.js').subscribe(function(myfile) {
			zip.file('edition/common/core/js/collationJs.js',myfile._body);
			cb(null, []);
		})
	},
	function(arguments, cb) {
		self.restService.http.get('/app/data/makeEdition/common/core/js/collutilsJs.js').subscribe(function(myfile) {
			zip.file('edition/common/core/js/collutilsJs.js',myfile._body);
			cb(null, []);
		})
	},
	function(arguments, cb) {
		self.restService.http.get('/app/data/makeEdition/common/core/js/vBaseJs.js').subscribe(function(myfile) {
			zip.file('edition/common/core/js/vBaseJs.js',myfile._body);
			cb(null, []);
		})
	},
	function(arguments, cb) {
		self.restService.http.get('/app/data/makeEdition/common/core/js/vBaseUtilsJs.js').subscribe(function(myfile) {
			zip.file('edition/common/core/js/vBaseUtilsJs.js',myfile._body);
			cb(null, []);
		})
	},
	function(arguments, cb) {
		self.restService.http.get('/app/data/makeEdition/common/core/js/editorialJs.js').subscribe(function(myfile) {
			zip.file('edition/common/core/js/editorialJs.js',myfile._body);
			cb(null, []);
		})
	},
	function(arguments, cb) {
		self.restService.http.get('/app/data/makeEdition/common/core/css/common.css').subscribe(function(myfile) {
			zip.file('edition/common/core/css/common.css',myfile._body);
			cb(null, []);
		})
	},
	function(arguments, cb) {
		self.restService.http.get('/app/data/makeEdition/common/core/css/transcript.css').subscribe(function(myfile) {
			zip.file('edition/common/core/css/transcript.css',myfile._body);
			cb(null, []);
		})
	},
	function(arguments, cb) {
		zip.file('edition/common/core/images/close.png', BrowserFunctionService.urlToPromise('/app/data/makeEdition/common/core/images/close.png', cb), {binary:true});
	},
	function(arguments, cb) {
		zip.file('edition/common/core/images/iconPrev.png', BrowserFunctionService.urlToPromise('/app/data/makeEdition/common/core/images/iconPrev.png', cb), {binary:true});
	},
	function(arguments, cb) {
		zip.file('edition/common/core/images/iconNext.png', BrowserFunctionService.urlToPromise('/app/data/makeEdition/common/core/images/iconNext.png', cb), {binary:true});
	},
	function(arguments, cb) {
		zip.file('edition/common/core/images/inklesslogo.png', BrowserFunctionService.urlToPromise('/app/data/makeEdition/common/core/images/inklesslogo.png', cb), {binary:true});
	},
	function(arguments, cb) {
		zip.file('edition/common/core/images/right-arrow-brown.png', BrowserFunctionService.urlToPromise('/app/data/makeEdition/common/core/images/right-arrow-brown.png', cb), {binary:true});
	},
	function(arguments, cb) {
		zip.file('edition/common/core/images/down-arrow-brown.png', BrowserFunctionService.urlToPromise('/app/data/makeEdition/common/core/images/down-arrow-brown.png', cb), {binary:true});
	},
	function(arguments, cb) {
		zip.file('edition/common/core/images/splash.jpg', BrowserFunctionService.urlToPromise('/app/data/makeEdition/common/core/images/splash.jpg', cb), {binary:true});
	},
	function(arguments, cb) {
		zip.file('edition/common/core/images/copyright.png', BrowserFunctionService.urlToPromise('/app/data/makeEdition/common/core/images/copyright.png', cb), {binary:true});
	},
	function(arguments, cb) {
		zip.file('edition/common/core/images/searchicon.png', BrowserFunctionService.urlToPromise('/app/data/makeEdition/common/core/images/searchicon.png', cb), {binary:true});
	},
	function(arguments, cb) {
		zip.file('edition/common/core/images/noteIcon.png', BrowserFunctionService.urlToPromise('/app/data/makeEdition/common/core/images/noteIcon.png', cb), {binary:true});
	},
	function(arguments, cb) {
		zip.file('edition/common/core/images/Inkless.png', BrowserFunctionService.urlToPromise('/app/data/makeEdition/common/core/images/Inkless.png', cb), {binary:true});
	},
	function(arguments, cb) {
		zip.file('edition/common/core/images/camera-black.png', BrowserFunctionService.urlToPromise('/app/data/makeEdition/common/core/images/camera-black.png', cb), {binary:true});
	},
	function(arguments, cb) {
		zip.file('edition/common/core/images/text.png', BrowserFunctionService.urlToPromise('/app/data/makeEdition/common/core/images/text.png', cb), {binary:true});
	},
	function(arguments, cb) {
		zip.file("edition/common/core/js/aliases.js", BrowserFunctionService.urlToPromise("/app/data/makeEdition/common/core/js/aliases.js", cb), {binary:true});
	},
	function(arguments, cb) {
		zip.file("edition/common/core/js/indexJs.js", BrowserFunctionService.urlToPromise("/app/data/makeEdition/common/core/js/indexJs.js", cb), {binary:true});
	}
  ], function (err) {
  	 if (self.config.standalone) {
		async.mapSeries(self.config.localFiles, function (myFile, cbfiles) {
			zip.file(myFile.dest, BrowserFunctionService.urlToPromise(myFile.src, cbfiles), {binary:true});
		}, function (err) {
			callback(null);
		});
	} else {
		callback(null);
	 }
  });
}

window.uploadPageDone=function(){
	//here we inject extra data into the file we are creating ...
	var scriptTag = "<script>var peter=1<";
	scriptTag +=  "/script>";
	$("#MEIframe").contents().find("head").append(scriptTag);
};

function makeDocInfo(self, zip, callback) {
	if (self.config.standalone && !self.config.hasOwnProperty("documents")) {
	    return(callback("You have declared standalone processing but you do not have a documents property in your configuration file"))
	} else if (self.config.standalone && !self.config.makeSourceWitnesses && self.config.hasOwnProperty("documents") && self.config.documents.length>0 && self.config.documents[0].hasOwnProperty("name")) {
		self.edition.documents=self.config.documents;
		return(callback(null));
	} else {
		 var documents=[];
		 $("#MEProgress").html("Assembling information about documents");
		 if (self.edition.whole || (!self.edition.whole && !self.config.hasOwnProperty("documents"))) {
			 $.get(self.config.TCUrl+'/uri/urn:det:tc:usask:'+self.config.TCCommunity+'/document=*?type=list', function(res) {
				for (let i=0; i<res.length; i++) {
					documents.push({name:res[i].name, pages:[]});
				}
				//now get the name of each page
				async.mapSeries(documents, function (mydocument, cbdocs){ 
					 $.get(self.config.TCUrl+'/uri/urn:det:tc:usask:'+self.config.TCCommunity+'/document='+mydocument.name+':*=*?type=list', function (pages) {
						for (let i=0; i<pages.length; i++) {	
							mydocument.pages.push(pages[i].name);
						}
						cbdocs(null);
					 });
				}, function (err) {
					 self.edition.documents=documents;
					 callback(null);
				})
			 });
		} else {	//in standalone mode. Could be just a bare array of names, or empty. In either case, load up the documents array
			if (!self.config.makeSourceWitnesses) {
				 callback(null);
			} else {
					if (!self.config.hasOwnProperty("documents") || self.config.documents.length==0 || !self.config.documents[0].hasOwnProperty("name")) {
					 $.get(self.config.TCUrl+'/uri/urn:det:tc:usask:'+self.config.TCCommunity+'/document=*?type=list', function(res) {
						if (self.config.documents.length==0) { //just whack all the documents found in
							for (let i=0; i<res.length; i++) {
								documents.push({"name":res[i].name, "pages":[]});
							}
						} else { //check the document is in our list
							for (let i=0; i<self.config.documents.length; i++) {
								let isDoc=res.filter(function (obj){return obj.name==self.config.documents[i]})[0];
								if (isDoc) {
									documents.push({name:self.config.documents[i], pages:[]});
								} else {
									return(callback("Document '"+self.config.documents[i]+"', specified in 'documents' in the edition configuration file, does not exist in this community"));
								}
								//all documents are valid. So generate the pages list
							}
						}
						//Ok we have documents. But what entities? if none specified, just get every page
						if (!self.config.hasOwnProperty("entities") || self.config.entities.length==0) {
							async.mapSeries(documents, function (mydocument, cbdocs){ 
								 $.get(self.config.TCUrl+'/uri/urn:det:tc:usask:'+self.config.TCCommunity+'/document='+mydocument.name+':*=*?type=list', function (pages) {
									for (let i=0; i<pages.length; i++) {	
										mydocument.pages.push(pages[i].name);
									}
									cbdocs(null);
								 });
							}, function (err) { //write to zip file here lol
								self.edition.documents=documents;
								if (self.config.makeSourceWitnesses) {
									zip.file('edition/output/witnesses.js', JSON.stringify(documents))
								}
								return(callback(null));
							});
						} else { // we have entities. So first step: get all the document pages; check for each entity what has those pages and mark those pages to go into each document page array
							//first step: create list of all pages in every document
							var testDocuments=[];
							async.waterfall([
								function (cb2) {
									async.mapSeries(documents, function (mydocument, cbdocs2){
										 $("#MEProgress").html("Processing document "+mydocument.name);
										 $.get(self.config.TCUrl+'/uri/urn:det:tc:usask:'+self.config.TCCommunity+'/document='+mydocument.name+':*=*?type=list', function (pages) {
											testDocuments.push({name:mydocument.name, active:false, pages:[]});
											 for (let i=0; i<pages.length; i++) {
												testDocuments[testDocuments.length-1].pages.push({name:pages[i].name, active:false})
											 }
											cbdocs2(null);
										 });
									}, function(err){
										cb2(null,[]);
									 });
								},
								function (arguments, cb2) {
									async.mapSeries(testDocuments, function (testdocument, cbdocs3) {
										$("#MEProgress").html("Checking entities present in "+testdocument.name);
										async.mapSeries(self.config.entities, function (myentity, cbents2){
											$.get(self.config.TCUrl+'/uri/urn:det:tc:usask:'+self.config.TCCommunity+'/entity='+myentity+':document='+testdocument.name+':*=*?type=list', function (pages) {
												//mark these pages active in testDocuments
												if (pages.length>0) {
													testdocument.active=true;
													for (let i=0; i<pages.length; i++) {
														testdocument.pages.filter(function (obj){return obj.name==pages[i]})[0].active=true;
													}
												}
												cbents2(null);
											});
										}, function (err){
											cbdocs3(null);
										});
									}, function (err){
										//ok now replace documents by what is in testDocuments
										documents=[];
										for (let i=0;i<testDocuments.length; i++) {
											if (testDocuments[i].active) {
												documents.push({"name": testDocuments[i].name, pages:[]})
												for (let j=0;j<testDocuments[i].pages.length; j++) {
													if (testDocuments[i].pages[j].active) documents[documents.length-1].pages.push(testDocuments[i].pages[j].name);
												}
											}
										}
										cb2(null,[]);
									})
								}
							], function (err) {
								if (self.config.makeSourceWitnesses) {
									zip.file('edition/output/witnesses.js', JSON.stringify(documents))
								}
								self.edition.documents=documents;
								callback(null);
							}); 
						}
					 });
				 } else {
				 	callback("Something wrong with sourceWitness identification. You may have set makeSourceWitnesses to true while having a complete documents element. Check the configuration file.")
				 };
			 }	
		}	
	} 
} 

function loadStemmatics(self, zip, callback) {
  if (self.config.standalone && (typeof self.config.stemmaticsFile=="undefined")) {
	return(callback(null));
  } else {
	$.get(self.config.stemmaticsFile, function(data){
		eval(data);
		self.config.stemmatics=stemmatics;
		return(callback(null));
	});
  }
}

function makeVBase(self, zip, callback) {
	if (self.config.standalone && !self.config.makeVBase) {
   		return(callback(null));
   } else {
   		$("#MEProgress").html("Creating VBase functionality");
		$.get(self.config.vBaseTemplate, function(myfile){
			let srcdoc=myfile;
			let mydata=BrowserFunctionService.customTemplates(srcdoc, [{key:"ssSearch", value: self.config.ssSearch, isobject: true}, {key:"firstTranscript", value: self.config.firstTranscript, isobject:false}, {key:"currEntity", value: self.config.firstEntity, isobject:false}, {key: "VBaseJson", value: self.config.vBaseJson, isobject:false}, {key:"currMS", value: self.config.currMS, isobject:false}], [self.config.vBaseDriverJs]); 
			$("#MEIframe").attr("srcdoc", mydata); 
			window.addEventListener("message", function (event){ 
				if (typeof event.data === "string") {
					let ssSearch=true;
					let str=BrowserFunctionService.adjustResult(self, event.data, true, [{key:"ssSearch", value: self.config.ssSearch, isobject: true}, {key:"universalBannerLocation", value: self.config.universalBannerLocation, isobject:false},{key: "view", value:"vbase", isobject:false}, {key: "currMS", value:self.config.currMS, isobject:false},  {key: "currEntity", value:self.config.firstEntity, isobject:false}],[self.config.vBaseJs, self.config.entityPagesFile, self.config.aliasesFile]);	
					zip.file("edition/vBase.html", str);
		//			console.log("Collation of "+currEntity+" written to zip file for "+zipFolder+'/'+folder+"/"+filename+" (timer: "+(end - start)+")");
					callback(null);
				} else {
					callback(null);
				}
			},{once:true}); 
		});
	}
}

function makeCollation(self, zip, callback) {
   if (self.config.standalone && !self.config.makeCollation) {
   		return(callback(null));
   } else {
   		$("#MEProgress").html("Creating html for collated elements");
   		$.get(self.config.collationTemplate, function(myfile){
   			let entitiesArray=[], origEntities=[] ;
   			let index=0; ci=0;
 			convertEntityPages(self.edition.entityPages, entitiesArray);
  			convertEntityPages(self.edition.entityPages, origEntities);
  			if (typeof self.config.entitiesLimit!="undefined") {
  				entitiesArray.splice(self.config.entitiesLimit);
  			}
  			if (typeof self.config.startCollation!="undefined") {
  				ci=entitiesArray.findIndex(entity=>entity==self.config.startCollation);
  				if (ci>-1) entitiesArray.splice(0, ci);
  				index=ci;
  			}
  			if (typeof self.config.endCollation!="undefined") {
  				ci=entitiesArray.findIndex(entity=>entity==self.config.endCollation);
  				if (ci>-1) entitiesArray.splice(ci+1);
  			}
  			async.mapSeries(entitiesArray, function(thisEntity, eaCB){
				let srcdoc=myfile, newCurr=[];
				let currEntity=thisEntity;
				let topEntity=currEntity.slice(0, currEntity.indexOf(":"));
				let currMS=self.config.currMS;
				//but might not be in this one...
				currMS=resetCurrMS(currMS, currEntity, self.edition.entityPages);
				let prevCollation="", nextCollation="";
				let thisIndex=origEntities.indexOf(currEntity);
				if (thisIndex>0) prevCollation=origEntities[index-1]; //so we go all the way start to end
				if (thisIndex<origEntities.length-1) nextCollation=origEntities[index+1];
				index++;	
				let ssSearch=self.config.ssSearch;
				let hasVBase=self.config.hasVBase;
				let hasVMap=false;
				let VMap={};
				if (typeof self.config.stemmatics!="undefined") {
					if (self.config.stemmatics.filter(stemma=>stemma.name==topEntity).length>0) {
						hasVMap=true; //need to adjust for WBP...
						let myVMap=self.config.stemmatics.filter(stemma=>stemma.name==topEntity)[0];
						VMap={"community":myVMap.community,"document":myVMap.document, "page":myVMap.page};
					}
				}
				let folder=currEntity.slice(0, currEntity.lastIndexOf(":"));
				let filename=currEntity.slice(currEntity.lastIndexOf(":")+1);
				$("#MEProgress").html("Creating collations for "+currEntity);
				async.waterfall([
					function(cbMC) {
						doCollation(self, zip, srcdoc, false, false, ssSearch, hasVMap, currEntity, currMS, prevCollation, nextCollation, VMap, hasVMap, folder, filename, function (){
							cbMC(null, []);
						})
					},
					function(arguments, cbMC) {
						doCollation(self, zip, srcdoc, false, true, ssSearch, hasVMap, currEntity, currMS, prevCollation, nextCollation, VMap, hasVMap, folder, filename, function (){
							cbMC(null, []);
						})
					},
					function(arguments, cbMC) {
						doCollation(self, zip, srcdoc, true, true, ssSearch, hasVMap, currEntity, currMS, prevCollation, nextCollation, VMap, hasVMap, folder, filename, function (){
							cbMC(null, []);
						})
					}, 
				], function (err) {
					$("#MEProgress").html("Created collations for "+currEntity)
					console.log("Collations for "+currEntity+" written to zip file")
					eaCB(err);
				});
			}, function (err) {
				return(callback(err));
			});
   		});
   	}
}

function doCollation (self, zip, srcdoc, regState, wordState, ssSearch, hasVMap, currEntity, currMS, prevCollation, nextCollation, VMap, hasVMap, folder, filename, callback) {
	let zipFolder="";
	if (!regState && !wordState) {
		zipFolder="collationorig";
	} else if (!regState && wordState) {
		zipFolder="collationorigwords";
	} else if (regState) {
		zipFolder="collationreg";
	}
	let mydata="";
	if (self.config.standalone) {
		mydata=BrowserFunctionService.customTemplates(srcdoc, [{key:"isstandalone", value:true, isobject: true}, {key:"ssSearch", value:ssSearch, isobject: true}, {key:"hasVMap", value:hasVMap, isobject: true}, {key:"community", value:self.config.TCCommunity, isobject: false}, {key: "TCurl", value:self.config.TCUrl, isobject:false}, {key: "view", value:"collation", isobject:false},{key:"universalBannerLocation", value: self.config.universalBannerLocation, isobject:false},  {key:"hasVBase", value: self.config.hasVBase, isobject:true}, {key:"currEntity", value: currEntity, isobject:false},  {key:"currMS", value: currMS, isobject:false}, {key:"prevCollation", value: prevCollation, isobject:false}, {key:"nextCollation", value: nextCollation, isobject:false}, {key:"VMap", value:JSON.stringify(VMap), isobject:true},{key:"regState", value: regState, isobject:true},{key:"wordState", value: wordState, isobject:true}], [self.config.collationDriverJs, self.config.collutilsJs, self.config.entityPagesFile, self.config.aliasesFile, self.config.indexCompareFile]); 
	} else {
		let banner = clean(self.edition.universalbanner);
		mydata=BrowserFunctionService.customTemplates(srcdoc, [{key:"isstandalone", value:false, isobject: true}, {key:"ssSearch", value:ssSearch, isobject: true}, {key:"hasVMap", value:hasVMap, isobject: true}, {key:"community", value:self.config.TCCommunity, isobject: false}, {key: "TCurl", value:self.config.TCUrl, isobject:false}, {key: "view", value:"collation", isobject:false}, {key:"universalBanner", value: banner, isobject:false}, {key:"hasVBase", value: self.config.hasVBase, isobject:true}, {key:"currEntity", value: currEntity, isobject:false},  {key:"currMS", value: currMS, isobject:false}, {key:"prevCollation", value: prevCollation, isobject:false}, {key:"nextCollation", value: nextCollation, isobject:false}, {key:"VMap", value:JSON.stringif(VMap), isobject:true},{key:"regState", value: regState, isobject:true},{key:"wordState", value: wordState, isobject:true} ], [self.config.collationDriverJs, self.config.collutilsJs,  self.config.entityPagesFile, self.config.aliasesFile]);
	}
	$("#MEIframe").attr("srcdoc", mydata);  //now we wait for a message
	let start=new Date();
	window.addEventListener("message", function (event){
		if (typeof event.data === "string") {
			let ssSearch=true;
			if (typeof self.config.ssSearch=="undefined") ssSearch=false;
			let str=BrowserFunctionService.adjustResult(self, event.data, false, [{key:"ssSearch", value:ssSearch, isobject: true},{key:"universalBannerLocation", value: self.config.universalBannerLocation, isobject:false},{key: "view", value:"collation", isobject:false}, {key: "currMS", value:currMS, isobject:false},  {key: "currEntity", value:currEntity, isobject:false}, {key: "hasVMap", value: hasVMap, isobject:true},{key:"regState", value: regState, isobject:true},{key:"wordState", value: wordState, isobject:true}],[self.config.collationJs, self.config.entityPagesFile, self.config.aliasesFile, self.config.indexCompareFile]);	
			zip.file('edition/html/'+zipFolder+'/'+folder+'/'+filename+".html", str);
			let end=new Date();
//			console.log("Collation of "+currEntity+" written to zip file for "+zipFolder+'/'+folder+"/"+filename+" (timer: "+(end - start)+")");
			callback(null);
		} else {
			callback(null);
		}
	},{once:true});
}

//altered: we now deliver the entity in two parts, corresponding to the entity + collateable sub entry
//set up file names
function makeMatch(entity, self) {
	match="";
	let index=entity.indexOf("entity=")+7;
	//everything up to the final : is the entity; what is after the final : is sub-entity
	let lastIndex=entity.lastIndexOf(":");
	if (lastIndex<index) {
		return([entity.slice(index), ""]);
	} else {
		let subEntity=entity.slice(lastIndex+1);
		return([entity.slice(index, lastIndex), subEntity]);
	}
}

function loadAliases (self, zip, callback) { 
	$("#MEProgress").html("Loading alias file");
	if (self.config.standalone && self.config.hasOwnProperty("aliasesFile")) {
		if (self.config.aliasFile=="") {
			self.edition.messages+="Non-fatal error: you have declared an aliasesFile but failed to name it. Check the documentation on aliasesFile.\r";
			return(callback(null));
		} else {
			self.restService.http.get(self.config.aliasesFile).subscribe(function(myfile) {
				if (myfile._body.indexOf("var aliases=[")!="0") {
					return(callback("Error found reading "+self.config.aliasesFile+". This file must begin with 'var aliases=['; see the documentation on aliasesFile"));
				} else {
					eval(myfile._body);
					self.config.aliases=aliases;
					return(callback(null));
				}
			});
		}
	} else if (!self.config.standalone ) { //load the default aliases
		self.restService.http.get(self.config.aliasesFile).subscribe(function(myfile) {
			eval(myfile._body);
			self.config.aliases=aliases;
			return(callback(null));
		});
	} else {
		return(callback(null));
	}
};

function makeHeaderInfo(self, zip, callback) { 
	$("#MEProgress").html("Creating header information for each document");
	if (self.config.standalone && !self.config.makeWitnessInf)  {
		if (!self.config.hasOwnProperty("witnessInfFile") || self.config.witnessInfFile=="")  {
			self.edition.messages+="Non-fatal error: you have set makeWitnessInf to false but not specified a witnessInfFile. Check the documentation on witnessInfFile.\r"
			return(callback(null));
		} else {
			self.restService.http.get(self.config.witnessInfFile).subscribe(function(myfile) {
//				var witnessInf={};
				if (myfile._body.indexOf("var witnessInf={};")!=0) {
					return(callback("Error found reading "+self.config.witnessInfFile+". This file must begin with 'var witnessInf={}'; see the documentation on the witness information file"));
				} else {
					eval(myfile._body);
					self.edition.witnessInf=witnessInf;
					return(callback(null));
				}
			})
		}
	}  else { 	//no config file, or no witnessHTTP file ... read all the document headers and create the witnesses file from there
		let myWitnesses="witnessInf={};";
		let flag=false;
		async.mapSeries(self.edition.documents, function (mydocument, cbdocs){ 
			$.get(self.edition.TCUrl+'/uri/urn:det:tc:'+config.authority+':'+self.config.TCCommunity+'/document='+mydocument.name+'?type=teiheader', function (myHeader) {
				let description="", permission="";
				if (typeof myHeader=="string" && myHeader.indexOf("<teiHeader>")==0) {
					let myXMLDOM = new DOMParser().parseFromString(myHeader, "text/xml");
					let x = myXMLDOM.getElementsByTagName("msDesc")[0];
					if (x) {
					  let mstitle=x.getElementsByTagName("msName")[0].innerHTML;
					  let msidno=x.getElementsByTagName("idno")[0].innerHTML;
					  let mssettlement=x.getElementsByTagName("settlement")[0].innerHTML;
					  let msrepository=x.getElementsByTagName("repository")[0].innerHTML;
					  description=mstitle+" "+mssettlement+", "+msrepository+" "+msidno;
					} else {
					   if (myXMLDOM.getElementsByTagName("titleStmt")[0].getElementsByTagName("title")) {
							description = myXMLDOM.getElementsByTagName("titleStmt")[0].getElementsByTagName("title")[0].innerHTML;
						} else {
							description="";
						}
					}
					if (myXMLDOM.querySelector("availability[n='imagePermission']")) {
						 permission = myXMLDOM.querySelector("availability[n='imagePermission']").innerHTML;
					} else {
						permission="";
					}
				}
				if (description=="" || permission=="") flag=true;
				if (description=="") description="No information found for "+mydocument.name+". Check the documentation";
				if (permission=="") permission="No permission found for "+mydocument.name+" Check the documentation";
				myWitnesses+="\nwitnessInf['"+mydocument.name+"']={id:'"+description+"', permission:'"+permission+"'};";
				cbdocs(null); 
			});
		}, function (err) {
			eval(myWitnesses);
			self.edition.witnessInf=witnessInf;
			if (flag) {
				self.edition.messages+="Non-fatal error: incomplete information for witness name and permission. Check the documentation on witnessInfFile.\r"
			} 
			zip.file('edition/output/witnessesInf.js', myWitnesses);
			return(callback(null));
		});
	}
}


function makePageEntities(self, pageEntities, documents, zip, callback) { //we don't need a source witnesses file! because this will all be in the documents element in the 
	$("#MEProgress").html("Processing information about documents");
	if (self.config.standalone && !self.config.makePageEntities)  {
		if (!self.config.pageEntitiesFile || self.config.pageEntitiesFile=="")  {
			self.edition.messages+="Non-fatal error: you have set makePageEntities to false but not specified a pageEntitiesFile. Check the documentation on pageEntitiesFile.\r";
			return(callback(null));
		} else {
			self.restService.http.get(self.config.pageEntitiesFile).subscribe(function(myfile) {
				if (myfile._body.indexOf("var pageEntities=[{")!=0) {
					return(callback("Error found reading "+self.config.pageEntitiesFile+". This file must begin with 'var pageEntities=[{'; see the documentation on pageEntitiesFile"));
				} else {
					eval(myfile._body);
					self.edition.pageEntities=pageEntities;
					return(callback(null));
				}
			})
		}
	}  else { //ok we have to make the page entities file, either because we are not stand-alone or we have set makePageEntities to false
		let commEntities=[], collEntities=[], pageEntities=[];
		async.mapSeries(self.edition.documents, function (doc, cbdocs) {
			pageEntities.push({witness:doc.name, entities:[]});
			if (typeof self.config.pagesLimit!="undefined") {
				doc.pages.splice(self.config.pagesLimit)
			}
			let thisMs=pageEntities.filter(function (obj){return obj.witness==doc.name})[0];
			async.mapSeries(doc.pages, function (myPage, saCB) {
				$("#MEProgress").html("Reading entities on "+myPage+" in "+doc.name);
				$.get(self.config.TCUrl+'/uri/urn:det:tc:usask:'+self.config.TCCommunity+'/entity=*:document='+doc.name+':pb='+myPage+'?type=list', function (pEnts) {
					//remove lines, and sort remaining pEnts...
					let fred=1;
					for (let i=0; i<pEnts.length; i++) {
						if (Object.entries(pEnts[i]).length==0) {	//error in source. You should check it.
							self.edition.messages+="Error on page "+myPage+" of document "+doc.name+". Empty entity found, this should not happen. Likely error in encoding. Check the transcription";
							return(saCB(null));
						}
						pEnts[i].match=makeMatch(pEnts[i].entity, self);
						if (pEnts[i].match[1]=="") { 
							pEnts.splice(i--, 1);
						} else {//is this an entity we are collating?
							if (self.config.hasOwnProperty("entities") && typeof self.config.entities[0]!="undefined") {
								let isEnt=false;
								for (let j=0; j<self.config.entities.length && !isEnt; j++) {
									if (pEnts[i].entity.indexOf("entity="+self.config.entities[j])>-1) isEnt=true;
								}
								if (!isEnt) pEnts.splice(i--, 1);
							}
						}
					}	
					//now check for existence of collation and commentary on this line	
					async.mapSeries(pEnts, function (thisEnt, sbCB)	{
						let hasCollation=false, hasCommentary=false;
						let searchEnt=thisEnt.entity.replace(":","/");
						async.waterfall([
							function (scCB) { //is there a collation
								if (collEntities.includes(thisEnt.entity)) {
									hasCollation=true;
									scCB(null,[]); 
								} else {
									$.get(self.config.TCUrl+"/api/isAlreadyCollation?entity="+thisEnt.entity+"&community="+self.config.TCCommunity+"&status=approved", function (json) {
										if (json.status) {
											hasCollation=true;
											collEntities.push(thisEnt.entity);
										}
										scCB(null,[]); 
									});
								}
							},
							function(arguments, scCB) { //is the a commentary
								if (commEntities.includes(thisEnt.entity)) {
									hasCommentary=true;
									scCB(null,[]); 
								} else {
									$.get(self.config.TCUrl+'/api/getApprovedCommentaries?entity='+searchEnt, function (json){
										if (json.results.length) {
											hasCommentary=true;
											commEntities.push(thisEnt.entity);
										};
										scCB(null,[]);
									});
								}
							}
						], function (err) { 
							//write it out now
							//is this entity among those we are looking for? is so add it
// version working for RE?	let newEntity=thisEnt.entity.slice(thisEnt.entity.indexOf("entity=")+7, thisEnt.entity.lastIndexOf(":"));
							let newEntity=thisEnt.entity.slice(thisEnt.entity.indexOf("entity=")+7); //working for WBP??
							//if no entities declared, get them all
							if (self.config.entities.length==0 || self.config.entities.filter(entity=>entity==newEntity).length>0) {
								thisMs.entities.push({page: myPage, match: makeMatch(thisEnt.entity, self), entity: thisEnt.entity, collateable: thisEnt.collateable, hasCollation:hasCollation, hasCommentary: hasCommentary});
							}
							sbCB(null);
						}); 
					},  function (err) {
						saCB(null);				
					}); 
				});
			}, function(err){
				cbdocs(err);
			});
		}, function (err) {
			if (err) {
				return(callback(err));
			} else {
			//create a compact version of this file, used in getting transcript info for each page
				let pageEntitiesMin=[];
				for (let i=0; i<pageEntities.length; i++) {
					pageEntitiesMin.push({"witness": pageEntities[i].witness, "pages":[]});
					let theseMinPages=pageEntitiesMin[pageEntitiesMin.length-1].pages;
					for (let j=0; j<pageEntities[i].entities.length; j++) {
						thisMinPage=theseMinPages.filter(page=>page.page==pageEntities[i].entities[j].page)[0];
						if (typeof thisMinPage=="undefined") {
							theseMinPages.push({"page": pageEntities[i].entities[j].page, "entities":[]});
							thisMinPage=theseMinPages[theseMinPages.length-1];
						}
						thisMinPage.entities.push({entity: pageEntities[i].entities[j].entity, hasCollation: pageEntities[i].entities[j].hasCollation, hasCommentary: pageEntities[i].entities[j].hasCommentary});
					}
				}
				self.edition.pageEntitiesMin=pageEntitiesMin;
				self.edition.pageEntities=pageEntities;
				zip.file('edition/output/pageEntitiesMin.js', 'var pageEntitiesMin='+JSON.stringify(pageEntitiesMin));
				zip.file('edition/output/pageEntities.js', 'var pageEntities='+JSON.stringify(pageEntities));
				zip.file('edition/common/local/js/pageEntities.js', 'var pageEntities='+JSON.stringify(pageEntities));				
				zip.file('edition/common/local/js/pageEntitiesMin.js', 'var pageEntities='+JSON.stringify(pageEntitiesMin));				
				return(callback(null));
			}
		});
  	}
}

function makeIndexFile(self, zip,  callback) {
	if (!self.config.standalone || (self.config.standalone && self.config.makeIndexFile)) {
		$("#MEProgress").html("Creating index file");
		self.restService.http.get(self.config.indexTemplate).subscribe(function(myfile) {
			let srcdoc=myfile._body;
			if (self.config.standalone) {
				mydata=BrowserFunctionService.customTemplates(srcdoc, [{key:"isstandalone", value:true, isobject: true},{key: "firstEntity", value: self.config.firstEntity, isobject:false}, {key: "view", value:"index", isobject:false}, {key:"universalBannerLocation", value: self.config.universalBannerLocation, isobject:false},  {key:"currMS", value: self.config.currMS, isobject:false}, {key:"hasVBase", value: self.config.hasVBase, isobject:true}, {key:"splash", value: self.config.splash, isobject:false},  {key:"shortTitle", value: self.edition.shorttitle, isobject:false}, {key:"longTitle", value: self.edition.title, isobject:false}, {key:"firstTranscript", value: self.config.firstTranscript, isobject:false}, {key:"ssSearch", value: self.config.ssSearch, isobject:true}], [self.config.indexDriverJs, self.config.entityPagesFile, self.config.aliasesFile]);
			} else {
				let banner = clean(self.edition.universalbanner);
				mydata=BrowserFunctionService.customTemplates(srcdoc, [{key:"isstandalone", value:false, isobject: true}, {key: "firstEntity", value: self.config.firstEntity, isobject:false} ,{key: "view", value:"index", isobject:false}, {key:"universalBanner", value: banner, isobject:false}, {key:"currMS", value: self.config.currMS, isobject:false}, {key:"hasVBase", value: self.config.hasVBase, isobject:true}, {key:"splash", value: self.config.splash, isobject:false},  {key:"shortTitle", value: self.edition.shorttitle, isobject:false}, {key:"longTitle", value: self.edition.title, isobject:false}], [self.config.indexDriverJs, self.config.entityPagesFile, self.config.aliasesFile]);
			}
			$("#MEIframe").attr("srcdoc", mydata);  //now we wait for a message
			window.addEventListener("message", function (event){
				if (typeof event.data === "string") {
					let ssSearch=true;
					if (typeof self.config.ssSearch=="undefined") ssSearch=false;
					let str=BrowserFunctionService.adjustResult(self, event.data, true, [{key:"ssSearch", value:ssSearch, isobject: true},{key:"currEntity", value: self.config.firstEntity, isobject:false}, {key:"universalBannerLocation", value: self.config.universalBannerLocation, isobject:false},{key: "currMS", value:self.config.currMS, isobject:false}, {key: "view", value:"index", isobject:false}],[self.config.indexJs, self.config.entityPagesFile, self.config.aliasesFile]);	
					zip.file("edition/index.html", str);
					return(callback(null));
				}
				return(callback(null));
			}, {once:true});	
		});
	} else {
		return(callback(null));
	}
}

function makeEditorial(self, zip, callback) {
	$("#MEProgress").html("Assembling commentary and collation materials");
	if (self.config.standalone && !self.config.makeEditorial)  {
		if (!self.config.editorialFile || self.config.editorialFile=="")  {
			self.edition.messages+="Non-fatal error: you have set makeEditorial to false but not specified a editorialFile. Check the documentation on editorialFile.\r";
			return(callback(null));
		} else {
			self.restService.http.get(self.config.editorialFile).subscribe(function(myfile) {
				if (myfile._body.indexOf("var editorial=[{")!=0) {
					return(callback("Error found reading "+self.config.editorialFile+". This file must begin with 'var editorial=[{'; see the documentation on pageEntitiesFile"));
				} else {
					eval(myfile._body);
					self.edition.editorial=editorial;
					//load aliases file too...now done in separate step
					return(callback(null));
				}
			})
		} 
	} else {  //create the editorial file
			//lets now get all the collation and commentary files out of pageEntities
		$("#MEProgress").html("Assembling collation and commentary files");
		//load the aliases file please
		const doneEntities=[], collEntities=[], commEntities=[]; //coz commMneuEntities is a collection of objects, not an array
		var editorial=[];
		editorial.push({"title":"About this edition","key":"About","text":[{"type":"p", "text":self.config.longTitle+" edited by "+self.config.editor}, {"type":"p", "text":"second paragraph"}]});
		editorial.push({"title":"Copyright", "key":"Copyright", "text":[{"type":"p", "text":"Copyright statement here"}]});
		editorial.push({"title":"Title Page", "key":"TitlePage", "text":[{"type":"p", "attr":"class=work", "text": self.config.longTitle}, {"type":"p", "attr":"class=editor3", "text":"<i>Edited by</i>"}, {"type":"p", "attr":"class=editor", "text":self.config.editor}]});
		async.mapSeries(self.edition.pageEntities, function (witness, cbPE) {
		   async.mapSeries(witness.entities, function(myEntity, cbWitness) {
		   		$("#MEProgress").html("Checking for commentary on "+myEntity.entity);
				if (doneEntities.includes(myEntity.entity)) { 
					return(cbWitness(null, []));
				} else {
					let searchEnt=myEntity.entity.replace(":","/");
//					myEntity.topMatch=myEntity.match.split("_")[0]; //do we need this??/
					async.waterfall([
						function (cb) {
							if (!myEntity.hasCommentary || commEntities.includes(myEntity.entity)) { 
								cb(null, []);
							} else {
								$.get(self.edition.TCUrl+'/api/getApprovedCommentaries?entity='+searchEnt, function (json){
									if (json.results.length>0) {
										commEntities.push(myEntity.entity);
										//add this to our commentary file...
										//group by top level entitities, to enable menu building
										for (let i=0; i<json.results.length; i++) {
											if (json.results[i].text.indexOf("<br>")>-1) { //go through this one paragraph at a time
												let myText=json.results[i].text, myFixed=[];
												myText=myText.replace(/(\r\n|\n|\r)/gm, "");
												while (myText.indexOf("<br>")>-1) {
													myFixed.push({"type":"p", "text":myText.slice(0, myText.indexOf("<br>"))});
													myText=myText.slice(myText.indexOf("<br>")+4);
												}
												myFixed.push({"type":"p", "text":myText});
												//readin alias at this point
												let aliases=[];
												if (self.config.hasOwnProperty("aliases")) {
													aliases=applyAliases(self.config.aliases, myEntity.entity);
												}
												editorial.push({"title":myEntity.match[1], "aliases": JSON.stringify(aliases), "key":myEntity.entity.slice(myEntity.entity.indexOf("entity=")+7), "text":myFixed, "date": json.results[i].date, "approver": json.results[i].approver});
											} else {
												let aliases=[];
												if (self.config.hasOwnProperty("aliases")) {
													aliases=applyAliases(self.config.aliases, myEntity.entity);
												}
												//check for alias
												editorial.push({"title":myEntity.match[1], "aliases": JSON.stringify(aliases), "key":myEntity.entity.slice(myEntity.entity.indexOf("entity=")+7), "text":[{"type":"p", "text":json.results[i].text}], "date": json.results[i].date, "approver": json.results[i].approver});
											}
										} 
									} 
									cb(null, []);	
								});
							}
						},
						function (arguments, cb) { 
							if (!myEntity.hasCollation || collEntities.includes(myEntity.entity)) { 
								cb(null, []);
							} else {
								$.get(self.edition.TCUrl+"/uri/urn:det:tc:usask:"+searchEnt+"?type=apparatus&format=approved", function (json) {
									$("#MEProgress").html("Writing json and xml files for collation of "+searchEnt);
									zip.file('edition/json/collation/'+ myEntity.match[0]+"/"+ myEntity.match[1]+'.json', JSON.stringify(json));
									cb(null, []);							
								});
							}
						},
						function (arguments, cb) { 
							if (!myEntity.hasCollation || collEntities.includes(myEntity.entity)) { 
								cb(null, []);
							} else {
								$.get(self.edition.TCUrl+"/uri/urn:det:tc:usask:"+searchEnt+"?type=apparatus&format=xml/positive", function (xml) {
									collEntities.push(myEntity.entity);
									zip.file('edition/xml/collation/'+ myEntity.match[0]+"/"+ myEntity.match[1]+'.xml', xml.replaceAll("&lt;","<"));
									cb(null, []);							
								});
							}
						}
					], function (err) {
						doneEntities.push(myEntity.entity);		
						cbWitness(null, []);
					});
				}  
		   }, function (err) {
				cbPE(null,[]);
		   });
		}, function (err) {
			self.edition.editorial=editorial;
			zip.file('edition/common/local/js/editorial.js', 'var editorial='+JSON.stringify(editorial));
			zip.file('edition/output/editorial.js', 'var editorial='+JSON.stringify(editorial));
			return(callback(null));
		});  
	} 
}

function applyAliases(aliases, entity) {
	let paths=entity.split(":");
	let aliasArray=[];
	for (let i=1; i<paths.length; i++ ) { //ignoring first element
		let values=paths[i].split("=");
		if (i==1) { // we got the top entity
			let myAlias=aliases.filter(alias=>alias.topEntity==values[1]);
			if (myAlias.length>0) {
				aliasArray.push(myAlias[0].alias);
			} else {
				aliasArray.push(values[1]);
			}
		}  else { // check key values
			let myAlias=aliases.filter(alias=>alias.key==values[0]);
			if (myAlias.length>0) {
				if (myAlias[0].alias=="") {
					aliasArray.push(values[1]);
				} else {
					aliasArray.push(myAlias[0].alias+" "+values[1]);
				}
			} else {
				aliasArray.push(values[0]+" "+values[1]);
			} 
		} 
	}
	return(aliasArray); 
}



function makeUniversalBanner(self, zip, callback) {
	$("#MEProgress").html("Creating the universal banner html");
	if ((self.config.standalone && self.config.makeUniversalBanner) || !self.config.standalone)  {
		$.get(self.config.universalBannerTemplate, function(data){
			//wierd thing ... node always loads the index file if we can't fina a file
			if (!self.config.hasOwnProperty("firstEntity")) {
				self.config.firstEntity=self.edition.pageEntities[0].entities.filter(entity=>entity.collateable)[0].entity;
			}
			if (data.indexOf("<tc-app>Loading...</tc-app>")>-1) {
				return(callback("Error when loading "+self.config.universalBannerTemplate+". Check file name and path."));
			} else {
				//supply needed entities, etc
				let ssSearch=true;
				if (typeof self.config.ssSearch=="undefined") ssSearch=false;
				if (self.config.standalone) {
					data=BrowserFunctionService.customTemplates(data, [{key:"standalone", value:true, isobject: true},{key:"ssSearch", value:ssSearch, isobject: true}, {key:"shortTitle", value: self.edition.shorttitle, isobject:false},{key:"currEntity", value: self.config.firstEntity, isobject:false}, {key:"hasVBase", value: self.config.hasVBase, isobject:true}], [self.config.menuFile, self.config.editorialFile, self.config.universalBannerDriverJs, self.config.entityPagesFile, self.config.aliasesFile ]);
				} else {
					data=BrowserFunctionService.customTemplates(data, [{key:"standalone", value: false,  isobject: true},{key:"ssSearch", value:ssSearch, isobject: true},{key:"shortTitle", value: self.edition.shorttitle, isobject:false}, {key:"hasVBase", value: false, isobject:true}, {key:"menu", value: JSON.stringify(self.edition.menu), isobject:true}, {key:"editorial", value: JSON.stringify(self.edition.editorial), isobject:true}, {key:"entityPages", value: JSON.stringify(self.edition.entityPages), isobject:true}], [self.config.universalBannerDriverJs ]);
				}
				$("#MEIframe").attr("srcdoc", data);  //now we wait for a message
				window.addEventListener("message", function (event){
					if (typeof event.data === "string") {
						//process it here
						let result=event.data;
						result=BrowserFunctionService.adjustResult(self, result, false, [],[]);	//just rewrite any file paths we need to deal with
						if (!self.config.standalone) self.edition.universalbanner=result;
/*						if (self.config.hasOwnProperty("ssSearch")) {
							result=result.replace('<div id="staticSearch"></div>',self.config.ssSearch);
						} */
						zip.file("edition/common/local/xml/universalbanner.xml", result);
						zip.file("edition/output/universalbanner.xml", result);
						return(callback(null));
					} else { //send a message
						return(callback("Incorrect data type returned when loading "+self.config.universalBannerTemplate));
					}
				},{once:true});
			}
		})
	}	else {//do nothinty...
		return(callback(null));
	}
}

function makeEditorialPages (self, zip, callback) {
	$("#MEProgress").html("Making Editorial HTML page");
	if (self.config.standalone && self.config.makeEditorialPages) {
		if	(!self.config.hasOwnProperty("editorialFile") || self.config.editorialFile=="" )  {
			self.edition.messages+="Non-fatal error: you have set makeEditorialPages to false but not specified a editorialFile. Check the documentation on editorialFile.\r";
			return(callback(null));
		} else {  //load the editorial file into self.edition.editorial. In non-standalone it is already there
			self.restService.http.get(self.config.editorialFile).subscribe(function(myfile) {
				if (myfile._body.indexOf("var editorial=[{")!=0) {
					return(callback("Error found reading "+self.config.editorialFile+". This file must begin with 'var editorial=[{'; see the documentation on editorialFile"));
				} else {
					eval(myfile._body);
					self.edition.editorial=editorial;
					doMakeEditorialPages(self, zip, callback);
				}
			});
		}
	} else if (self.config.standalone && !self.config.makeEditorialPages) {
		return(callback(null));
	} else if  (!self.config.standalone) {
		doMakeEditorialPages(self, zip, callback);
	}
}

function doMakeEditorialPages(self, zip, callback) { //ready to roll! 
	//first, sort editorial array into groups ready to be made into html pages
	let myEditorial=[];
	for (let i=0; i<self.edition.editorial.length; i++) {self.edition.editorial[i].processed=false;}
	for (let i=0; i<self.edition.editorial.length; i++) {
		let item=self.edition.editorial[i];
		if (!(item.key.indexOf(":")>-1 && item.key.indexOf("=")>-1)) {
			myEditorial.push(item);
		} else {
			if (!item.processed) {
				myEditorial.push([]);
				thisitem=myEditorial[myEditorial.length-1];
				item.processed=true;
				thiskey=item.key.slice(0, item.key.indexOf(":"));
				thisitem.push(item);
				for (let j=i+1; j<self.edition.editorial.length; j++) {
					let item2=self.edition.editorial[j];
					if (item2.key.indexOf(thiskey+":")>-1) {
						item2.processed=true;
						thisitem.push(item2);
					}
				}
			}
		}
	}
	if (!self.config.hasOwnProperty("firstEntity")) {
		self.config.firstEntity=self.edition.pageEntities[0].entities.filter(entity=>entity.collateable)[0].entity;
	}
	//we now have an array of things to turn into editorial html pages
	$.get(self.config.editorialTemplate, function(data){
		async.mapSeries(myEditorial, function (thisEditorial, cbedmat){ 
			let mydata=data;
			if (self.config.standalone) {
				mydata=BrowserFunctionService.customTemplates(mydata, [{key:"isstandalone", value:true, isobject: true}, {key:"shortTitle", value:self.config.shortTitle, isobject: false}, {key:"TCcommunity", value:self.config.TCCommunity, isobject: false}, {key: "TCurl", value:self.config.TCUrl, isobject:false}, {key:"currMS", value: self.config.currMS, isobject:false}, {key:"hasVBase", value: self.config.hasVBase, isobject:true}, {key:"ssSearch", value: self.config.ssSearch, isobject:true}, {key:"item", value:JSON.stringify(thisEditorial), isobject: true},{key: "view", value:"editorial", isobject:false}, {key:"universalBannerLocation", value: self.config.universalBannerLocation, isobject:false}], [self.config.editorialDriverJs, self.config.entityPagesFile, self.config.aliasesFile, self.config.indexCompareFile, self.config.collutilsJs]);
			} else {
				let banner= clean(self.edition.universalbanner);
				mydata=BrowserFunctionService.customTemplates(mydata, [{key:"isstandalone", value:false, isobject: true}, {key:"currMS", value: self.config.currMS, isobject:false}, {key:"hasVBase", value: self.config.hasVBase, isobject:true}, {key:"ssSearch", value: self.config.ssSearch, isobject:true}, {key:"item", value:JSON.stringify(thisEditorial), isobject: true},{key: "view", value:"editorial", isobject:false}, {key:"universalBanner", value: banner, isobject:false}], [self.config.editorialDriverJs, self.config.entityPagesFile, self.config.aliasesFile]);
			}
			$("#MEIframe").attr("srcdoc", mydata);  //now we wait for a message
			window.addEventListener("message", function (event){
				if (typeof event.data === "string") {
					let ssSearch=true;
					if (typeof self.config.ssSearch=="undefined") ssSearch=false;
					let str=BrowserFunctionService.adjustResult(self, event.data, false, [{key:"ssSearch", value:ssSearch, isobject: true},{key:"currMS", value: self.config.currMS, isobject:false}, {key:"universalBannerLocation", value: self.config.universalBannerLocation, isobject:false}, {key: "currEntity", value:self.config.firstEntity, isobject:false}, {key: "view", value:"editorial", isobject:false}],[self.config.editorialJs, self.config.entityPagesFile, self.config.aliasesFile]);	
					if (!Array.isArray(thisEditorial)) {
						zip.file('edition/html/editorial/menu/'+thisEditorial.key+".html", str);
					} else {
						zip.file('edition/html/editorial/commentary/'+thisEditorial[0].key.slice(0,thisEditorial[0].key.indexOf(":") )+".html", str);
					}
					cbedmat(null);
				}
			}, {once:true});
	
		}, function (err) {
			return(callback(null));
		});
	});
}

function clean(myString) { //flatten html etc into a single line
	let cleaned=myString.replaceAll("\n","");
	cleaned=cleaned.replaceAll("'","\'");
	cleaned=cleaned.replaceAll('"',"'");
	cleaned=cleaned.replaceAll('<',"xxxx");
	cleaned=cleaned.replaceAll('>',"yyyy");
	cleaned=cleaned.replaceAll('&nbsp;',"zzzz");
	return(cleaned);

}

function makeMenu(self, zip, callback) {
	$("#MEProgress").html("Creating Editorial Material menu");
	if (self.config.standalone && !self.config.makeMenu)  {
		if (!self.config.menuFile || self.config.menuFile=="")  {
			self.edition.messages+="Non-fatal error: you have set makeMenu to false but not specified a menuFile. Check the documentation on menuFile.\r";
			return(callback(null));
		} else {
			self.restService.http.get(self.config.menuFile).subscribe(function(myfile) {
				if (myfile._body.indexOf("var menu=[{")!=0) {
					return(callback("Error found reading "+self.config.menuFile+". This file must begin with 'var menu=[{'; see the documentation on menuFile"));
				} else {
					eval(myfile._body);
					self.edition.menu=menu;
					return(callback(null));
				}
			})
		} 
	} else { //do this entirely from the editorial file. For once, no async calls
		var menu=[];
		for (i=0; i<self.edition.editorial.length; i++) {
			if (menu.filter(menuItem=>menuItem.key==self.edition.editorial[i].key).length>0) {
				self.edition.messages+="Duplicate editorial items with key '"+self.edition.editorial[i].key+"' found. Check your editorialFile";
				continue;
			} else {
				if (self.edition.editorial[i].key.indexOf(":")>-1 && self.edition.editorial[i].key.indexOf("=")>-1) {// we have a hierarchy to create..
					//get the title out...
					let index=0;
					let index2=self.edition.editorial[i].key.indexOf(":", index );
					let title=self.edition.editorial[i].key.slice(index, index2);
					let titleOrig=title;
					let key=titleOrig;
					let myMenu=[];
					let aliases=self.config.aliases;
					//does it exist already?
					if (menu.filter(menuItem=>menuItem.key==key).length>0) {
						myMenu=menu.filter(menuItem=>menuItem.key==key)[0].menu;
					} else { //make a new menu entry
					//is there an alias for this entry in the entityPages structure? .. 
					// now we use only the aliases system..
						if (typeof aliases!="undefined") {
							if (key.indexOf(":")==-1 ) { //must be top entity
								if (aliases.filter(alias=>alias.topEntity==key).length>0) {
									title=aliases.filter(alias=>alias.topEntity==key)[0].alias
								}
							}
						}
	//					let epRef=self.edition.entityPages.filter(ent=>ent.entity==title)[0];
	//					if (epRef.name!="") title=epRef.name;
						menu.push({"title": title, "key":key, "menu":[]});
						myMenu=menu[menu.length-1].menu;
					}
						//we start recursing here	
					processMenu(self, myMenu, self.edition.editorial[i].key, self.edition.editorial[i].key.slice(index2+1), [titleOrig], aliases, 1);
				} else {
					menu.push({"title": self.edition.editorial[i].title, "key":self.edition.editorial[i].key});
				}
			}
		}
		zip.file('edition/output/menu.js', 'var menu='+JSON.stringify(menu));
		zip.file('edition/common/local/js/menu.js', 'var menu='+JSON.stringify(menu));
		self.edition.menu=menu;
		return(callback(null));
	}
}

function processMenu(self, menu, fullkey, thiskey, keys, aliases, index) { 
	//dig into entityPages: is there an alias for this entry? use array in keys to dig for it
	let myEntry=self.edition.entityPages, thisEntry=[], nowkey="";
	for (let i=0; i<keys.length; i++) {
		thisEntry=myEntry.filter(entity=>entity.entity==keys[i])[0];
		if (typeof thisEntry=="undefined") {
			self.edition.messages+=" Unable to find entry for "+fullkey+" in entityPages while constructing the editorial material menu ";
			return; //abort!
		} else {
			myEntry=thisEntry.subentities; // just keeping recursing till we hit the bottom
			nowkey+=thisEntry.entity+":";
		}
	}
	//what do we got at the bottom, at this level? do we have a name?
	let origTitle=thisEntry.entity;
	let title=thisEntry.name;
	//are we at the last entity?
	if (thiskey.indexOf(":")>-1) { // we have another key coming: process it
		//set up this menu...this is not terminal so do not apply sub-entity reduction
		//first, is there an entry?
		//ok, make the new key
		let nextkey=thiskey.slice(thiskey.indexOf(":")+1);
		thiskey=thiskey.slice(0,thiskey.indexOf(":"));
		keys.push(thiskey);
		nowkey+=thiskey;
		thisEntry=myEntry.filter(entity=>entity.entity==thiskey)[0];
		if (typeof thisEntry=="undefined") {
			self.edition.messages+=" Unable to find entry for "+fullkey+" in entityPages while constructing the editorial material menu ";
			return; //abort!
		} 
		let thismenu=menu.filter(function (item) {return item.key==nowkey})[0];
		if (thismenu) {
			processMenu(self, thismenu.menu, fullkey, nextkey, keys, aliases, index+1);
		} else { //is there one for this key? if so, just pass it down the tree
			let title=thisEntry.name;
			if (typeof aliases!="undefined"){
				let values=thiskey.split("=");
				if (aliases.filter(alias=>alias.key==values[0] && alias.context=="menus").length>0) {
					if (aliases.filter(alias=>alias.key==values[0] && alias.context=="menus")[0].alias=="") {
						title=values[1];
					} else {
						title=aliases.filter(alias=>alias.key==values[0] && alias.context=="menus")[0].alias+" "+values[1];
					}
				}
			}
			menu.push({"title":title, "key":nowkey, "menu":[]});
			processMenu(self, menu[menu.length-1].menu, fullkey, nextkey, keys, aliases, index+1 )
		}
	} else {
		//look for it in entityPages. We are at the last key
		nowkey+=thiskey; 
		thisEntry=myEntry.filter(entity=>entity.entity==thiskey)[0];
		if (typeof thisEntry=="undefined") {
			self.edition.messages+=" Unable to find entry for "+fullkey+" in entityPages while constructing the editorial material menu ";
			return; //abort!
		} 
		thiskey=thisEntry.name; 
		if (menu.filter(thismenu=>thismenu.key==nowkey).length>0) { // this should not happen either!
			self.edition.messages+=" Duplicate entry for "+fullkey+" in entityPages while constructing the editorial material menu ";
			return; //abort!
		}
		let title=thiskey;
		if (typeof aliases!="undefined") {
			let values=thiskey.split("=");
			if (aliases.filter(alias=>alias.key==values[0]).length>0) {
				if (aliases.filter(alias=>alias.key==values[0] && alias.context=="menus")[0].alias=="") {
					title=values[1];
				} else {
					title=aliases.filter(alias=>alias.key==values[0] && alias.context=="menus")[0].alias+" "+values[1];
				}
			}
		}
		menu.push({"title": title, "key":nowkey})
	}
}

function updateImages(self, zip, documents, callback) {
	if (typeof self.config.updatePages=="undefined" || !self.config.updatePages) {
		return(callback(null));
	} else {
		async.mapSeries(documents, function (doc, cbdocs){
			async.mapSeries(doc.pages, function(tpage, cbpage){
				$("#MEProgress").html("processing "+doc.name+"/"+tpage);
				let fileURL=self.config.sourcePagesURL+tpage+".html";
				$.get(fileURL, function (source) {
					let IIIFstring=self.config.TCimagesUrl+"/uri/urn:det:tc:usask:"+self.config.imagesCommunity+"/document="+doc.name+":folio="+tpage+"?type=IIIF&format=url";
					$.get(IIIFstring, function(newIIIF){
						//now replace ...iiifURL=
						source=source.replace(/iiifURL="[^"]+/g,"iiifURL=\""+newIIIF[0].url);
						zip.file('updateImages/'+doc.name+'/'+tpage+".html", source);
						cbpage(null);
					})
				});
			}, function (err) {
				cbdocs(null);
			});
		}, function (err) {
			callback(null);
		});
	}
}

function makeHTMLPages(self, zip, documents, pageEntities, callback) {
	if (!self.config.makePagesHtml) {
		return(callback(null));
	} else {
		$("#MEProgress").html("Creating html for document pages");
		$.get(self.config.pagesTemplate, function(data){
			async.mapSeries(documents, function (doc, cbdocs){
				let index=0;
				async.mapSeries(doc.pages, function(tpage, cbpage){ 
					let prevPage="", nextPage="";
					if (index>0) {
						prevPage=doc.pages[index-1];
					}
					if (index<doc.pages.length-1) {
						nextPage=doc.pages[index+1];
					} 
					index++;
					$("#MEProgress").html("Creating "+doc.name+"/"+tpage+".html<br>");
					let myData=data;
					let myEntity=self.edition.pageEntities.filter(witness=>witness.witness==doc.name)[0].entities.filter(page=>page.page==tpage).filter(thisEnt=>thisEnt.collateable)[0].entity;
					myEntity=myEntity.slice(myEntity.indexOf("=")+1);
					let ssSearch=true;
					if (typeof self.config.ssSearch=="undefined") ssSearch=false;
					if (self.config.standalone) {
						myData=BrowserFunctionService.customTemplates(myData, [{key:"isstandalone", value:true, isobject: true}, {key:"hasVBase", value: self.config.hasVBase, isobject:true}, {key:"ssSearch", value:ssSearch, isobject: true}, {key:"prevPage", value:prevPage, isobject: false}, {key:"nextPage", value:nextPage, isobject: false}, {key: "view", value:"transcript", isobject:false}, {key: "TCurl", value: self.config.TCUrl, isobject:false}, {key: "TCimages", value: self.config.TCimagesUrl, isobject:false}, {key: "currMS", value: doc.name, isobject:false},{key: "currPage", value: tpage, isobject:false}, {key: "imagesCommunity", value:self.config.imagesCommunity, isobject:false}, {key: "TCcommunity", value:self.config.TCCommunity, isobject:false}, {key: "currEntity", value:myEntity, isobject:false}, {key: "currEntities", value:JSON.stringify(self.config.entities), isobject:true}, {key:"universalBannerLocation", value: self.config.universalBannerLocation, isobject:false}], [self.config.pagesDriverJs, self.config.collutilsJs, self.config.witnessInfFile, self.config.pageEntitiesMinFile, self.config.entityPagesFile, self.config.aliasesFile]);
					} else {
						let banner= clean(self.edition.universalbanner);
						myData=BrowserFunctionService.customTemplates(myData, [{key:"isstandalone", value:false, isobject: true}, {key:"hasVBase", value: self.config.hasVBase, isobject:true}, {key:"ssSearch", value:ssSearch, isobject: true}, {key:"item", value:JSON.stringify(thisEditorial), isobject: true},{key: "view", value:"editorial", isobject:false}, {key:"universalBanner", value: banner, isobject:false}], [self.config.editorialDriverJs, self.config.entityPagesFile, self.config.aliasesFile]);
					}
					$("#MEIframe").attr("srcdoc", myData);  //now we wait for a message
					let start=new Date();
					window.addEventListener("message", function (event){
						if (typeof event.data === "string") {
							let ssSearch=true;
							if (typeof self.config.ssSearch=="undefined") ssSearch=false;
							let str=BrowserFunctionService.adjustResult(self, event.data, false, [{key:"ssSearch", value:ssSearch, isobject: true},{key:"universalBannerLocation", value: self.config.universalBannerLocation, isobject:false},{key: "view", value:"transcript", isobject:false}, {key: "currMS", value: doc.name, isobject:false},  {key: "currEntity", value:myEntity, isobject:false},{key: "currPage", value: tpage, isobject:false}],[self.config.pagesJs, self.config.entityPagesFile, self.config.aliasesFile, self.config.indexCompareFile]);	
							zip.file('edition/html/transcripts/'+doc.name+'/'+tpage+".html", str);
							$.get(self.edition.TCUrl+"/uri/urn:det:tc:usask:"+self.edition.TCCommunity+"/document="+doc.name+":folio="+tpage+"?type=transcript&format=xml", function(xml) {
								zip.file('edition/xml/transcripts/'+doc.name+'/'+tpage+".xml", xml);
								let end=new Date();
								console.log("Written to zip file for "+doc.name+" "+tpage+" (timer: "+(end - start)+")");
								cbpage(null);
							});
						} else {
							cbpage(null);
						}
					},{once:true});
				}, function (err) {
					cbdocs(null);
				});
			}, function (err) {
				return(callback(null));
			});
		});
	}
}



function makeEntityPages(self, zip, entities, callback) {
	$("#MEProgress").html("Processing information about entities");
	if (self.config.standalone && !self.config.makeEntityPages)  {
		if (!self.config.entityPagesFile || self.config.entityPagesFile=="")  {
			self.edition.messages+="Non-fatal error: you have set makeEntityPages to false but not specified a entityPagesFile. Check the documentation on entityPagesFile.\r";
			return(callback(null));
		} else {
			self.restService.http.get(self.config.entityPagesFile).subscribe(function(myfile) {
				if (myfile._body.indexOf("var entityPages=[{")!=0) {
					return(callback("Error found reading "+self.config.entityPagesFile+". This file must begin with 'var entityPages=[{'; see the documentation on entityPagesFile"));
				} else {
					var entityPages=[];
					eval(myfile._body);
					self.edition.entityPages=entityPages;
					return(callback(null));
				}
			})
		}
	} else { //construct from pageEntities
		let entitiesDone=[];
		let pageEnts=self.edition.pageEntities;
		for (let i=0; i<pageEnts.length; i++) {
			let witness=pageEnts[i].witness;
			let witEnts=pageEnts[i].entities;
			for (let j=0; j<witEnts.length; j++) {
				//unpack each entity to deal with embedded entities all the way down ...
				if (!entitiesDone.includes(witEnts[j].entity+"-"+witness+"-"+witEnts[j].page)) {
					entitiesDone.push(witEnts[j].entity+"-"+witness+"-"+witEnts[j].page);
					//unpack the entity and add it to our master file ...
					processEntity(entities, witEnts[j], witEnts[j].entity, witness, self);
				} else {
					continue;
				}
			}
		}
		self.edition.entityPages=entities;
		zip.file('edition/common/local/js/entityPages.js', 'var entityPages='+JSON.stringify(entities));
		zip.file('edition/output/entityPages.js', 'var entityPages='+JSON.stringify(entities));
		return(callback(null));
	} 
}

//this one recurses to any depth you need...
function processEntity(entities, witEnt, subEnt, witness, self) {
	//first, get out the entity at this level
	let thisEnt = "", nextEnt = "";
	let index=subEnt.indexOf("entity=");
	if (index>-1) { 
		thisEnt=subEnt.slice(index+7);
		let index2=thisEnt.indexOf(":");
		if (index2>-1) {
			nextEnt=thisEnt.slice(index2+1);
			thisEnt=thisEnt.slice(0, index2);
		}
	} else { //we now travel down the entities..
		let index2=subEnt.indexOf(":");
		if (index2>-1) {
			thisEnt=subEnt.slice(0,index2);
			nextEnt=subEnt.slice(index2+1);
		} else { //this must be the last one!
			thisEnt=subEnt;
		}
	}
	// now we are going to add them to the recursive entityPages ...
	//if this the lowest level and we are reducing the name .. we don't do that now
	let myEntity=entities.filter(function (obj){return obj.entity==thisEnt})[0];
	if (!myEntity) {
		let refEntity=witEnt.entity.slice(witEnt.entity.indexOf("entity=")+7);
		if (nextEnt=="") { //no need for a VMap or subentries when we are at last entry
			entities.push({"entity":thisEnt, "name":thisEnt, hasCollation: witEnt.hasCollation, hasCommentary:witEnt.hasCommentary, refEntity: refEntity, "witnesses":[]}); 
		} else {
			entities.push({"entity":thisEnt,  "name":thisEnt, "witnesses":[], "subentities":[], "vMap":thisEnt+".map"});
		}
		myEntity=entities[entities.length-1];
	} else {  //we have a nextEnt... we need to be sure we have a subentities to take it 
		if (nextEnt!="" && !myEntity.hasOwnProperty("subentities"))  {
			myEntity.subentities=[];
		}
	}
	let myWitness=myEntity.witnesses.filter(function (obj){return obj.name==witness})[0];
	if (!myWitness) {
		myEntity.witnesses.push({"name": witness, "pages":[]});
		myWitness=myEntity.witnesses[myEntity.witnesses.length-1];
	}
	if (!myWitness.pages.includes(witEnt.page)) myWitness.pages.push(witEnt.page);
	//do we have a subentity??
	if (nextEnt!="") processEntity(myEntity.subentities, witEnt, nextEnt, witness, self);
}



function makeCompare (self, zip, entities, callback) {
	if (self.config.standalone && !self.config.makeCompare) {
		return(callback(null));
	} else {
		$("#MEProgress").html("Creating html for compare views");
   		$.get(self.config.compareTemplate, function(myfile){
   			let entitiesArray=[];
  			convertEntityPages(self.edition.entityPages, entitiesArray);
			if (typeof self.config.startCompare!="undefined") {
  				let ci=entitiesArray.findIndex(entity=>entity==self.config.startCompare);
  				if (ci>-1) entitiesArray.splice(0, ci);
  			}
  			if (typeof self.config.endCompare!="undefined") {
  				let ci=entitiesArray.findIndex(entity=>entity==self.config.endCompare);
  				if (ci>-1) entitiesArray.splice(ci+1);
  			}
			let ssSearch=self.config.ssSearch;
			let hasVBase=self.config.hasVBase;
			let currMS=self.config.currMS;
  			let index=0, currIndex=0; compareIndex=[];
  			let endInScope=false;
  			if (typeof self.config.entitiesLimit!="undefined") {
  				entitiesArray.splice(self.config.entitiesLimit);
  			}
  			async.mapSeries(entitiesArray, function(thisEntity, eaCB){
  				if (index%self.config.makeCompareElements!=0 || endInScope) {
  					index++;
  					compareIndex.push({entity: thisEntity, index: entitiesArray[currIndex]});
  					eaCB(null);
				}  else {
					currIndex=index;
					let skip=false;
					compareIndex.push({entity: thisEntity, index: thisEntity});
					if (typeof self.config.startCompare!="undefined") {
						let startIndex=entitiesArray.indexOf(self.config.startCompare);
						if (index<startIndex) {
							eaCB(null);
							skip=true;
						}
					}
					if (typeof self.config.endCompare!="undefined") {
						let endIndex=entitiesArray.indexOf(self.config.endCompare);
						if (index>endIndex) {
							eaCB(null);
							skip=true;
						}
					}
					if (!skip) {
						let srcdoc=myfile, newCurr=[];
						let currEntity=thisEntity;
						let prevCompare="", nextCompare="";
						if (index>0) {
							prevCompare=entitiesArray[index-self.config.makeCompareElements];
						} //next compare is a bit trickier! set endInScope true when we are nearing the last element
						if (index>=entitiesArray.length-(self.config.makeCompareElements*2)) {
							self.config.makeCompareElements=entitiesArray.length-index;
							endInScope=true;
						} else {
							nextCompare=entitiesArray[index+self.config.makeCompareElements];
						} 
						//but might not be in this one...
						currMS=resetCurrMS(currMS, currEntity, self.edition.entityPages);
						let folder=currEntity.slice(0, currEntity.lastIndexOf(":"));
						let filename=currEntity.slice(currEntity.lastIndexOf(":")+1);
						$("#MEProgress").html("Creating compare for "+currEntity);
						let mydata="", 	currEntities=[]; 
						if (self.config.standalone) {
							for (let i=index; i<index+self.config.makeCompareElements && i<entitiesArray.length; i++) {
								currEntities.push(entitiesArray[i]);
							}
							mydata=BrowserFunctionService.customTemplates(srcdoc, [{key:"isstandalone", value:true, isobject: true}, {key:"ssSearch", value:ssSearch, isobject: true}, {key:"TCcommunity", value:self.config.TCCommunity, isobject: false}, {key:"imagesCommunity", value:self.config.imagesCommunity, isobject: false},  {key:"currPage", value:self.config.currPage, isobject: false}, {key:"TCimagesUrl", value:self.config.TCimagesUrl, isobject: false}, {key: "TCurl", value:self.config.TCUrl, isobject:false}, {key: "view", value:"compare", isobject:false},{key:"universalBannerLocation", value: self.config.universalBannerLocation, isobject:false},  {key:"hasVBase", value: self.config.hasVBase, isobject:true}, {key:"currEntity", value: currEntity, isobject:false},  {key:"currMS", value: currMS, isobject:false}, {key:"prevCompare", value: prevCompare, isobject:false}, {key:"nextCompare", value: nextCompare, isobject:false}, {key:"currEntities", value: JSON.stringify(currEntities), isobject:true}], [self.config.compareDriverJs, self.config.collutilsJs, self.config.entityPagesFile, self.config.entityPagesFile, self.config.aliasesFile, self.config.pageEntitiesMinFile]); 
						} else {
							let banner = clean(self.edition.universalbanner);
							mydata=BrowserFunctionService.customTemplates(srcdoc, [{key:"isstandalone", value:false, isobject: true}, {key:"ssSearch", value:ssSearch, isobject: true}, {key:"community", value:self.config.TCCommunity, isobject: false}, {key: "TCurl", value:self.config.TCUrl, isobject:false}, {key: "view", value:"compare", isobject:false}, {key:"universalBanner", value: banner, isobject:false}, {key:"hasVBase", value: self.config.hasVBase, isobject:true}, {key:"currEntity", value: currEntity, isobject:false},  {key:"currMS", value: currMS, isobject:false}, {key:"prevCompare", value: prevCompare, isobject:false}, {key:"nextCompare", value: nextCompare, isobject:false}, {key:"currEntities", value: JSON.stringify(currEntities), isobject:true}], [self.config.collationDriverJs, self.config.collutilsJs,  self.config.entityPagesFile, self.config.aliasesFile]);
						}
						$("#MEIframe").attr("srcdoc", mydata);  //now we wait for a message
						let start=new Date();
						index++;
						window.addEventListener("message", function (event){
							if (typeof event.data === "string") {
								let ssSearch=true;
								if (typeof self.config.ssSearch=="undefined") ssSearch=false;
								let str=BrowserFunctionService.adjustResult(self, event.data, false, [{key:"community", value:self.config.TCCommunity, isobject: false}, {key:"ssSearch", value:ssSearch, isobject: true},{key:"universalBannerLocation", value: self.config.universalBannerLocation, isobject:false},{key: "view", value:"compare", isobject:false}, {key: "currMS", value: currMS, isobject:false},  {key: "currEntity", value:currEntity, isobject:false},{key: "currPage", value: self.config.currPage, isobject:false}, {key:"currEntities", value: JSON.stringify(currEntities), isobject:true}],[self.config.compareJs, self.config.entityPagesFile, self.config.aliasesFile, self.config.pageEntitiesMinFile, self.config.collutilsJs, self.config.indexCompareFile]);	
								zip.file('edition/html/compare/'+folder+'/'+filename+".html", str);
								eaCB(null);
							}
						}, {once: true});
					}
				}
  			}, function (err) {
  				zip.file('edition/output/indexCompare.js', 'var compareIndex='+JSON.stringify(compareIndex));
				return(callback(err));
			});
   		});
	}
}

function convertEntityPages (source, dest) {
	for (let i=0; i<source.length; i++) {
		if (typeof source[i].subentities == "undefined") {
			if (source[i].hasCollation) {
				dest.push(source[i].refEntity);
			}
		} else {
			convertEntityPages(source[i].subentities, dest);
		}
	}
}

function resetCurrMS(currMS, currEntity, source) {
	let entities=source, nextEntities=[];
	let entityParts=currEntity.split(":");
	entities=entities.filter(myEntity=>myEntity.entity==entityParts[0]);
	for (i=1; entities && nextEntities; i++) {
		thisVal=entityParts[i];
		let nextVal=null;
		for (let j=0; j<entities.length; j++) {
			if (i<entityParts.length-1) nextVal=entityParts[i+1];
			nextEntities=getNextEntities(entities, thisVal, nextVal);
			if (!nextEntities) { 
				if (entities[j].subentities.filter(line=>line.entity==entityParts[entityParts.length-1]).length>0) {
					witnesses=entities[j].subentities.filter(line=>line.entity==entityParts[entityParts.length-1])[0].witnesses;
					if (witnesses.filter(wit=>wit.name=="Hg").length>0) {
						return("Hg");
					} else if (witnesses.filter(wit=>wit.name=="El").length>0) {
						return("El");
					} else if (witnesses.filter(wit=>wit.name=="Ch").length>0) {
						return("Ch");
					} else {
						return (witnesses[1].name)
					}
				}
			}
		}
	}
	
	
}

function getNextEntities (entities, val, nextval) { //cycle through recursive entities
	if (entities.filter(key=>key.entity==val).length==0) {
		return(null);
	}
	let nextEntity=entities.filter(key=>key.entity==val)[0];
	//check that there is a child or not for the nextvalue
	if (nextEntity.hasOwnProperty("subentities")) {
		if (nextEntity.subentities.filter(sub=>sub.entity==nextval).length>0) {
			let thisEntity=nextEntity.subentities.filter(sub=>sub.entity==nextval)[0];
			if (thisEntity.hasOwnProperty("subentities")) {
				entities=nextEntity.subentities;
			} else {
				entities=null;
			}
		} else {
			entities=null;
		}
	}  else { //force stop before last entities
		entities=null;
	}
	return(entities)
}

module.exports = CommunityMakeEditionComponent;
