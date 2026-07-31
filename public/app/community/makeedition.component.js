var UIService = require('../services/ui')
, config = require('../config')
, async = require('async')
, $ = require('jquery')
, DocService = require('../services/doc')
, RESTService = require('../services/rest')
, Router = ng.router.Router
, JSZip = require('jszip')
, fs = require('fs')
//, fspromises = require('fspromises')
, path = require('path')
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
		function(arguments, cb1) { //not sure what this does lol
			updateImages(self, zip, self.edition.documents, function callback(result) {
				cb1(result,[]);
			});
		},
		function(arguments, cb1) {
			makeImagesFile(self, zip, self.edition.documents, function callback(result) {
				cb1(result,[]);
			});
		},
		function (arguments, cb1) { //write the compare files
			checkEntities(self, function callback(result) {
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
		},
		function (arguments, cb1) { //use for one-off conversion jobs
			makeConversion(self, zip, function callback(result){
				cb1(result, []);
			})
		},
		function (arguments, cb1) { //move required images to iiif folder
			copyImages(self, zip, function callback(result){
				cb1(result, []);
			})
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

function copyImages (self, zip, callback) {
 	if (self.config.copyImages) {
 		errorStr="";
 		async.mapSeries(self.config.documents, function (mydocument, cbdocs){ 
 			$("#MEProgress").html("Copying document "+mydocument.name[0]);
 		    var boo=1;
 		    async.mapSeries(mydocument.pages, function (mypage, cbpages) {
 		    	$("#MEProgress").html("Copying page "+mydocument.name+" "+mypage[0]);
 		    	//copy it here
 		    	$.post(self.config.TCUrl+'/api/copyFiles?source=/Users/pmr906/venv/TCangular/tc/public/app/data/tcimages/CTP2/'+mydocument.name[0]+"/"+mypage[0]+"&dest="+self.config.imagesDestination+"/"+mydocument.name[0]+"/"+mypage[0], function (json) {
 		    		if (json.success==0) {
 		    			console.log("error in loading "+mypage[0]);
 		    			$("#MEProgress").html("Error in copying page "+mydocument.name+" "+mypage[0]);
// 		    			errorStr+="Error in "+mydocument.name+" "+mypage[0]+" ("+json.message+")\n";
						errorStr+="Error in "+mydocument.name+" "+mypage[0];
 		    		};
 		    		cbpages(null);
 		    	});
		    }, function (err) {
 		    	cbdocs(null);
 		    });
 		}, function (err) {
 			if (errorStr=="") {
 				zip.file('edition/output/noerrors.txt', "No errors");
 			} else {
 				zip.file('edition/output/errors.txt', errorStr);
 			}
 			return(callback(null));
 		})
 	} else {
		return(callback(null));
	}
};

function makeConversion(self, zip, callback) {
	if (self.config.shortTitle!="Commedia") { return(callback(null));}
	//ok lets convert!!! start by getting the linesInf file
	if (self.config.gatherApparatus) {
	    let fullApp="<div>\r";
		$.get(self.config.srcCantos, function (myfile) {
			eval(myfile._body);   //gets us cantoLines
			async.mapSeries(cantoLines, function (canto, cbcanto){ 
			    let mycanticle=canto.canto.slice(0,2);
				let mycanto=canto.canto.slice(2);
				$.get(self.config.srcApparatus+"/"+mycanticle+"/"+mycanto+"/"+"DC3regcollapp.xml", function(srcxml) {
					let serializer = new XMLSerializer();
					let xmlString = serializer.serializeToString(srcxml);				
					fullApp+=xmlString+"\r";
					console.log("processing "+mycanticle+mycanto);
					return(cbcanto(null));
				});
			
			}, function (err) {
			   zip.file('fullCommedia.xml', fullApp);								
				return(callback(null));
			})
		})
	} else if (self.config.convertApparatus) {
		$.get(self.config.srcCantos, function (myfile) {
			eval(myfile._body);   //gets us cantoLines
			let index=0;
			if (self.config.compareWordCount) {
				let mismatches="";
				async.mapSeries(cantoLines, function (canto, cbcanto){ 
					let mycanticle=canto.canto.slice(0,2);
					let mycanto=canto.canto.slice(2);
					console.log("processing	 "+mycanticle+" "+mycanto);
					async.waterfall([
						function(cb) {
							$.get(self.config.destDir+"/"+mycanticle+"/"+mycanto+"/PET.xml", function (myfile) {
						 		cb(null,[myfile]);
						 	});
						},
						function(args, cb) {
							$.get(self.config.destDir+"/"+mycanticle+"/"+mycanto+"/ING-coll.xml", function (myfile) {
								args[1]=myfile;
						 		cb(null, args);
						 	});
						}
					], function (err, result){
						for (let i=1; i<=parseInt(canto.lines); i++) {
							let lastPET=$(result[0]).find("#"+mycanticle+"-C"+mycanto+"-"+i+"-PET").find("w").last().attr("n");
							let lastING=$(result[1]).find("#"+mycanticle+"-C"+mycanto+"-"+i+"-ING-coll").find("w").last().attr("n");
							if (lastPET!=lastING) {
								console.log("word mismatch "+mycanticle+" "+mycanto+", "+i+" (PET "+lastPET+", ING "+lastING);
								mismatches+=mycanticle+" "+mycanto+", "+i+" (PET "+lastPET+", ING "+lastING+")\r";
							}
						}
						return(cbcanto(null));
					})
				}, function (err) {
					zip.file("edition/mismatches.txt", mismatches);
					return(callback(null));
				});
			} else {
				async.mapSeries(cantoLines, function (canto, cbcanto){ 
				//one canticle at a time!
				//we use 
				let mycanticle=canto.canto.slice(0,2);
				let mycanto=canto.canto.slice(2);
				console.log("	 "+mycanticle+" "+mycanto);
				if (mycanticle!="PA") return(cbcanto(null));
				//we are going to copy all the existing transcript files too
				//once we have generated apparatus and ING files: we may be editing those. 
				//if addIngIN-coll and/or addIngIN-display is true: we create new display and/or collateable files for ING for IN (then PU PA)
				// hasIngIN-coll and/or hasIngIN-display is true: we import existing ING files from dest (then PU PA)
				// useExisting: once we have done initial conversion of transcript and collation files, get them from DEST
				//and import all other files from existing DEST folder 
				//
					async.waterfall([
						function (cb) { //convert the ING transcription display and collateables for ING
							 if (mycanto==1) {
								if (mycanticle=="IN" && self.config.addIngIN_coll) {
									convertEdition(zip, self, self.config.collateableSourceIngIN, mycanticle, "ING", 34, "coll", cb );
								} else if (mycanticle=="IN" && self.config.addIngIN_display) {
									convertEdition(zip, self, self.config.displaySourceIngIN, mycanticle, "ING", 34, "display", cb );							
								} else if (mycanticle=="PU" && self.config.addIngPU_coll) {
									convertEdition(zip, self, self.config.collateableSourceIngPU, mycanticle, "ING", 33, "coll", cb );							
								} else if (mycanticle=="PU" && self.config.addIngPU_display) {
									convertEdition(zip, self, self.config.displaySourceIngPU, mycanticle, "ING", 33, "display", cb );							
								} else if (mycanticle=="PA" && self.config.addIngPA_coll) {
									convertEdition(zip, self, self.config.collateableSourceIngPA, mycanticle, "ING", 33, "coll", cb );							
								} else if (mycanticle=="PA" && self.config.addIngPA_display) {
									convertEdition(zip, self, self.config.displaySourceIngPA, mycanticle, "ING", 33, "display", cb );							
								} else {
								  cb(null, []);
								}
							} else {
								cb(null, []);
							}
						},
						function (arguments, cb) {  //rewrite the collation
							if (!self.config.useExistingConversion) {
								$.get(self.config.srcTranscripts+"/"+mycanticle+"/"+mycanto+"/"+"DCregcollapp.xml", function(srcxml) {
									let lines=$(srcxml).find("div[type='L']")
									for (let i=0; i<lines.length; i++) {
										let apps = $(lines[i]).find("app");
										for (let j=0; j<apps.length; j++) {
											let witPET=$(apps[j]).find("ref[n='PET']")[0];
											if (witPET) {
												let from=$(witPET).attr("from");
												let to=$(witPET).attr("to");
												let witWIT=$(witPET).parent("wit");
												let witnum=Number($(witWIT).attr("n"))
												let witN=(witnum+1).toString();
												$(witWIT).attr("n", witN);
												$(witWIT).append(" "+"<ref from='"+from+"' to='"+to+"' n='ING'>ING</ref>");				
											} else {
												console.log("this cannot happen lol "+mycanticle+" "+mycanto+$(lines[j]).attr("n"));
											}
										}
									}
									//write out this canto
									let serializer = new XMLSerializer();
									let htmlString = serializer.serializeToString(srcxml);
									zip.file('commedia/xml/'+mycanticle+'/'+mycanto+'/DC3regcollapp.xml', htmlString);
	//								console.log("Done apparatus "+mycanticle+" "+mycanto);
									cb(null, []);
								})
							} else {
								$.get(self.config.destDir+"/"+mycanticle+"/"+mycanto+"/"+"DC3regcollapp.xml", function(srccoll) {
									zip.file("commedia/xml/"+mycanticle+"/"+mycanto+"/DC3regcollapp.xml", $(srccoll).find("div")[0].outerHTML);
									cb(null,[]);
								});
							} 
						},
						function (arguments, cb) {//get the transcript file, Ash first
							if (!self.config.useExistingConversion) { 
								zip.file("commedia/xml/"+mycanticle+"/"+mycanto+"/Ash.xml", BrowserFunctionService.urlToPromise(self.config.srcTranscripts+"/"+mycanticle+"/"+mycanto+"/"+"Ash.xml", cb), {binary:true});
							} else {
							/*	$.get(self.config.destDir+"/"+mycanticle+"/"+mycanto+"/"+"Ash.xml", function(srctxt) {
									zip.file("commedia/xml/"+mycanticle+"/"+mycanto+"/Ash.xml", $(srctxt).find("div")[0].outerHTML);
									cb(null,[]);
								}); */
								zip.file("commedia/xml/"+mycanticle+"/"+mycanto+"/Ash.xml", BrowserFunctionService.urlToPromise(self.config.destDir+"/"+mycanticle+"/"+mycanto+"/"+"Ash.xml", cb), {binary:true});
							}
						},
						function (arguments, cb) {//get the transcript file, FS 
							if (!self.config.useExistingConversion) { 
								zip.file("commedia/xml/"+mycanticle+"/"+mycanto+"/FS.xml", BrowserFunctionService.urlToPromise(self.config.srcTranscripts+"/"+mycanticle+"/"+mycanto+"/"+"FS.xml", cb), {binary:true});
							} else {
								zip.file("commedia/xml/"+mycanticle+"/"+mycanto+"/FS.xml", BrowserFunctionService.urlToPromise(self.config.destDir+"/"+mycanticle+"/"+mycanto+"/"+"FS.xml", cb), {binary:true});
							}
						},
						function (arguments, cb) {//get the transcript file, Ham 
							if (!self.config.useExistingConversion) { 
								zip.file("commedia/xml/"+mycanticle+"/"+mycanto+"/Ham.xml", BrowserFunctionService.urlToPromise(self.config.srcTranscripts+"/"+mycanticle+"/"+mycanto+"/"+"Ham.xml", cb), {binary:true});
							} else {
								zip.file("commedia/xml/"+mycanticle+"/"+mycanto+"/Ham.xml", BrowserFunctionService.urlToPromise(self.config.destDir+"/"+mycanticle+"/"+mycanto+"/"+"Ham.xml", cb), {binary:true});						
							}
						},
						function (arguments, cb) {//get the transcript file, LauSC 
							if (!self.config.useExistingConversion) { 
								zip.file("commedia/xml/"+mycanticle+"/"+mycanto+"/LauSC.xml", BrowserFunctionService.urlToPromise(self.config.srcTranscripts+"/"+mycanticle+"/"+mycanto+"/"+"LauSC.xml", cb), {binary:true});
							} else {
								zip.file("commedia/xml/"+mycanticle+"/"+mycanto+"/LauSC.xml", BrowserFunctionService.urlToPromise(self.config.destDir+"/"+mycanticle+"/"+mycanto+"/"+"LauSC.xml", cb), {binary:true});
							}
						},
						function (arguments, cb) {//get the transcript file, Mart 
							if (!self.config.useExistingConversion) { 
								zip.file("commedia/xml/"+mycanticle+"/"+mycanto+"/Mart.xml", BrowserFunctionService.urlToPromise(self.config.srcTranscripts+"/"+mycanticle+"/"+mycanto+"/"+"Mart.xml", cb), {binary:true});
							} else {
								zip.file("commedia/xml/"+mycanticle+"/"+mycanto+"/Mart.xml", BrowserFunctionService.urlToPromise(self.config.destDir+"/"+mycanticle+"/"+mycanto+"/"+"Mart.xml", cb), {binary:true});
							}
						},
						function (arguments, cb) {//get the transcript file, PET 
							if (!self.config.useExistingConversion) { 
								zip.file("commedia/xml/"+mycanticle+"/"+mycanto+"/PET.xml", BrowserFunctionService.urlToPromise(self.config.srcTranscripts+"/"+mycanticle+"/"+mycanto+"/"+"PET.xml", cb), {binary:true});
							} else {
								zip.file("commedia/xml/"+mycanticle+"/"+mycanto+"/PET.xml", BrowserFunctionService.urlToPromise(self.config.destDir+"/"+mycanticle+"/"+mycanto+"/"+"PET.xml", cb), {binary:true});
							}
						},
						function (arguments, cb) {//get the transcript file, Rb 
							if (!self.config.useExistingConversion) { 
								zip.file("commedia/xml/"+mycanticle+"/"+mycanto+"/Rb.xml", BrowserFunctionService.urlToPromise(self.config.srcTranscripts+"/"+mycanticle+"/"+mycanto+"/"+"Rb.xml", cb), {binary:true});
							} else {
								zip.file("commedia/xml/"+mycanticle+"/"+mycanto+"/Rb.xml", BrowserFunctionService.urlToPromise(self.config.destDir+"/"+mycanticle+"/"+mycanto+"/"+"Rb.xml", cb), {binary:true});
							}
						},
						function (arguments, cb) {//get the transcript file, Triv 
							if (!self.config.useExistingConversion) { 
								zip.file("commedia/xml/"+mycanticle+"/"+mycanto+"/Triv.xml", BrowserFunctionService.urlToPromise(self.config.srcTranscripts+"/"+mycanticle+"/"+mycanto+"/"+"Triv.xml", cb), {binary:true});
							} else {
								zip.file("commedia/xml/"+mycanticle+"/"+mycanto+"/Triv.xml", BrowserFunctionService.urlToPromise(self.config.destDir+"/"+mycanticle+"/"+mycanto+"/"+"Triv.xml", cb), {binary:true});
							}
						},
						function (arguments, cb) {//get the transcript file, Urb 
							if (!self.config.useExistingConversion) { 
								zip.file("commedia/xml/"+mycanticle+"/"+mycanto+"/Urb.xml", BrowserFunctionService.urlToPromise(self.config.srcTranscripts+"/"+mycanticle+"/"+mycanto+"/"+"Urb.xml", cb), {binary:true});
							} else {
								zip.file("commedia/xml/"+mycanticle+"/"+mycanto+"/Urb.xml", BrowserFunctionService.urlToPromise(self.config.destDir+"/"+mycanticle+"/"+mycanto+"/"+"Urb.xml", cb), {binary:true});
							}  
						},
						function (arguments, cb) {//get the ING collation file, 
							if (mycanticle=="IN" && self.config.useExistingConversion && self.config.hasIngIN_coll) { 
								zip.file("commedia/xml/"+mycanticle+"/"+mycanto+"/ING-coll.xml", BrowserFunctionService.urlToPromise(self.config.destDir+"/"+mycanticle+"/"+mycanto+"/"+"ING-coll.xml", cb), {binary:true});
							} else {
								cb(null,[]);
							}
						},
						function (arguments, cb) {//get the ING display file, 
							if (mycanticle=="IN" && self.config.useExistingConversion && self.config.hasIngIN_display) { 
								zip.file("commedia/xml/"+mycanticle+"/"+mycanto+"/ING-display.xml", BrowserFunctionService.urlToPromise(self.config.destDir+"/"+mycanticle+"/"+mycanto+"/"+"ING-display.xml", cb), {binary:true});
							} else {
								cb(null,[]);
							}
						},
						function (arguments, cb) {//get the PU collation file, 
							if (mycanticle=="PU" && self.config.useExistingConversion && self.config.hasIngPU_coll) { 
								zip.file("commedia/xml/"+mycanticle+"/"+mycanto+"/ING-coll.xml", BrowserFunctionService.urlToPromise(self.config.destDir+"/"+mycanticle+"/"+mycanto+"/"+"ING-coll.xml", cb), {binary:true});
							} else {
								cb(null,[]);
							}
						},
						function (arguments, cb) {//get the PU display file, 
							if (mycanticle=="PU" && self.config.useExistingConversion && self.config.hasIngPU_display) { 
								zip.file("commedia/xml/"+mycanticle+"/"+mycanto+"/ING-display.xml", BrowserFunctionService.urlToPromise(self.config.destDir+"/"+mycanticle+"/"+mycanto+"/"+"ING-display.xml", cb), {binary:true});
							} else {
								cb(null,[]);
							}
						},
						function (arguments, cb) {//get the PU display file, 
							if (mycanticle=="PA" && self.config.useExistingConversion && self.config.hasIngPA_display) { 
								zip.file("commedia/xml/"+mycanticle+"/"+mycanto+"/ING-display.xml", BrowserFunctionService.urlToPromise(self.config.destDir+"/"+mycanticle+"/"+mycanto+"/"+"ING-display.xml", cb), {binary:true});
							} else {
								cb(null,[]);
							}
						},
						function (arguments, cb) {//get the PU display file, 
							if (mycanticle=="PA" && self.config.useExistingConversion && self.config.hasIngPA_coll) { 
								zip.file("commedia/xml/"+mycanticle+"/"+mycanto+"/ING-coll.xml", BrowserFunctionService.urlToPromise(self.config.destDir+"/"+mycanticle+"/"+mycanto+"/"+"ING-coll.xml", cb), {binary:true});
							} else {
								cb(null,[]);
							}
						}
					], function (err) {
						return(cbcanto(null));
					})
				}, function (err) {
					return(callback(null));	
				});
			}
		});
	} else if (self.config.convertWitness) { //make html files for the witnesss
		//get the js file
		if (self.config.witness!="") {
			let myArray=[];
//if we are making an edition
			self.restService.http.get("/app/data/makeEdition/common/Commedia3/js/cantoLines.js").subscribe(function(myfile) {	
//if we are making a ms transcript
//			self.restService.http.get("/app/data/makeEdition/common/Commedia3/js/"+self.config.witness+".js").subscribe(function(myfile) {
			if (myfile._body.indexOf("var cantoLines=[")!=0) {
//			if (myfile._body.indexOf("var "+self.config.witness+"=[")!=0) {
					return(callback("Error found reading "+self.config.witness+".js. This file must begin with 'var "+self.config.witness+" =['"));
				} else {
					eval(myfile._body);
					if (self.config.witness=="PET"||self.config.witness=="FS"||self.config.witness=="ING") {
						myArray=eval("cantoLines");
					} else {
						myArray=eval(self.config.witness);		
					}			
					$.get("/app/data/makeEdition/common/Commedia3/indexTranscript.html", function(data){
						let index=0, endRb=0, startRbBraid=0;
						if (self.config.witness=="Rb") {
						    endRb=eval("Rb").findIndex(page=>page.end[1]==self.config.endRb[0]&&page.end[2]==self.config.endRb[1]&&page.end[3]==self.config.endRb[2]);
							startRbBraid=endRb+1;
						}
						async.mapSeries(myArray, function (page, cbpages) {
							let myData=data;
							let mycanticle="", mycanto="";
							if (self.config.witness=="PET"||self.config.witness=="FS"||self.config.witness=="ING") {
								mycanticle=page.canto.slice(0,2);
								mycanto=page.canto.slice(2);
								$("#MEProgress").html("Creating html for document "+self.config.witness+", "+mycanticle+" "+mycanto);
							} else {
								if (page.init[1]==1) {mycanticle="IN"} else if (page.init[1]==2) {mycanticle="PU"}  else if (page.init[1]==3) {mycanticle="PA"};
								mycanto=page.init[2];
								$("#MEProgress").html("Creating html for document page "+page.page);
							}
// 	  						if (index<startRbBraid) {
//							if (index>endRb) {
							if (index>10000) { //just keep processing
//							if (page.page!="80v") {
//							if (index>6) {
								cbpages(null, []);
								index++;
							} else {	
								let prevPage="", nextPage="", currCanticle=1;		
								if (mycanticle=="IN") {currCanticle=1} else if (mycanticle=="PU") {currCanticle=2} else (currCanticle=3);
								if (self.config.witness=="Rb") {
									if (index!=0) {
										prevPage=myArray[index-1].page;
									}
									if (index!=myArray.length-1) {
										nextPage=myArray[index+1].page;
									}
									if (index>endRb) { 
										myData=BrowserFunctionService.customTemplates(myData, [ {key:"currCanto", value: mycanto, isobject:false}, {key:"currCanticle", value: currCanticle, isobject:false}, {key:"inBraidense", value: true, isobject:true}, {key:"currMS", value: self.config.witness, isobject:false},{key:"prevPage", value:prevPage, isobject: false}, {key:"nextPage", value:nextPage, isobject: false},  {key:"thisPage", value:page.page, isobject: false}, {key:"currIndex", value:index, isobject: false}],[]);
									} else {
										myData=BrowserFunctionService.customTemplates(myData, [ {key:"currCanto", value: mycanto, isobject:false},  {key:"currCanticle", value: currCanticle, isobject:false}, {key:"inBraidense", value: false, isobject:true}, {key:"currMS", value: self.config.witness, isobject:false},{key:"prevPage", value:prevPage, isobject: false}, {key:"nextPage", value:nextPage, isobject: false},  {key:"thisPage", value:page.page, isobject: false}, {key:"currIndex", value:index, isobject: false}],[]);				
									}
								} else if (self.config.witness=="PET"||self.config.witness=="FS"||self.config.witness=="ING") { 
									if (index!=0) {
										prevPage=myArray[index-1].canto;
									}
									if (index!=myArray.length-1) {
										nextPage=myArray[index+1].canto;
									}
									myData=BrowserFunctionService.customTemplates(myData, [ {key:"currMS", value: self.config.witness, isobject:false}, {key:"prevPage", value:prevPage, isobject: false}, {key:"nextPage", value:nextPage, isobject: false},  {key:"thisPage", value:page.page, isobject: false}, {key:"currIndex", value:index, isobject: false}, {key:"currCanticle", value:currCanticle, isobject: false},  {key:"currCanto", value:mycanto, isobject: false},  {key:"currLine", value:"1", isobject: false}],[]);
								} else {
									if (index!=0) {
										prevPage=myArray[index-1].page;
									}
									if (index!=myArray.length-1) {
										nextPage=myArray[index+1].page;
									}
									myData=BrowserFunctionService.customTemplates(myData, [ {key:"currCanto", value: mycanto, isobject:false}, {key:"currCanticle", value: currCanticle, isobject:false}, {key:"currMS", value: self.config.witness, isobject:false},{key:"prevPage", value:prevPage, isobject: false}, {key:"nextPage", value:nextPage, isobject: false},  {key:"thisPage", value:page.page, isobject: false}, {key:"currIndex", value:index, isobject: false}],[]);
								}
								index++;
								$("#MEIframe").attr("srcdoc", myData); 
								window.addEventListener("message", function (event){ 
									if (typeof event.data === "string") {	
										let str="";
										if (self.config.witness=="PET"||self.config.witness=="FS"||self.config.witness=="ING") {
											str=adjustCommedia(self, event.data, false, [{key:"currMS", value: self.config.witness, isobject: false},{key:"currPage", value: mycanto, isobject: false}, {key:"currCanticle", value: mycanticle, isobject: false},{key:"currCanto", value:mycanto, isobject: false}, {key:"currIndex", value:index-1, isobject: false},  {key:"currLine", value:"1", isobject: false}],["../../../js/commedia3transcript.js"]);
											zip.file("edition/html/transcripts/"+self.config.witness+"/"+page.canto+".html", str);	
										
										} else {
											str=adjustCommedia(self, event.data, false, [{key:"currMS", value: self.config.witness, isobject: false},{key:"currPage", value: page.page, isobject: false}, {key:"currCanticle", value: page.init[1], isobject: false},{key:"currCanto", value: page.init[2], isobject: false},{key:"currLine", value: page.init[3], isobject: false}, {key:"currIndex", value:index-1, isobject: false}],["../../../js/commedia3transcript.js"]);
											zip.file("edition/html/transcripts/"+self.config.witness+"/"+page.page+".html", str);	
										}
										cbpages(null, []);
									}
								}, {once: true});
							}
						}, function (err) {
							console.log("processed "+self.config.witness)
							return(callback(null));	
						})
					})
				}
			})
		} else {
			return(callback(null));	
		}
	}
}

function convertEdition(zip, self, srcfile, canticle, edition, nCantos, mode, cb) {
	$.get(srcfile, function(srcIng) {
		let newCanto='';
		for (let canto=1; canto<=nCantos; canto++) {
			let colltype="collation";
			if (mode=="display") colltype="display";
			newCanto='<div type="witcanto" n="'+edition+'-coll">\r<note type="edcom">'+edition+' for '+colltype+'</note>\r'
			newCanto+='<div type="canto" id="'+canticle+'-'+canto+'-'+edition+'-'+mode+'" n="'+edition+'-'+mode+'">\r';
			let clines=$(srcIng).find('l[id^="'+canticle+'-C'+canto+'-"]');
			for (let i=0; i<clines.length; i++) {
				newCanto+='<l id="'+canticle+'-C'+canto+'-'+$(clines[i]).attr("n")+'-'+edition+'-'+mode+'" n="'+$(clines[i]).attr("n")+'">';
				let srcHTML=$(clines[i]).html();
				let words=srcHTML.trim().split(" ");
				let newSrc="";
				for (let j=0; j<words.length; j++) {
					newSrc+='<w n="'+(j+1)+'">'+words[j]+'</w>';
					if (j<words.length-1) newSrc+=" ";
				}
				newCanto+=newSrc+'</l>\r'; 
			} 
			newCanto+="</div>\r</div>";
			//add this to the zip file
//									console.log("makeing ING coll"+mycanticle+" "+canto)
			zip.file("commedia/xml/"+canticle+"/"+canto+"/"+edition+"-"+mode+".xml", newCanto);
		}
		cb(null, []);
	}) 
}

function loadBaseFiles(zip, self, callback) {
  if (self.config.shortTitle=="Commedia") { return(callback(null));}
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
	 function(arguments, cb) {
		self.restService.http.get('/app/data/makeEdition/common/core/js/compareJs.js').subscribe(function(myfile) {
			zip.file('edition/common/core/js/compareJs.js',myfile._body);
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
		self.restService.http.get('/app/data/makeEdition/common/core/js/collationutils.js').subscribe(function(myfile) {
			zip.file('edition/common/core/js/collationutils.js',myfile._body);
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
		self.restService.http.get('/app/data/makeEdition/common/core/css/ssButton.css').subscribe(function(myfile) {
			zip.file('edition/common/core/css/ssButton.css',myfile._body);
			cb(null, []);
		})
	},
	function(arguments, cb) {
		self.restService.http.get('/app/data/makeEdition/common/core/css/titlepage.css').subscribe(function(myfile) {
			zip.file('edition/common/core/css/titlepage.css',myfile._body);
			cb(null, []);
		})
	},
	function(arguments, cb) {
		self.restService.http.get('/app/data/makeEdition/common/core/js/openimage.js').subscribe(function(myfile) {
//			eval(myfile._body);
			self.edition.openFile=myfile._body;
			cb(null, []);		})
	},
	function(arguments, cb) {
		self.restService.http.get(self.config.witnessInfFile).subscribe(function(myfile) {
			eval(myfile._body);
			self.edition.witnessInf=witnessInf;
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
		zip.file('edition/common/core/images/inkless.png', BrowserFunctionService.urlToPromise('/app/data/makeEdition/common/core/images/inkless.png', cb), {binary:true});
	},
	function(arguments, cb) {
		zip.file('edition/common/core/images/camera-black.png', BrowserFunctionService.urlToPromise('/app/data/makeEdition/common/core/images/camera-black.png', cb), {binary:true});
	},
	function(arguments, cb) {
		zip.file('edition/common/core/images/text.png', BrowserFunctionService.urlToPromise('/app/data/makeEdition/common/core/images/text.png', cb), {binary:true});
	},
	function(arguments, cb) {
		zip.file('edition/common/core/images/fullpage_grouphover.png', BrowserFunctionService.urlToPromise('/app/data/makeEdition/common/core/images/fullpage_grouphover.png', cb), {binary:true});
	},
	function(arguments, cb) {
		zip.file('edition/common/core/images/fullpage_hover.png', BrowserFunctionService.urlToPromise('/app/data/makeEdition/common/core/images/fullpage_hover.png', cb), {binary:true});
	},
	function(arguments, cb) {
		zip.file('edition/common/core/images/fullpage_pressed.png', BrowserFunctionService.urlToPromise('/app/data/makeEdition/common/core/images/fullpage_pressed.png', cb), {binary:true});
	},
	function(arguments, cb) {
		zip.file('edition/common/core/images/fullpage_rest.png', BrowserFunctionService.urlToPromise('/app/data/makeEdition/common/core/images/fullpage_rest.png', cb), {binary:true});
	},
	function(arguments, cb) {
		zip.file('edition/common/core/images/home_grouphover.png', BrowserFunctionService.urlToPromise('/app/data/makeEdition/common/core/images/home_grouphover.png', cb), {binary:true});
	},
	function(arguments, cb) {
		zip.file('edition/common/core/images/home_hover.png', BrowserFunctionService.urlToPromise('/app/data/makeEdition/common/core/images/home_hover.png', cb), {binary:true});
	},
	function(arguments, cb) {
		zip.file('edition/common/core/images/home_pressed.png', BrowserFunctionService.urlToPromise('/app/data/makeEdition/common/core/images/home_pressed.png', cb), {binary:true});
	},
	function(arguments, cb) {
		zip.file('edition/common/core/images/home_rest.png', BrowserFunctionService.urlToPromise('/app/data/makeEdition/common/core/images/home_rest.png', cb), {binary:true});
	},
	function(arguments, cb) {
		zip.file('edition/common/core/images/zoomin_grouphover.png', BrowserFunctionService.urlToPromise('/app/data/makeEdition/common/core/images/zoomin_grouphover.png', cb), {binary:true});
	},
	function(arguments, cb) {
		zip.file('edition/common/core/images/zoomin_hover.png', BrowserFunctionService.urlToPromise('/app/data/makeEdition/common/core/images/zoomin_hover.png', cb), {binary:true});
	},
	function(arguments, cb) {
		zip.file('edition/common/core/images/zoomin_pressed.png', BrowserFunctionService.urlToPromise('/app/data/makeEdition/common/core/images/zoomin_pressed.png', cb), {binary:true});
	},
	function(arguments, cb) {
		zip.file('edition/common/core/images/zoomin_rest.png', BrowserFunctionService.urlToPromise('/app/data/makeEdition/common/core/images/zoomin_rest.png', cb), {binary:true});
	},
	function(arguments, cb) {
		zip.file('edition/common/core/images/zoomout_grouphover.png', BrowserFunctionService.urlToPromise('/app/data/makeEdition/common/core/images/zoomout_grouphover.png', cb), {binary:true});
	},
	function(arguments, cb) {
		zip.file('edition/common/core/images/zoomout_hover.png', BrowserFunctionService.urlToPromise('/app/data/makeEdition/common/core/images/zoomout_hover.png', cb), {binary:true});
	},
	function(arguments, cb) {
		zip.file('edition/common/core/images/zoomout_pressed.png', BrowserFunctionService.urlToPromise('/app/data/makeEdition/common/core/images/zoomout_pressed.png', cb), {binary:true});
	},
	function(arguments, cb) {
		zip.file('edition/common/core/images/zoomout_rest.png', BrowserFunctionService.urlToPromise('/app/data/makeEdition/common/core/images/zoomout_rest.png', cb), {binary:true});
	},
	function(arguments, cb) {
		zip.file('edition/common/core/images/chelhgstemma.png', BrowserFunctionService.urlToPromise('/app/data/makeEdition/common/core/images/chelhgstemma.png', cb), {binary:true});
	},
	function(arguments, cb) {
		zip.file('edition/common/core/images/osearch.png', BrowserFunctionService.urlToPromise('/app/data/makeEdition/common/core/images/osearch.png', cb), {binary:true});
	},
	function(arguments, cb) {
		zip.file('edition/common/core/images/wholestemma.png', BrowserFunctionService.urlToPromise('/app/data/makeEdition/common/core/images/wholestemma.png', cb), {binary:true});
	},
	function(arguments, cb) {
		zip.file('edition/common/core/images/hgtitle.png', BrowserFunctionService.urlToPromise('/app/data/makeEdition/common/core/images/hgtitle.png', cb), {binary:true});
	},
	function(arguments, cb) {
		zip.file('edition/common/core/images/elendtitle.png', BrowserFunctionService.urlToPromise('/app/data/makeEdition/common/core/images/elendtitle.png', cb), {binary:true});
	},
	function(arguments, cb) {
		zip.file('edition/common/core/images/pntitle.png', BrowserFunctionService.urlToPromise('/app/data/makeEdition/common/core/images/pntitle.png', cb), {binary:true});
	},
	function(arguments, cb) {
		zip.file('edition/common/core/images/wytitle.png', BrowserFunctionService.urlToPromise('/app/data/makeEdition/common/core/images/wytitle.png', cb), {binary:true});
	},
	function(arguments, cb) {
		zip.file('edition/common/core/images/thtitle.png', BrowserFunctionService.urlToPromise('/app/data/makeEdition/common/core/images/thtitle.png', cb), {binary:true});
	},

/*	function(arguments, cb) {
		zip.file("edition/common/core/js/aliases.js", BrowserFunctionService.urlToPromise("/app/data/makeEdition/common/core/js/aliases.js", cb), {binary:true});
	}, */
	function(arguments, cb) {
		zip.file("edition/common/core/js/indexJs.js", BrowserFunctionService.urlToPromise("/app/data/makeEdition/common/core/js/indexJs.js", cb), {binary:true});
	},      //next load in three base files needed by CTP
	function(arguments, cb) {
		self.restService.http.get(self.config.chaucerNotHgFile).subscribe(function(myFile) {
			eval(myFile._body);
			self.config.chaucernotHg=chaucernotHg;
			cb(null, []);
		})
	},
	function(arguments, cb) {
		self.restService.http.get(self.config.scribalFile).subscribe(function(myFile) {
			eval(myFile._body);
			self.config.scribal=scribal;
			cb(null, []);
		})
	},
	function(arguments, cb) {
		self.restService.http.get(self.config.entitiesflatfile).subscribe(function(myFile) {
			eval(myFile._body);
			self.config.collentities=collentities;
			cb(null, []);
		})
	},
	function(arguments, cb) {
		self.restService.http.get(self.config.emendationsFile).subscribe(function(myFile) {
			eval(myFile._body);
			self.config.emendations=emendations;
			cb(null, []);
		})
	},
	function(arguments, cb) {
		self.restService.http.get(self.config.bibliographyFile).subscribe(function(myFile) {
			eval(myFile._body);
			self.config.bibliography=bibliography;
			cb(null, []);
		})
	},
	function(arguments, cb) {
		self.restService.http.get(self.config.concorderFile).subscribe(function(myFile) {
			eval(myFile._body);
			self.config.concorder=concorder;
			cb(null, []);
		})
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
    if (self.config.shortTitle=="Commedia") { return(callback(null));}
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
														testdocument.pages.filter(obj=>obj.name[0]==pages[i][0])[0].active=true;
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
  if (self.config.shortTitle=="Commedia") { return(callback(null));}
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
    if (self.config.shortTitle=="Commedia") { return(callback(null));}
	if (self.config.standalone && !self.config.makeVBase) {
   		return(callback(null));
   } else { 
   		$("#MEProgress").html("Creating VBase functionality");
		$.get(self.config.vBaseTemplate, function(myfile){
			let srcdoc=myfile;
			let mydata=BrowserFunctionService.customTemplates(srcdoc, [{key:"ssSearch", value: self.config.ssSearch, isobject: true}, {key:"gTag", value:self.config.gTag, isobject: false}, {key:"firstTranscript", value: self.config.firstTranscript, isobject:false}, {key:"currEntity", value: self.config.firstEntity, isobject:false}, {key: "VBaseJson", value: self.config.vBaseJson, isobject:false}, {key:"currMS", value: self.config.currMS, isobject:false}, {key:"shortTitle", value: self.config.shortTitle, isobject:false} ], [self.config.vBaseDriverJs]); 
			$("#MEIframe").attr("srcdoc", mydata); 
			window.addEventListener("message", function (event){ 
				if (typeof event.data === "string") {
					let ssSearch=true;
					let str=BrowserFunctionService.adjustResult(self, event.data, true, [{key:"ssSearch", value: self.config.ssSearch, isobject: true}, {key:"gTag", value:self.config.gTag, isobject: false}, {key:"universalBannerLocation", value: self.config.universalBannerLocation, isobject:false},{key: "view", value:"vbase", isobject:false}, {key: "currMS", value:self.config.currMS, isobject:false},  {key: "currEntity", value:self.config.firstEntity, isobject:false}],[self.config.vBaseJs, self.config.entityPagesFile, self.config.aliasesFile]);	
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
   if (self.config.shortTitle=="Commedia") { return(callback(null));}
   if (self.config.standalone && !self.config.makeCollation) {
   		return(callback(null));
   } else {
   		$("#MEProgress").html("Creating html for collated elements");
   		$.get(self.config.collationTemplate, function(myfile){
   			//altered June 2026. We now have collationflatents, containing a  complete, ordered and validated entity list
   			//so we just use thqt list, loaded into self.config.collentities, filtered for current entities
   			
   			let entitiesArray=[], origEntities=[] ;
   			let index=0; ci=0;
   			entitiesArray=self.config.collentities;
   			//remove entity=...
   			for (let i=0; i<entitiesArray.length; i++) {
   				let keepEntity=false;
   				for (let j=0; j<self.edition.entityPages.length; j++) {
   					if (entitiesArray[i].startsWith("entity="+self.edition.entityPages[j].entity)) keepEntity=true;
   				}
   				if (keepEntity) {
   					entitiesArray[i]=entitiesArray[i].slice(7);
   				} else {
   				 	entitiesArray.splice(i, 1);
   				 	i--;
   				}
   			}
 //			convertEntityPages(self.edition.entityPages, entitiesArray);
 // 		convertEntityPages(self.edition.entityPages, origEntities);
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
				let thisIndex=entitiesArray.indexOf(currEntity);
				if (thisIndex>0) prevCollation=entitiesArray[thisIndex-1]; //so we go all the way start to end
				if (thisIndex<entitiesArray.length-1) nextCollation=entitiesArray[thisIndex+1];
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
		mydata=BrowserFunctionService.customTemplates(srcdoc, [{key:"shortTitle", value:self.config.shortTitle, isobject: false}, {key:"isstandalone", value:true, isobject: true}, {key:"gTag", value:self.config.gTag, isobject: false}, {key:"ssSearch", value:ssSearch, isobject: true}, {key:"hasVMap", value:hasVMap, isobject: true}, {key:"community", value:self.config.TCCommunity, isobject: false}, {key: "TCurl", value:self.config.TCUrl, isobject:false}, {key: "view", value:"collation", isobject:false},{key:"universalBannerLocation", value: self.config.universalBannerLocation, isobject:false},  {key:"hasVBase", value: self.config.hasVBase, isobject:true}, {key:"currEntity", value: currEntity, isobject:false},  {key:"currMS", value: currMS, isobject:false}, {key:"prevCollation", value: prevCollation, isobject:false}, {key:"nextCollation", value: nextCollation, isobject:false}, {key:"VMap", value:JSON.stringify(VMap), isobject:true},{key:"regState", value: regState, isobject:true},{key:"wordState", value: wordState, isobject:true}], [self.config.collationDriverJs, self.config.collutilsJs, self.config.entityPagesFile, self.config.aliasesFile, self.config.indexCompareFile]); 
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
    if (self.config.shortTitle=="Commedia") { return(callback(null));}
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
    if (self.config.shortTitle=="Commedia") { return(callback(null));}
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
    if (self.config.shortTitle=="Commedia") { return(callback(null));}
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
/*				if (doc.name[0]!="El") {
					return(saCB(null));
				} */
				$("#MEProgress").html("Reading entities on "+myPage+" in "+doc.name);
				if (doc.name=="Edition" && myPage=="28") {
					var boo=1;
				}
				$.get(self.config.TCUrl+'/uri/urn:det:tc:usask:'+self.config.TCCommunity+'/entity=*:document='+doc.name+':pb='+myPage+'?type=list', function (pEnts) {
					//remove lines, and sort remaining pEnts...
					let fred=1;
					for (let i=0; i<pEnts.length; i++) {
						if (Object.entries(pEnts[i]).length==0) {	//error in source. You should check it.
							self.edition.messages+="Error on page "+myPage+" of document "+doc.name+". Empty entity found, this should not happen. Likely error in encoding. Check the transcription";
							return(saCB(null));
						}
						console.log("Processing entity "+pEnts[i].entity+" on "+myPage+" in "+doc.name);
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
						if (thisEnt.entity=="CTP2:entity=GP:line=788-a") {
							var boo=1;
						}
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
									$.post(self.config.TCUrl+'/api/getCommentaries?entity='+searchEnt+"&entityTo=", function (json){
										if (json.success && json.commentaries.length>0 && json.commentaries[json.commentaries.length-1].status=="APPROVED" ) {
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
							let newEntity=thisEnt.match[0]; //working for WBP?? for all cases?
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
    if (self.config.shortTitle=="Commedia") { return(callback(null));}
	if (!self.config.standalone || (self.config.standalone && self.config.makeIndexFile)) {
		$("#MEProgress").html("Creating index file");
		self.restService.http.get(self.config.indexTemplate).subscribe(function(myfile) {
			let srcdoc=myfile._body;
			if (self.config.standalone) {  
				mydata=BrowserFunctionService.customTemplates(srcdoc, [{key:"isstandalone", value:true, isobject: true},{key:"partEditor", value:self.config.partEditor, isobject: false},{key:"hasPartEditor", value:self.config.hasPartEditor, isobject: true},{key:"pubYear", value:self.config.pubYear, isobject: false},{key:"pubname", value:self.config.pubname, isobject: false},{key:"pubpart", value:self.config.pubpart, isobject: false},{key:"firstEditionPage", value:self.config.firstEditionPage, isobject: false},{key:"editorialCredit", value:self.config.editorialCredit, isobject: false}, {key:"generalEditors", value:self.config.generalEditors, isobject: false}, {key:"gTag", value:self.config.gTag, isobject: false},  {key: "firstEntity", value: self.config.firstEntity, isobject:false}, {key: "view", value:"index", isobject:false}, {key:"universalBannerLocation", value: self.config.universalBannerLocation, isobject:false},  {key:"currMS", value: self.config.currMS, isobject:false}, {key:"startCompare", value: self.config.startCompare, isobject:false}, {key:"hasVBase", value: self.config.hasVBase, isobject:true}, {key:"splash", value: self.config.splash, isobject:false},  {key:"shortTitle", value: self.edition.shorttitle, isobject:false}, {key:"longTitle", value: self.edition.title, isobject:false}, {key:"firstTranscript", value: self.config.firstTranscript, isobject:false}, {key:"ssSearch", value: self.config.ssSearch, isobject:true}], [self.config.indexDriverJs, self.config.entityPagesFile, self.config.aliasesFile]);
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
    if (self.config.shortTitle=="Commedia") { return(callback(null));}
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
		let editorial=[];
		let copyrightText=[];
		copyrightText.push({"type":"h2", "text": 'Copyrights in this Edition'});	
		copyrightText.push({"type":"p", "attr":"class=text", "text": 'All transcriptions, collations, commentaries and stemmatic images ("these materials") published in this edition are copyright the general editors, Barbara Bordalejo and Peter Robinson. The editors make these materials available as "Free Cultural Works" under the Creative Commons "CC BY Attribution" license. This allows anyone to distribute, remix, and build upon these materials (even commercially), provided they give credit to the original editors. This permission applies to all forms of these materials (HTML, Text Encoding Initiative XML, JSON), published both in this edition and on other sites (e.g. Zenodo; various institutional repositories.) The “Attribution 4.0 International” licence is available in summary form at <a href="https://creativecommons.org/licenses/by/4.0/">https://creativecommons.org/licenses/by/4.0/</a> (full legal code at <a href="https://creativecommons.org/licenses/by/4.0/legalcode.en">https://creativecommons.org/licenses/by/4.0/legalcode.en</a>). The editors assert their moral rights over these materials.'});
		copyrightText.push({"type":"p", "attr":"class=text", "text": 'The copyright situation for the document images referenced by this edition is more complex. Where possible, the edition references images available from the holding institution\'s website. These references are usually to full-colour high-resolution IIIF-compatible images. The references are held in a separate <a href="../../../images.js">images.js</a> file in this publication to enable their updating as new images are made. The copyright in all such images is held by the holding institution and the publishing conditions vary from institution to institution. Readers are advised to consult the holding institution regarding any uses of these images beyond viewing within this edition. However, in many cases no recent IIIF-compatible images are available from the holding institutions. In those cases, this edition provides monochrome images taken from microfilm, some deriving from the original reproductions made by <ref target="MANL40">Manly and Rickert</ref> in the 1920s. These images are made available in this publication for personal research use. If you want to make any other uses of these images you are advised to contact the holding institution. (cf. the <ref target="ALLA99">1999 Bridgeman Art Library</ref> case)'});
		editorial.push({"title":"Copyright", "key":"Copyright", "text":copyrightText});
		let aboutText=[];
		aboutText.push({"type":"h2", "text": 'About this Edition'});	
		if (self.config.hasPartEditor) aboutText.push({"type":"h3", "text": 'Part Editor\'s Introduction. Thomas J. Farrell. '});
		if (self.config.hasPartEditor) aboutText.push({"type":"p", "attr":"class=text", "text": 'My interest in the Canterbury Tales Project began long before my participation in it.  I was intrigued by its first publication, The Wife of Bath\'s Prologue on CD-ROM, for its inclusion and—for 1996—remarkably accessible display of the full range of variants in that work.  I slowly became more engaged with The Project\'s innovative and evolving theory of witness relations, as detailed in Peter Robinson\'s groundbreaking "A Stemmatic Analysis of the Fifteenth Century Witnesses to the Wife of Bath\'s Prologue," his "Analysis Workshop" on the General Prologue on CD-ROM, and many conversations over many years with Peter and Barbara Bordalejo.  I used its evidence in several articles, and the generally unthinking resistance to that use by some readers ultimately encouraged me to address "The Value of the Canterbury Tales Project and Textual Evidence in the Emendation of Canterbury Tales III 117," in a <ref target="FARR21">2021 article in JEGP</ref>.  By the time that article appeared I had agreed to start transcribing the witnesses to the Reeve\'s Tale and Prologue, setting in motion the process whose product is before you.  As a footnote to my article noted, "I affiliated myself with the CTP after being persuaded of its value, not vice versa."'});
 		if (self.config.hasPartEditor) aboutText.push({"type":"p", "attr":"class=text", "text": 'The process of making this edition followed the protocols of earlier CTP editions.  All 58 fifteenth-century witnesses to the Reeve\'s Prologue (Link 2). the Reeve\'s Tale, the Cook\'s Prologue (Link 3), and the unfinished Cook\'s Tale were transcribed and then collated; phylogenetic Variant Maps were generated using PAUP* software, and the Stemmatic Commentaries generated out of those data using the Project\'s standard procedures.  I either made or reviewed the transcripts and the collation; Peter Robinson generated the Variant Maps, and Peter, Barbara Bordalejo, and I all contributed to the Commentary.'});
 		 if (self.config.hasPartEditor)  aboutText.push({"type":"p", "attr":"class=text", "text": 'Part of the interest of the Reeve\'s Tale has always been its deployment of various dialect forms, especially in the speech of Aleyn and John.  The existence of those variants also proved to be interesting in editorial terms.  As I collated, it was relatively easy to distinguish dialect forms incorporating a distinct word—"I is" rather than "I am," for example—but words in which only a vowel changes present a more formidable challenge, especially given the number of vowels that might occur in the textual record at any point.  An early attempt to collate distinctly all the dialect forms that might reasonably be attributed to Chaucer failed because 1) it was insurmountably difficult to establish a consistent protocol determining which forms should and should not be distinguished and 2) phylogenetic analysis of such efforts suggested results incommensurate with what we already knew: the pair of group a witnesses Cn Ma, for instance, were in such maps placed far apart from their group mates Dd En1 Ds1.  In the end, standard collation practices, regularizing dialect variants, were employed for most dialect forms.'});
 		if (self.config.hasPartEditor) aboutText.push({"type":"p", "attr":"class=text", "text": 'But there is no perfect solution to this dilemma.  When the dialect program in the tale generates different words, those forms are distinguished in the collation.  When only a morpheme changes, the two forms are usually regularized.  But when the changed morpheme is placed in rhyme position, they must again be distinguished, especially because any given manuscript may well use one morpheme in the a-rhyme and another in the b-rhyme.'});
 		 if (self.config.hasPartEditor) aboutText.push({"type":"p", "attr":"class=text", "text": 'In short, the Reeve\'s Tale, perhaps more than most of the  <i>Tales</i>, ought to provide its readers with what the General Editors describe as "not only the critical edition but also the materials that made it possible, because only that complete record will give readers both a text to analyze and the tools to investigate the logic of its existence."'});
   		if (self.config.hasPartEditor) aboutText.push({"type":"h3", "text": 'General Editors\' Introduction. Barbara Bordalejo and Peter Robinson.'});
		aboutText.push({"type":"p", "attr":"class=text", "text": 'This edition is the result of more than 30 years of research on the textual tradition of Chaucer\’s <i>Tales</i>. Its origins date to the beginning of the Canterbury Tales Project (CTP) in the 1990s collaboration between Norman Blake, Elizabeth Solopova, and Peter Robinson. While this edition could not have existed without the CTP project and might be identified with it, it is more than the project.'});
		aboutText.push({"type":"p", "attr":"class=text", "text": 'The editors have very different backgrounds and perspectives, and their lived experiences afford them distinct vantage points from which to elucidate and interpret the text. This edition differs from the Wife of Bath\’s Prologue on CD-ROM (<ref target="ROBI96">1996</ref>), General Prologue (<ref target="SOLO00">2000</ref>), Hengwrt Chaucer Digital Facsimile (<ref target="STUB00">2000</ref>), Caxton\’s Canterbury Tales (<ref target="BORD03">2003</ref>), the Miller\’s Tale (<ref target="ROBI04">2004</ref>), and the Nun\’s Priest\’s Tale (<ref target="THOM06">2004</ref>). Here we present a critical edition of <i>The Book of the Tales of Canterbury</i>. Like most critical editions, it has been a long time in the making. Conceptually, it goes back to our earliest forays into textual criticism, to the very different times and circumstances in which we both became acquainted with theories surrounding scholarly editing and textual transmission. '});
		aboutText.push({"type":"p", "attr":"class=text", "text": 'Our work on the textual tradition of the <i>Tales</i>, detailed as it is, is built on our transcription and collation of the text. Bordalejo\’s <ref target="BORD02">Ph.D. research</ref> on Caxton\'s second edition of the <i>Tales</i> confirmed that the corrections included in that edition had their origin in a manuscript, now lost, that was likely independently descended from the archetype of the tradition. More recently, our article, “The Christ Church manuscript of the Book of the Tales of Canterbury” (<ref target="BOROF0">forthcoming</ref>), documents one of the most consequential discoveries the Canterbury Tales Project has made: the identification of Christ Church Oxford as a manuscript containing not only a very early version of the text, but one that contributes meaningfully to the construction of our own critical edition (also Robinson and Tresoldi <ref target="ROBI25">2025</ref>).'});
		aboutText.push({"type":"p", "attr":"class=text", "text": 'When we talk about a constructed critical edition, we highlight the fact that, as stated in “The Editorial Principles of the Critical Edition of the Book of the Tales of Canterbury", (<ref target="BORDF1">forthcoming</ref>) the aim of our critical text is not to conjure Chaucer\’s intended text into existence, but rather to build a text that empowers readers to understand its textual history through the readings chosen for our editions. To achieve this, we highlight crucial places of variation so the reader can explore how the textual tradition reveals the social, cultural, and transmissional circumstances that drive textual change. An example of this can be found on the first line of the text, for which we retained the Hg reading, \'Aueryll\'. Readers will find this reading in italics, with a link to the editors\' textual explanation. '});
		aboutText.push({"type":"p", "attr":"class=text", "text": 'This approach to our conceptualization of the edition arose from our collaborations with biblical textual scholars, particularly with the Institute for Greek New Testament Textual Studies in Münster. In a conversation with Klaus Wachtel of the Institute around 2004, he remarked that one could see the Nestle-Aland text of the Greek New Testament as "the text that best explains all the extant documents." This conception is behind everything we have done.' });
		aboutText.push({"type":"p", "attr":"class=text", "text": 'We hope that our text of the <i>Tales</i> serves as a portal to access different worlds. Readers are invited to immerse themselves in the world of Chaucer\’s work and to engage with the many facets of manuscript culture and textual transmission. By offering not only the critical edition but also the materials that made it possible, we give readers both a text to analyze and the tools to investigate the logic of its existence. '});
		aboutText.push({"type":"p", "attr":"class=text", "text": 'We believe that editions are arguments about a text (<ref target="ROBI13">2013</ref>). This edition is an argument with a long and complex history. It is an argument informed by our knowledge of the textual tradition and by everything we have learned in the process of transcribing, collating, and editing the text, as well as in our classrooms, with our students, as when we debated the interpretation of specific lines or phrases or explored how the lack of punctuation caused scribal confusion regarding speakers and pronouns.'});
		aboutText.push({"type":"p", "attr":"class=text", "text": 'Here, we invite readers to take part in the long tradition of the <i>Book of the Tales of Canterbury</i>, from Chaucer\’s first conception of the text to our critical edition, the latest in a long-standing endeavour to make sense of it.'});
		aboutText.push({"type":"h3", "text": 'Acknowledgements'});	
		aboutText.push({"type":"p", "attr":"class=text", "text": self.config.GeneralEdThanks});
		aboutText.push({"type":"p", "attr":"class=text", "text": self.config.institutionalThanks});
		editorial.push({"title":"About this edition","key":"About","text":aboutText});
		let citeText=[];
		citeText.push({"type":"h2", "text": 'How to Cite this Edition'});	
		if (self.config.hasPartEditor) {
			citeText.push({"type":"p", "attr":"class=text", "text": "Cite this publication as: \""+self.config.pubpart+"\", edited by "+self.config.partEditor+". "+self.config.pubYear+". In <i>The Book of the Tales of Canterbury by Geoffrey Chaucer.</i> A Critical Edition. Edited by Barbara Bordalejo and Peter Robinson. Inkless Editions, 2026-. At <a href='https://www.talesofcanterbury.org/"+self.config.partCode+"'>www.talesofcanterbury.org/"+self.config.partCode+"</a>."});
		} else {
			citeText.push({"type":"p", "attr":"class=text", "text": "Cite this publication as: \""+self.config.pubpart+"\", "+self.config.pubYear+". In <i>The Book of the Tales of Canterbury by Geoffrey Chaucer.</i> A Critical Edition. Edited by Barbara Bordalejo and Peter Robinson. Inkless Editions, 2026-. At <a href='https://www.talesofcanterbury.org/"+self.config.partCode+"'>www.talesofcanterbury.org/"+self.config.partCode+"</a>."});
		}
		editorial.push({"title":"Cite this edition","key":"CiteEdition","text":citeText});
		let historyText=[];
		historyText.push({"type":"h2", "text": 'History of this Project'});
		historyText.push({"type":"p", "attr":"class=text", "text": 'This edition builds on the work of the Canterbury Tales Project from 1993 onwards. The beginnings of this project lie in work done at Oxford University by Peter Robinson from 1989 to 1992 in the "Computers and Manuscripts" project. This work was funded by the Leverhulme Trust, with support from News International, the Faculty of English Language and Literature and the Centre for Socio-Legal Studies at Oxford. In 1993 Peter Robinson and Elizabeth Solopova joined forces with Norman Blake, then at the University of Sheffield, to extend the experiments of the "Computers and Manuscripts" project with the Wife of Bath\'s Prologue to the whole of the <i>Tales</i>: hence the Canterbury Tales Project. Further partnerships and funding followed: with Cambridge University Press, the University of Sheffield, the British Academy, the Arts and Humanities Research Board, and De Montfort University, where the project base moved in 1993.'});
		historyText.push({"type":"p", "attr":"class=text", "text": 'Outside the UK, crucial partnerships were forged with Paul Thomas of Brigham Young University and Dan Mosser of Virginia Tech. Paul oversaw the transcription of the whole of the massive "Fragment 7" of the <i>Tales</i> while Dan Mosser developed his ground-breaking <ref target="MOSS10">Digital Catalogue</ref> of the manuscripts and incunabula alongside our work. In 1999 Barbara Bordalejo joined the project, first as a doctoral student, then a post-doctoral researcher, from 2020 as director of the project and now as joint general editor with Robinson. The first phase of the project (up to around 2004) saw multiple publications on CD-ROM (later DVD), first with Cambridge University Press, enabled by Kevin Taylor and Andrew Brown at the Press (Robinson\'s <ref target="ROBI96">The Wife of Bath\'s Prologue</ref>, Solopova\'s <ref target="SOLO00">The General Prologue</ref>), then with Scholarly Digital Editions (Stubbs\'s <ref target="STUB00">Hengwrt Chaucer</ref>, Robinson\'s <ref target="ROBI04">The Miller\'s Tale</ref>, Thomas\'s <ref target="THOM06">Nun\'s Priest\'s Tale</ref>, Bordalejo\'s <ref target="BORD03">Caxton\'s Canterbury Tales</ref>, Mosser\'s <ref target="MOSS10">Digital Catalogue</ref>). Print publications by project participants also followed, on the <ref target="ROBI03">project\'s work</ref> and on the <ref target="BORD14">significance of Caxton\'s second edition</ref> of the <i>Tales</i>. Collaborations with partners on other sections of the <i>Tales</i> will ground future publications: thus with Martha Rust and David Hoover on the Clerk\'s Tale, with Jacob Thaisen on the Man of Law\'s Tale, Gabrielle Müller-Oberhauser and Ulrike Grassnick on the Pardoner\'s Tale. Tom Farrell\'s edition of the Reeve\'s Tale is one of the three initial publications of this edition. Two events around 2004-5 changed the project\'s direction, to the point that we speak of two project phases: one before 2004-5, and one after those years. The first event was the incapacitation of our long-time leader Norman Blake in May 2004, which left him unable to take any further part in the project and was followed by the dissolution of the partnership with the University of Sheffield. The second was the growing recognition that the methods and structures which had served us to that point would not scale to the whole of the <i>Tales</i>. To continue, the project would have to change. For example, up to 2004 all our digital publications were on CD-ROM or DVD. Already by 2004 it was clear that this technology was becoming obsolete and the project would have to move to full web publication.'});
		historyText.push({"type":"p", "attr":"class=text", "text": 'As well as our many collaborations and partners within the project, we profited greatly from our collaborations outside the project. From the early 1990s, Robinson had been working with Prue Shaw on her editions of Dante\'s <ref target="SHAW06"><i>Monarchia</i></ref> and <ref target="SHAW10"><i>Commedia</i></ref> and with many scholars, notably David Parker and Klaus Wachtel in England and Germany, on the long-running Greek New Testament editions based in Birmingham and Münster. The thinking of these scholars about the possibilities of digital editions (thus, Parker\'s <ref target="PARK97"><i>Living Text of the Gospels</i></ref>) and through Shaw encountering the traditions of Italian textual scholarship centered on <ref target="CONT86">Gianfranco Contini</ref> were critical to the Project, especially in the development of our fundamental transcription protocols, first formulated by Robinson and Solopova and then refined by Bordalejo, based on her work on the <ref target="BORD10">Dante transcription guidelines</ref>. Working with Edvige Agostinelli and William Coleman on their edition of <ref target="AGOS23">Boccacio\'s Teseida</ref> was also critical. Over this period, close involvement with the Text Encoding Initiative, through Michael Sperberg-McQuuen and Lou Burnard, underpinned our encodings. Two crucial collaborations with experts in evolutionary biology, <ref target="OHAR93">Robert O\'Hara</ref> and <ref target="BARB98">Chris Howe</ref>, introduced the Project to the use of methods and tools from evolutionary biology to understand how manuscripts relate to one another, leading to understandings foundational to our editions. These partnerships led to the Project\'s base moving to Birminhgam in 2005, to the Institute for Textual Scholarship and Electronic Editing newly-founded by Robinson, Parker and Bordalejo. It was now clear that the project would need extensive support to move its development and publications fully to the internet. In 2010 the project moved again, this time to Canada and the University of Saskatchewan, prompted by the promises of close collaboration with Canadian digital humanists and of access to generous public funding. The fulfilment of these promises, with the support of the University of Saskwatchewan (Yin Liu, Brent Nelson, Allison Muri) and later of the University of Lethbridge (Dan O\'Donnell), and funding from the Social Sciences and Humanities Research Council and the Canada Foundation for Innovation, has made this edition finally possible.'});
		editorial.push({"title":"Project History","key":"history","text":historyText});		
		let stemmaText=[];
		stemmaText.push({"type":"h2", "text": 'Stemma and Manuscript Groups'});
		stemmaText.push({"type":"p", "attr":"class=text", "text":"This edition refers to manuscript groups <b>o a b cd ungrouped</b>. The relationships between these groups are summarized in this stemma (<ref target=\"BOROF0\">Forthcoming</ref>), which sets out the relationships, as we have determined them, for the c. sixty full copies of the <i>Tales</i>:"}); 
		stemmaText.push({"type":"p", "attr":"class=stemmaimage", "text":"<img src='../../../common/core/images/wholestemma.png' width='715'></img>"}); 
		stemmaText.push({"type":"p", "attr":"class=text", "text":"In our analysis these relationships are stable across all sixty witnesses across the whole length of the  <i>Tales</i>. There are exceptions: notably, Ch moves away from the <b>o</b> group for the Cook's Tale, El moves away from <b>o</b> in the first half of the Wife of Bath's Prologue, and manuscripts move irregularly between the <b>o</b>, <b>ungrouped</b> and <b>cd</b> groups. Compare <ref target='ROBI26'>Robinson 2026, p. 26</ref> for the assertion that the world is a messy place, and accordingly stemmata are messy things. However, the broad consistency with which this stemma appears to hold across the whole <i>Tales</i> persuades us that there is a single textual history for the whole text. This runs against <ref target='DEMP46'>Dempster's assertion</ref>, based on her reading of <ref target='MANL40'>Manly and Rickert</ref>,  that each part of the <i>Tales</i> has a separate textual history, some twenty-five histories in all, with each separate history dependent on the existence of multiple distinct exemplars for each part of the <i>Tales</i>, distributed before Chaucer's death. This view requires the existence of over two hundred part-exemplars, not one of which have survived. Our single stemma for the whole <i>Tales</i> makes our task as editors far easier. We do not aim at strict editing by recension, which would require us to hypothesize that every extant manuscripts must descend from separate copies ('hypearchtypes') below the ancestor. Robinson's <ref target='ROBI26'><i>Anglia</i></ref> article argues that in a textual tradition of any size, strict recension is likely impossible, a conclusion which follows also from the editors' \"Manuscripts with Few Significant Introduced Variants\" <i>Ecdotica</i> article (<ref target='BORO18'>2018</ref>.) Like <ref target='PLAT25'>Ralf Plate</ref>, we describe our editing as \"stemmatically informed\"."}); 
		stemmaText.push({"type":"p", "attr":"class=text", "text":"The five groups into which our stemma divides the manuscripts and pre-1500 print texts of the tales are as follows:"});
		let groupText=[];
		groupText.push({"type":"li", "attr":"class=item", "text":"<b>o</b>: in strict stemmatic terms (for example as defined by <ref target='MAAS27'>Maas</ref> and his followers) this is not a \"Genetic Group\". The manuscripts in this group are not defined by mutual possession of errors introduced by a shared ancestor below the archetype but rather by retention of original readings typically replaced by other manuscripts. We identify such readings by a this variant search, using the VBase tool:"});
		groupText.push({"type":"li", "attr":"class=noBullet", "text":"<p class='stemmaimage'><img width='715' src='../../../common/core/images/osearch.png'></img></p>"});
		groupText.push({"type":"li", "attr":"class=noBullet", "text":"The logic behind this search is that the three manuscripts Ch El Hg are specially likely to preserve original readings: hence the first line, that we are looking for readings in at least two of those manuscripts. Further, if these readings are typically replaced elsewhere in the tradition, they will appear in less than fifteen manuscripts, and thus the second line. You can do this search for yourself for the General Prologue <a href='../../../vBase.html?name=o&vsite=false&nconds=2&in0=true&spec0=>1&wits0=Ch%20El%20Hg&in1=true&spec1=<15&wits1=\\all'>here</a>. Typically, between one in every six to ten lines contains an <b>o</b> variant. Although theoretically meaningless for recension, for us as editors these are exactly the manuscripts most likely to contain original readings not present elsewhere. As this search implies, the three manuscripts Ch El Hg (see below) are the core of the <b>o</b> manuscripts group. They are typically joined by Bo2 Gg and the pair Ad3-Ha5, by Cx2 when it differs from Cx1, and less often by Ha4 Ht Py To1 Cp Dd Ps."});
		groupText.push({"type":"li", "attr":"class=item", "text":"<b>ungrouped</b>: The <b>ungrouped</b> manuscripts are, to put it most simply, manuscripts which do not typically retain readings likely present in <b>o</b> (and thus, not <b>o</b>) and do not have the readings characteristic of the <b>a b cd</b> genetic groups (and thus, not <b>a b cd</b>). Several manuscripts appear to move between <b>o</b> and <b>ungrouped</b>, notably Ha4 Py To1; in some tales a few <b>ungrouped</b> manuscripts appear to form affiliations which dissolve in other tales; in others, <b>ungrouped</b> manuscripts join one of the genetic groups <b>a b cd</b>. Typically, Ha4-Ii Ad1-En3  Bo1-Ph2 Fi Mc-Ra1 Hk Py Ps, sometimes with some of Ht To1 Bw Tc1 Ra3 Nl Ra2 Ha3 Ln Si Dl, are <b>ungrouped</b>."});
		groupText.push({"type":"li", "attr":"class=item", "text":"<b>a b cd</b>: We agree with <ref target='MANL40'>Manly and Rickert</ref> on the existence of the genetic groups (that is, manuscripts which descend from a common ancestor below the original) they label <b>a b c d</b>, with the exception that we see their <b>c d</b> as a single group, <b>cd</b>. The smaller <b>a</b> and <b>b</b> groups are remarkably stable; the larger <b>cd</b> group less so. The members of <b>a</b> are the two pairs Cn-Ma and Ds1-En1 along with Dd, which also retains many <b>o</b> readings not found in the other four. (c. 5-7  mss with El Ch Ln occasionally joining). The members of <b>b</b> are Cx1 He Tc2, with Tc2 a likely copy of Cx1. A second group within <b>b</b> is made up of Cx2 Pn Wy, diverging from Cx1-He-Tc2 by Caxton's corrections of Cx1 from what appears to have been a now lost <b>o</b> manuscript (Bordalejo <ref target='BORD02'>2002</ref> and <ref target='BORD14'>2014</ref>) (c. 6-10 mss). The large <b>cd</b> group  is made up of Cp Mg-Lc Gl-Mm Fi La Ld1 Pw Ry1 Ry2 Se Sl1 Sl2, sometimes with Ln Ld2  Ha3 Tc1 Ra3 Ra1-Mc-Tc1 Ra2 Nl Ha2 Ry1 Ps Bw Dl En2 To1 Ph3. Cp appears nearest to the cd hyparchetype, and frequently retains readings from <b>o</b> lost in other <b>cd</b> manuscripts. (c. 20-30 mss)"});
		stemmaText.push({"type":"ul", "attr":"class=item", "text": groupText}); 
		stemmaText.push({"type":"p", "attr":"class=text", "text":"Among all the manuscripts of the <i>Tales</i>, three stand out for the excellent of their text and for their closeness not just in readings but also in fine details of spelling. Two of the three, El and Hg, have been long regarded by scholars as key to the tradition. We agree with this assessment and argue that their excellence derives from both manuscripts being direct copies from the <b>o</b> materials made by a single scribe known as \"Scribe B\" (Parkes and Doyle <ref target='PADO78'>1978</ref>). Scribe B appears to have been specially close to Chaucer (thus Mooney on <ref target='MOON06'>Adam Pynkhurst</ref>; cf. Warner <ref target='WARN18'>2018</ref>). Ch has been long known to share many good readings with Hg and El. Our work has confirmed that this closeness extends to precise detail of wording and spelling, with analysis of the spelling of all three manuscripts showing that they are so close that it appears that Ch is a copy of a third manuscript, alongside El and Hg, also written by Scribe B (<ref target='BOROF0'>Forthcoming</ref> and <ref target='ROBI25'>2025</ref>). Accordingly we regard Ch as deserving the same regard among editors as has been traditionally given to El Hg. This figure summarizes the relationship between Ch El Hg and <b>o</b>:"});
		stemmaText.push({"type":"p", "attr":"class=stemmaimage", "text":"<img src='../../../common/core/images/chelhgstemma.png' width='500'></img>"}); 
		editorial.push({"title":"Stemma and Manuscript Groups","key":"stemma","text": stemmaText});		
		let titleText=[];
		titleText.push({"type":"p", "attr":"class=author", "text": self.config.author});
		titleText.push({"type":"p", "attr":"class=pubname", "text": self.config.pubname});
		titleText.push({"type":"p", "attr":"class=edstatus", "text":"A Critical Edition"});	
		titleText.push({"type":"p", "attr":"class=genEds", "text": "<i>Edited by</i> "+self.config.editor});
		titleText.push({"type":"p", "attr":"class=pubpart", "text": self.config.pubpart});
		if (self.config.hasPartEditor) titleText.push({"type":"p", "attr":"class=editor3", "text":"<i>Edited by</i>"});
		if (self.config.hasPartEditor) titleText.push({"type":"p", "attr":"class=editor", "text":self.config.partEditor});	
		if (self.config.dedication!="") titleText.push({"type":"p", "attr":"class=dedication", "text":self.config.dedication});
		titleText.push({"type":"p", "attr":"class=editor3", "text":"<hr></hr>"});
		titleText.push({"type":"p", "attr":"class=pubLogo", "text":"<img src='../../../common/core/images/inkless.png' width='256px'/>"});
		titleText.push({"type":"p", "attr":"class=pubstatement", "text":self.config.publisher+", "+self.config.pubPlace+". "+self.config.pubDate});	
//		titleText.push({"type":"p", "attr":"class=edThanks", "text":"The editors are grateful for the support of the "+self.config.edThanks});	
		editorial.push({"title":"Title Page", "key":"TitlePage", "text":titleText});
		let origTitle=[];
		origTitle.push({"type":"h2", "text": 'The  Book of the Tales of Canterbury'});
		origTitle.push({"type":"p", "attr":"class=text", "text": "The first words at the top of the first page of the Hengwrt manuscript (Hg), accepted as the most important single manuscript of Chaucer’s work, are:"});
		origTitle.push({"type":"p", "attr":"class=quote", "text": "Here bygynneth the Book of the tales of Caunterbury"});
		origTitle.push({"type":"p", "attr":"class=stemmaimage", "text":"<img src='../../../common/core/images/hgtitle.png' width='700'></img>"}); 
		origTitle.push({"type":"p", "attr":"class=text", "text":"These words are written by the main hand of the manuscript, in the same yellowish ink used by this scribe for what seems to be the last parts of the manuscript he wrote, notably the links between the tales of the Squire Merchant and Franklin. It is as if the last act of the scribe was to write the title of the whole work at its very beginning."}); 
		origTitle.push({"type":"p", "attr":"class=text", "text":"Indeed, the testimony of every manuscript which gives a title agrees with this wording. It is \“the book of the Tales of Canterbury\” in the fifteen manuscripts (and two incunables) which give the title in the explicit to the whole collection,  at the very end of the text:"});
		origTitle.push({"type":"p", "attr":"class=quote", "text": "Heere is ended the book of the tales of Caunterbury"});
		origTitle.push({"type":"p", "attr":"class=text", "text":"Thus, the Ellesmere manuscript (El)"});
		origTitle.push({"type":"p", "attr":"class=stemmaimage", "text":"<img src='../../../common/core/images/elendtitle.png' width='700'></img>"}); 
		origTitle.push({"type":"p", "attr":"class=text", "text":"Caxton’s \"prohemye\" to his second edition (c.1483) also names the work as \"the book of the tales of cauntyrburye\".  At some places, the initial \"The book of\" is elided. The list of Chaucer’s works in the Retraction (1012)  names \"the book of Troilus\" and other books, \"of seint Valentynes day\", then \"the Tales of Caunterbury\" and \"the book of the Leon\". The copy of John Shirley’s introduction to the text, preserved in Harleian 7333, describes the work as \"þe tales of Caunterburye wiche beon Compilid in þis boke\". In no manuscript is the work described as \"The Canterbury Tales\”."});
		origTitle.push({"type":"p", "attr":"class=text", "text":"The first appearance of the phrase \"Canterbury Tales\" is in Richard Pynson’s c. 1492 print edition, as a title placed before the first lines of the General Prologue:"});
		origTitle.push({"type":"p", "attr":"class=stemmaimage", "text":"<img src='../../../common/core/images/pntitle.png' width='700'></img>"}); 
		origTitle.push({"type":"p", "attr":"class=text", "text":"Here, the phrase \"Canterbury Tales\" is linked with \"boke\". Wynkyn de Worde modifies the wording to the \"boke of Chaucer named Caunterbury Tales\" in his 1497 printing, and makes the title more prominent by having it appear alone on a page before the start of the main text:"});
		origTitle.push({"type":"p", "attr":"class=stemmaimage", "text":"<img src='../../../common/core/images/wytitle.png' width='700'></img>"});
		origTitle.push({"type":"p", "attr":"class=text", "text":"The first appearance of the modern form of the title \"Canterbury Tales\", without the qualifying \"Book of\", is in William Thynne’s 1532 edition of \"The Workes of Geffray Chaucer\"."});
		origTitle.push({"type":"p", "attr":"class=stemmaimage", "text":"<img src='../../../common/core/images/thtitle.png' width='700'></img>"});
		origTitle.push({"type":"p", "attr":"class=text", "text":"\"The Caunterbury Tales\" is listed first in a table of contents on page a iii r for the whole volume, following Thynne’s \"Preface\", with entries for the \"Romant of the Rose\", \"Troylus and Creseyde\" and others following in this table of contents. The next page lists the parts of the <i>Tales</i> in a further table of contents, beginning with \"The P[ro]logues of the Canterbury tales.\" Thynne’s edition was reprinted in 1542, and both Stow’s 1561 and Speght’s 1598 edition follow the same formula, of \"Preface\", then a table of contents for the whole volume with \"The Canterburie Tales\" appearing first, and a second table of contents just for the Tales following, beginning with \"The Prologues of the Canterberie Tales\".  None of these three –  Thynne, Stow or Speght -- reprint Caxton’s \"Prohemye\". These three editions defined how Chaucer was read during the renaissance in England. All three editions and their reprints, both in their various tables of contents and \"Prefaces\" refer to the Tales as \"the Canterburie Tales\" (thus, Speght on f. c.i.r). That title has persisted into the modern day, despite it appearing in no document until over a hundred years after Chaucer’s death. Accordingly, we restore the title to that known throughout the first century and longer of the <i>Tales</i>."});
		editorial.push({"title":"The Title", "key":"origtitle", "text":origTitle});
		let sigils=[];
		sigils.push({"type":"h2", "text": 'Manuscript and Incunable Sigils'});
		Object.entries(self.edition.witnessInf).forEach(([key, value]) => {
		 let sigtext="<span class='sigilId'>"+key+"</span><span class='sigil'>"+value.id+"</span>";
 		 sigils.push({"type":"p", "attr":"class=sigilP", "text":sigtext});
		});
		editorial.push({"title":"Sigils", "key":"sigils", "text":sigils});
		let technology=[];
		technology.push({"type":"h2", "text": 'Technologies Used in this Edition'});
		technology.push({"type":"p", "attr":"class=text", "text":"The technologies used in this edition changed as the digital world changed. The Canterbury Tales Project underlying this edition began in the early days of personal computing, using mainframe computers for data creation and handline. It continues in the age of social media and smart phones."});
		technology.push({"type":"p", "attr":"class=text", "text":" One may distinguish three stages in the project's changing technologies. In the first stage, lasting roughly from 1989 to 2006, the project transitioned from the use of a mainframe computer housed at Oxford University Computing Services for data storage and manipulation to use of Macintosh personal computers for transcription. Transcription files were originally prepared on terminals to a VAX system. Robinson wrote a computer program in SNOBAL (then SPITBOL) to collate the transcriptions, to create a record of the collation and then to export that record into various forms. Two articles by Robinson describe this early work, on computer-assisted <ref target=\"ROBI89a\">collation</ref> and <ref target=\"ROBI89b\">analysis</ref>. As personal computers become more widespread and more capable transcriptions came to be done on Macintosh computers and stored on floppy and hard discs. Robinson wrote a computer-assisted collation program <i><ref target='ROBI94'>Collate</ref></i> for the Macintosh, now best remembered as the predecessor of two far more capable programs, <ref target='DEKK20'>CollateX</ref> and the <ref target=\"SMIT20\">Collation Editor</ref>. Cambridge University Press, through Kevin Taylor and Andy Brown, enabled the first project publications (<ref target=\"ROBI96\">1996</ref> and <ref target=\"SOLO00\">2000</ref>), both on CD-ROM, both using the now-defunct DynaText publishing system."});
		technology.push({"type":"p", "attr":"class=text", "text":"As early as the mid-90s, as the World Wide Web arrived, it became clear that the models which had supported us though the first phase of the project would not scale to sustain the project in the long-term. Transcription creation and storage needed to move to the web away from stand-alone computers. Most pressing, we needed to replace the DynaText system used in our publications. By 1998 the defects in DynaText made it clear that it could not be used for our future publications, and Cambridge had decided not to renew their license for its use. Cambridge also decided to withdraw as our publisher. So we needed a new publisher and a new publication system. Robinson (later joined by Bordalejo) created the publisher: Scholarly Digital Editions (at <a href=\"https://www.sd-editions.com\">www.sd-editions.com</a>). In those years, from around 1998 through to 2006, Robinson and others developed the <ref target=\"ROBI04\">Anastasia</ref> publishing system to replace DynaText. The first publication to emerge from the combination of Scholarly Digital Editions and Anastasia was Estelle Stubbs' edition of the <i><ref target=\"STUB00\">Hengwrt Chaucer Digital Facsimile</ref></i>. More publications followed: the <ref target=\"ROBI04\">Miller's Tale</ref>, <ref target=\"THOM06\">Nun's Priest's Tale</ref>, <ref target=\"BORD03\">Caxton's Canterbury Tales,</ref> and Dan Mosser's <i><ref target=\"MOSS10\">Catalogue</ref></i>. This combination of publisher and publication represents the second technology phase of our work, running from around 1999 through to 2020."});
		technology.push({"type":"p", "attr":"class=text", "text":"A key aim of this second phase was that every stage of our making our editions should be done online through a web interface. Our original intention was that Anastasia would not be just a publication system, but would also be a \"Virtual Research Environment\", permitting project collaborators (numbering, eventually, more than 200 people) to carry out and check every phase of the project's work, and especially transcriptions and collations. Our first plan, dating from 2005 when Bordalejo and Robinson joined David Parker and other New Testament scholars in the newly established Institute for Textual Scholarship and Electronic Editing (ITSEE) at the University of Birmingham, was to create a single research platform for digital editing which would serve all our needs, and those of many others. In the event that did not happen. Funding pressure led the project leaders -- the New Testament Scholars -- to concentrate on the needs of their users in what became, eventually, the \"Virtual Manuscript Room.\" Accordingly they went ahead without us, to create what is indeed a superb scholarly resource highly-tuned to their needs. Another factor is that by around 2008 it was clear that the members of the wider University of Birmingham community (not members of ITSEE itself) did not see the advantages to ourselves and to other scholars at Birmingham of our continued collaboration. Once more, we would need to develop ourselves what we needed: in this case, a virtual research environment to house all our work. In 2010 Robinson took up a post at the University of Saskatchewan. A reason for this was that the prospects for sufficient funding for such a complex piece of research infrastructure were higher in Canada than in England. Further, the concentration of digital humanists in Saskatchewan and elsewhere in Western Canada offered a fertile intellectual environment. "});
		technology.push({"type":"p", "attr":"class=text", "text":"We were not disappointed in these hopes. Substantial funding from the Canada Foundation for Innovation, the Social Sciences and Humanities Research Council and the University of Saskatchewan enabled the making of the Textual Communities system, now the daily foundation of all our work. Among other matters, this funding permitted Bordalejo to move to Canada to continue with the project. We needed a system which would both contral access to our work and allow our collaborators to see, in real time, the results of their work. It must enable acquisition and management of page images (including IIIF formats); link transcripts ot images and permit real-time creation of transcripts; carry out computer-assisted collation; generate output in multiple formats and translate between multiple formats. Of these, the real-time requirement was the most demanding. First, around 2008, we attempted to use Django as a front-end managing interactions with users and Oracle XML-DB as a back-end database. Beside the problem that Oracle XML-DB is propietary software, we found problems with updates being slow. After moving to Canada in 2010 and receiving funding from 2011 on we moved away from both Django and Oracle XML-DB. At first, we attempted to use long-established relational database technology, in the form of MySQL, as our back-end system. However the complex data joins needed to move data between XML and relational tables proved slow and difficult to manage. The breakthrough came in 2014 when a talented student programmer, Xiaohan Zhang, suggested moving to the then-new JSON document database technology, in the form of Mongo-DB. The advantages of this move far outweighed the overhead conversions between JSON and XML. Xiaohan also moved the development and front-end software environment to NodeJS, a change which made it possible for one person alone, initially Xiaohan and later Robinson, to manage the whole system."});
		technology.push({"type":"p", "attr":"class=text", "text":"By 2018 Textual Communities was fully functional and providing all we needed for the making of our editions. This completed the second phase of technological development. Our initial plan was to use Textual Communities as our publication platform, in the same way we had used Anastasia earlier. However, in 2020 Robinson joined a partnership with Lino Leonardi of SISMEL and Prue Shaw, a distinguished Dante editor with whom Robinson had long worked, to update the <ref target=\"SHAW10\">2010</ref> edition of the <i>Commedia</i> on which all three had worked in time for the 2021 700th anniversary of Dante's death. Leonardi had one stringent requirement: the online published edition must not rely on a database, of any kind. Robinson made the edition now at <a href=\"https://www.dantecommedia.it\">www.dantecommedia.it</a> according to this requirement and came to see that for any digital edition to survive it must not depend on database technology for its delivery. Robinson had already had an experience with the fragility of database technology, when in 2023 the University of Saskatchewan declared they could not maintain the NodeJS and MongoDB systems used by Textual Communities. For the work of the project to survive, the final project webpages -- the edition you are now looking at -- must be delivered without a database."});
		technology.push({"type":"p", "attr":"class=text", "text":"Indeed, the <a href=\"https://endings.uvic.ca/\">Endings Project</a> had come to the same conclusion, and issued guidelines for digital projects to follow if they wanted to survive on the web. Our attempts, since 2020, to restructure our editions to give them the best chance we can to survive on the web, constitute the third phase of our technological development. Accordingly, this edition is constructed from thousands of static html files, managed by standard css presentation and javascript software tools. The search tool used is the staticSearch system developed by Martin Holmes and Joey Takeda of the Endings Project. The one divergence from Endings in our editions is that we use the JQuery software library extensively. We will progressively remove this dependency. A particular concern of ours is the availability of manuscript images. We have packaged with this edition images of all the manuscript and incunable pages transcribed and collated in the edition, all held in the \"iiifimages\" folder, all in iiif form. In many cases, superior images are provided by libraries direct from their servers. In all such cases, we provide a link to those images rather than to the form held in the iiifimages folder. However, where the library server images are not available (as is too frequently the case) we automatically redirect to the version held in the iiifimages folder. Note that the file \"images.js\" at the toot folder of this edition (thus, <a href=\"../../../images.js\">here</a>) provides a means of updating the images in this edition as they become available."});
		technology.push({"type":"p", "attr":"class=text", "text":"This summary was written in July 2026. That you are reading these words now indicates that our edition has survived that long."});
		editorial.push({"title":"Technology", "key":"technology", "text":technology});
/* 		zip.file('edition/common/local/js/editorial.js', 'var editorial='+JSON.stringify(editorial));
		zip.file('edition/output/editorial.js', 'var editorial='+JSON.stringify(editorial));
		return(callback(null));   */

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
							if (commEntities.includes(myEntity.entity) ) { 
								cb(null, []);
							} else {
								$.post(self.edition.TCUrl+'/api/getCommentaries?entity='+searchEnt+"&entityTo=", function (json){
									if (json.success && json.commentaries.length>0 && json.commentaries[json.commentaries.length-1].status=="APPROVED" ) {
										commEntities.push(myEntity.entity);
										let appComm=json.commentaries[json.commentaries.length-1]
										if (appComm.text.indexOf("<br>")>-1) {
											let myText=appComm.text, myFixed=[];
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
											editorial.push({"title":myEntity.match[1], "aliases": JSON.stringify(aliases), "key":myEntity.entity.slice(myEntity.entity.indexOf("entity=")+7), "text":myFixed, "date": appComm.date, "approver": appComm.user});
										} else {
											let aliases=[];
											if (self.config.hasOwnProperty("aliases")) {
												aliases=applyAliases(self.config.aliases, myEntity.entity);
											}
											//check for alias
											editorial.push({"title":myEntity.match[1], "aliases": JSON.stringify(aliases), "key":myEntity.entity.slice(myEntity.entity.indexOf("entity=")+7), "text":[{"type":"p", "text":appComm.text}], "date": appComm.date, "approver": appComm.user});
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
							if (/* !myEntity.hasCollation || */ collEntities.includes(myEntity.entity)) { 
								cb(null, []);
							} else {
								$.get(self.edition.TCUrl+"/uri/urn:det:tc:usask:"+searchEnt+"?type=apparatus&format=xml/positive", function (xml) {
									collEntities.push(myEntity.entity);
									if (xml.result==0) {
										console.log(xml.message);
										cb(null, []);
									} else {
										zip.file('edition/xml/collation/'+ myEntity.match[0]+"/"+ myEntity.match[1]+'.xml', xml.replaceAll("&lt;","<"));
										cb(null, []);	
									}						
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
		}, function (err) { //deal with scribal additions etc here
			var scribalLines=[];
			var originalLines=[];
			var emendations=[];
			var bibliography=[];
		    async.waterfall([
		    	function (cb1) { 
		    		var scribal=[];
					for (let i=0; i<self.config.entities.length; i++) {
						let myScribal=self.config.scribal.filter(entry=>(entry.startsWith("entity="+self.config.entities[i])));
						if (myScribal.length) {
							scribal.push(myScribal);
						}
					}
					async.mapSeries(scribal, function (scribal_arr, cbscribal) { 
						let thisScribalLine=[];
				//		let title=scribal_arr[0].slice(7, scribal_arr[0].indexOf(":"));
						let aliases=applyAliases(self.config.aliases, "CTP2:"+scribal_arr[0]);
						thisScribalLine.push({"title":aliases[0], "lines":[]});
		    			async.mapSeries(scribal_arr, function (scribal1, cbonescribal) {
							$("#MEProgress").html("Processing scribal lines for "+scribal1);
		    				let fetchEnt="CTP2/"+scribal1;
		    				let edText="";
		    				let msList="";
		    				async.parallel([
		    					function (cb3) { 
		    						$.get(self.edition.TCUrl+"/uri/urn:det:tc:usask:"+fetchEnt+":document=Edition?type=transcript&format=xml", function(textLine) {
		    							edText=textLine[0].text;
		    							cb3(null, "");
		    						});		    
		    					},
		    					function (cb3) {
		    						$.get(self.edition.TCUrl+"/uri/urn:det:tc:usask:"+fetchEnt+":document=*?type=list", function(witnessList) {
		    							let nWits=witnessList.length;
		    							for (let i=0; i<witnessList.length; i++) {
		    								if (witnessList[i].name[0]=="Edition") {
		    									nWits--;
		    								} else if (witnessList[i].name[0]=="Base") {
		    									nWits--;
		    								} else  {
		    									msList+='<a href="javascript:getMSLine(\''+scribal1.slice(scribal1.indexOf("=")+1)+'\', \''+witnessList[i].name[0]+'\')">'+witnessList[i].name[0]+'</a> ';
		    								}
		    							}
		    							msList+=" ("+nWits+")"
		    							cb3(null, "");
		    						});	 
		    					} 
		    				], function (err) {
								aliases=applyAliases(self.config.aliases, "CTP2:"+scribal1);
								thisScribalLine[0].lines.push({"line":edText, "place": aliases[1],"witnesses":msList});
								return(cbonescribal(null));
		    				}); 
		    			}, function(err){
		    				scribalLines.push(thisScribalLine)
		    				cbscribal(null,[]);
		    			}); 
		    		}, function (err){  
		    			editorial.push({"title":"Scribal Lines", "key":"Scribal", "aliases": JSON.stringify(aliases), "scribalLines":scribalLines});
		    			cb1(null,[]);
		    		}); 
		    	}, 
		    	function (args, cb1) { 
		    		var original=[];	
					for (let i=0; i<self.config.entities.length; i++) {
						let myOriginal=self.config.chaucernotHg.filter(entry=>(entry.startsWith("entity="+self.config.entities[i])));
						if (myOriginal.length) {
							original.push(myOriginal);
						}
					}
					async.mapSeries(original, function (original_arr, cboriginal) { 
						$("#MEProgress").html("Processing scribal lines for "+original_arr[0]);
						let thisOriginalLine=[];
				//		let title=scribal_arr[0].slice(7, scribal_arr[0].indexOf(":"));
						let aliases=applyAliases(self.config.aliases, "CTP2:"+original_arr[0]);
						thisOriginalLine.push({"title":aliases[0], "lines":[]});
		    			async.mapSeries(original_arr, function (original1, cboneoriginal) {
		    				$("#MEProgress").html("Processing o lines not in Hg for "+original1);
		    				let fetchEnt="CTP2/"+original1;
		    				let edText="";
		    				let msList="";
		    				async.parallel([
		    					function (cb3) {
		    						$.get(self.edition.TCUrl+"/uri/urn:det:tc:usask:"+fetchEnt+":document=Edition?type=transcript&format=xml", function(textLine) {
		    							edText=textLine[0].text;
		    							cb3(null, "");
		    						});		    						
		    					},
		    					function (cb3) {
		    						$.get(self.edition.TCUrl+"/uri/urn:det:tc:usask:"+fetchEnt+":document=*?type=list", function(witnessList) {
		    							let nWits=witnessList.length;
		    							for (let i=0; i<witnessList.length; i++) {
		    								if (witnessList[i].name[0]=="Base") {
		    									nWits--;
		    								} else  {
		    									msList+='<a href="javascript:getMSLine(\''+original1.slice(original1.indexOf("=")+1)+'\', \''+witnessList[i].name[0]+'\')">'+witnessList[i].name[0]+'</a> ';
		    								}
		    							}
		    							msList+=" ("+nWits+")";
		    							cb3(null, "");
		    						});	
		    					}
		    				], function (err){
								aliases=applyAliases(self.config.aliases, "CTP2:"+original1);
								thisOriginalLine[0].lines.push({"line":edText, "place": aliases[1], "witnesses":msList});
								return(cboneoriginal(null));
		    				});
		    			}, function(err){
		    				originalLines.push(thisOriginalLine);
		    				return(cboriginal(null));
		    			});
		    		}, function (err){  
		    			editorial.push({"title":"O Lines not in Hg", "key":"OnotHg", "aliases": JSON.stringify(aliases), "originalLines":originalLines});
		    			cb1(null,[]);
		    		});
		    	}, 
		    	function (args, cb1) { //get the emendations together
		    		var emendations=[], emendationGroups=[];	
					for (let i=0; i<self.config.entities.length; i++) {
						let myEmendation=self.config.emendations.filter(entry=>(entry.startsWith("entity="+self.config.entities[i])));
						if (myEmendation.length) {
							emendations.push(myEmendation);
						}
					}	   
					async.mapSeries(emendations, function (emendations_arr, cbemendation) { 
						$("#MEProgress").html("Processing emendations for "+emendations_arr[0]);
						let thisEmendationLine=[];
						let aliases=applyAliases(self.config.aliases, "CTP2:"+emendations_arr[0]);
						thisEmendationLine.push({"title":aliases[0], "lines":[]});
						async.mapSeries(emendations_arr, function (emendation1, cbemendation1) {
							$("#MEProgress").html("Processing emendation for "+emendation1);
							let fetchEnt="CTP2/"+emendation1;
							//now we have the emendation ...process it..
							$.post(self.edition.TCUrl+'/api/getCommentaries?entity='+fetchEnt+"&entityTo=", function (json){
								if (json.success && json.commentaries.length>0 && json.commentaries[json.commentaries.length-1].status=="APPROVED" ) {
									let appComm=json.commentaries[json.commentaries.length-1];
									if (appComm.text.indexOf("<br>")>-1) { //go through this one paragraph at a time
										let myText=appComm.text, myFixed=[];
										myText=myText.replace(/(\r\n|\n|\r)/gm, "");
										while (myText.indexOf("<br>")>-1) {
											myFixed.push({"type":"p", "text":myText.slice(0, myText.indexOf("<br>"))});
											myText=myText.slice(myText.indexOf("<br>")+4);
										}
										myFixed.push({"type":"p", "text":myText});
										//readin alias at this point
										let aliases=[];
										if (self.config.hasOwnProperty("aliases")) {
											aliases=applyAliases(self.config.aliases, emendation1);
										}
										thisEmendationLine[0].lines.push({"title":emendation1, "aliases": JSON.stringify(aliases), "title":aliases[0], "key":emendation1.slice(7), "text":myFixed, "date": appComm.date, "approver": appComm.user});
								//		editorial.push({"title":myEntity.match[1], "aliases": JSON.stringify(aliases), "key":myEntity.entity.slice(myEntity.entity.indexOf("entity=")+7), "text":myFixed, "date": json.results[i].date, "approver": json.results[i].approver});
									} else {
										let aliases=[];
										if (self.config.hasOwnProperty("aliases")) {
											aliases=applyAliases(self.config.aliases, emendation1);
										}
										//check for alias
										thisEmendationLine[0].lines.push({"key":emendation1.slice(7),"title":aliases[0], "text":[{"type":"p", "text":appComm.text}], "date": appComm.date, "approver": appComm.user}); //add here text of related commentary
//										editorial.push({"title":myEntity.match[1], "aliases": JSON.stringify(aliases), "key":myEntity.entity.slice(myEntity.entity.indexOf("entity=")+7), "text":[{"type":"p", "text":json.results[i].text}], "date": json.results[i].date, "approver": json.results[i].approver});
									}
								} 
								cbemendation1(null, "");
							});
						}, function (err){
							emendationGroups.push(thisEmendationLine);
							cbemendation(null, "");
						});
					}, function (err){
						editorial.push({"title":"Emendations", "key":"emendations", "lines":emendationGroups});
						cb1(null,"");
					}); 	
		    	},
		    	function (args, cb1) {   //bibligoraphic entries
		    		editorial.push({"title":"Bibliography", "key":"bibliography", "items":self.config.bibliography});
		    		cb1(null,"");
		    	}
		    ], function (err){
				self.edition.editorial=editorial;
				zip.file('edition/common/local/js/editorial.js', 'var editorial='+JSON.stringify(editorial));
				zip.file('edition/output/editorial.js', 'var editorial='+JSON.stringify(editorial));
				return(callback(null));
		    });
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
    if (self.config.shortTitle=="Commedia") { return(callback(null));}
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
    if (self.config.shortTitle=="Commedia") { return(callback(null));}
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
				mydata=BrowserFunctionService.customTemplates(mydata, [{key:"isstandalone", value:true, isobject: true}, {key:"gTag", value:self.config.gTag, isobject: false}, {key:"shortTitle", value:self.config.shortTitle, isobject: false}, {key:"TCcommunity", value:self.config.TCCommunity, isobject: false}, {key: "TCurl", value:self.config.TCUrl, isobject:false}, {key:"currMS", value: self.config.currMS, isobject:false}, {key:"hasVBase", value: self.config.hasVBase, isobject:true}, {key:"ssSearch", value: self.config.ssSearch, isobject:true}, {key:"item", value:JSON.stringify(thisEditorial), isobject: true},{key: "view", value:"editorial", isobject:false}, {key:"universalBannerLocation", value: self.config.universalBannerLocation, isobject:false}], [self.config.editorialDriverJs, self.config.entityPagesFile, self.config.aliasesFile, self.config.indexCompareFile, self.config.collutilsJs, self.config.bibliographyFile]);
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
					if (thisEditorial.hasOwnProperty("key") && (thisEditorial.key=="Scribal" || thisEditorial.key=="OnotHg" )) {
						zip.file('edition/html/editorial/menu/'+thisEditorial.key+".html", str);
					} else {
						if (!Array.isArray(thisEditorial)) {
							zip.file('edition/html/editorial/menu/'+thisEditorial.key+".html", str);
						} else {
							zip.file('edition/html/editorial/commentary/'+thisEditorial[0].key.slice(0,thisEditorial[0].key.indexOf(":") )+".html", str);
						}
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
    if (self.config.shortTitle=="Commedia") { return(callback(null));}
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
    if (self.config.shortTitle=="Commedia") { return(callback(null));}
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

function makeImagesFile(self, zip, documents, callback) {
	if (!self.config.makeImagesFile) {
		return(callback(null));
	} else {
		let record=[];
		async.mapSeries(documents, function (doc, cbdocs){
				record.push({"ms":doc.name[0], "id":self.edition.witnessInf[doc.name[0]].id, "permission":self.edition.witnessInf[doc.name[0]].permission,"pages":[]});
			async.mapSeries(doc.pages, function(tpage, cbpage){
				$("#MEProgress").html("processing "+doc.name+"/"+tpage);
				if (doc.name[0]=="Edition") {
					record.filter(msRec=>msRec.ms==doc.name[0])[0].pages.push({"page":tpage[0], "iiif":""});
					cbpage(null);
				} else {
				//do shit here
				let IIIFstring=self.config.TCimagesUrl+"/uri/urn:det:tc:usask:"+self.config.imagesCommunity+"/document="+doc.name+":folio="+tpage+"?type=IIIF&format=url";
				$.get(IIIFstring, function(iiif){
					//we have the page url now
					if (iiif.length==0) {
						record.filter(msRec=>msRec.ms==doc.name[0])[0].pages.push({"page":tpage[0], "iiif":""});
					} else {
						//filter out references to IIIF files on the tc public server, or to undefined and corrupter permissions
						if (iiif[0].url.indexOf("undefined")>-1) {
							record.filter(msRec=>msRec.ms==doc.name[0])[0].pages.push({"page":tpage[0], "iiif":""});
						} else if (iiif[0].url.indexOf("textualcommunities")>-1) {
							record.filter(msRec=>msRec.ms==doc.name[0])[0].pages.push({"page":tpage[0], "iiif":""});
						} else {
							record.filter(msRec=>msRec.ms==doc.name[0])[0].pages.push({"page":tpage[0], "iiif":iiif[0].url});
						}
					}
					cbpage(null);
				}).fail(function(jqXHR, textStatus, errorThrown) {
					console.log("Error getting "+doc.name[0]+", "+tpage[0]);
					record.filter(msRec=>msRec.ms==doc.name[0])[0].pages.push({"page":tpage[0], "iiif":""});
					cbpage(null);
				});
			  }
			}, function (err) {
				cbdocs(null);
			});
		}, function (err) {
			zip.file('edition/output/images.js', self.edition.openFile+"\nconst witnesses="+JSON.stringify(record, null, 2));					
			callback(null);
		});
	}
}

function makeHTMLPages(self, zip, documents, pageEntities, callback) {
    if (self.config.shortTitle=="Commedia") { return(callback(null));}
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
					let myEntity="";
					if (self.edition.pageEntities.filter(witness=>witness.witness==doc.name[0])[0].entities.filter(page=>page.page[0]==tpage).length>0) {
						myEntity=self.edition.pageEntities.filter(witness=>witness.witness==doc.name[0])[0].entities.filter(page=>page.page[0]==tpage).filter(thisEnt=>thisEnt.collateable)[0].entity;
						myEntity=myEntity.slice(myEntity.indexOf("=")+1);
					} else { //blank page with no entities...
						myEntity="";
					}
					let ssSearch=true;
					if (typeof self.config.ssSearch=="undefined") ssSearch=false;
					if (self.config.standalone) {
						myData=BrowserFunctionService.customTemplates(myData, [{key:"isstandalone", value:true, isobject: true}, {key:"gTag", value:self.config.gTag, isobject: false}, {key:"hasVBase", value: self.config.hasVBase, isobject:true}, {key:"scribal", value: JSON.stringify(self.config.scribal), isobject:true}, {key:"concorder", value: JSON.stringify(self.config.concorder), isobject:true}, {key:"ssSearch", value:ssSearch, isobject: true}, {key:"prevPage", value:prevPage, isobject: false}, {key:"nextPage", value:nextPage, isobject: false}, {key: "view", value:"transcript", isobject:false}, {key: "TCurl", value: self.config.TCUrl, isobject:false}, {key: "TCimages", value: self.config.TCimagesUrl, isobject:false}, {key: "currMS", value: doc.name, isobject:false},{key: "currPage", value: tpage, isobject:false}, {key: "imagesCommunity", value:self.config.imagesCommunity, isobject:false}, {key: "TCcommunity", value:self.config.TCCommunity, isobject:false}, {key: "currEntity", value:myEntity, isobject:false}, {key: "currEntities", value:JSON.stringify(self.config.entities), isobject:true}, {key:"universalBannerLocation", value: self.config.universalBannerLocation, isobject:false}, {key:"shortTitle", value: self.config.shortTitle, isobject:false}], [self.config.pagesDriverJs, self.config.collutilsJs, self.config.witnessInfFile, self.config.pageEntitiesMinFile, self.config.entityPagesFile, self.config.aliasesFile,self.config.indexCompareFile]);
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
							let str=BrowserFunctionService.adjustResult(self, event.data, false, [{key:"ssSearch", value:ssSearch, isobject: true},{key:"universalBannerLocation", value: self.config.universalBannerLocation, isobject:false},{key: "view", value:"transcript", isobject:false}, {key: "currMS", value: doc.name, isobject:false},  {key: "currEntity", value:myEntity, isobject:false},{key: "currPage", value: tpage, isobject:false}],[self.config.pagesJs, self.config.entityPagesFile, self.config.aliasesFile, self.config.indexCompareFile, self.config.imagesJS]);	
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
    if (self.config.shortTitle=="Commedia") { return(callback(null));}
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
    if (self.config.shortTitle=="Commedia") { return(callback(null));}
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
							mydata=BrowserFunctionService.customTemplates(srcdoc, [{key:"isstandalone", value:true, isobject: true}, {key:"gTag", value:self.config.gTag, isobject: false}, {key:"ssSearch", value:ssSearch, isobject: true}, {key:"TCcommunity", value:self.config.TCCommunity, isobject: false}, {key:"imagesCommunity", value:self.config.imagesCommunity, isobject: false},  {key:"currPage", value:self.config.currPage, isobject: false}, {key:"TCimagesUrl", value:self.config.TCimagesUrl, isobject: false}, {key: "TCurl", value:self.config.TCUrl, isobject:false}, {key: "view", value:"compare", isobject:false},{key:"universalBannerLocation", value: self.config.universalBannerLocation, isobject:false},  {key:"hasVBase", value: self.config.hasVBase, isobject:true}, {key:"currEntity", value: currEntity, isobject:false},  {key:"currMS", value: currMS, isobject:false}, {key:"prevCompare", value: prevCompare, isobject:false}, {key:"nextCompare", value: nextCompare, isobject:false}, {key:"currEntities", value: JSON.stringify(currEntities), isobject:true}, {key:"shortTitle", value: self.config.shortTitle, isobject:false}], [self.config.compareDriverJs, self.config.collutilsJs, self.config.entityPagesFile, self.config.entityPagesFile, self.config.aliasesFile, self.config.pageEntitiesMinFile,self.config.indexCompareFile]); 
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
								let str=BrowserFunctionService.adjustResult(self, event.data, false, [{key:"community", value:self.config.TCCommunity, isobject: false}, {key:"ssSearch", value:ssSearch, isobject: true},{key:"universalBannerLocation", value: self.config.universalBannerLocation, isobject:false},{key: "view", value:"compare", isobject:false}, {key: "currMS", value: currMS, isobject:false},  {key: "currEntity", value:currEntity, isobject:false},{key: "currPage", value: self.config.currPage, isobject:false}, {key:"currEntities", value: JSON.stringify(currEntities), isobject:true}],[self.config.compareJs, self.config.entityPagesFile, self.config.aliasesFile, self.config.pageEntitiesMinFile, self.config.collutilsJs, self.config.indexCompareFile, self.config.imagesJS]);	
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
						return (witnesses[0].name)   //edition, not base
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

function adjustCommedia(self, source, isIndex, persistVals, persistScripts) {
	let replaceStr="";
	if (persistVals.length>0) {
		replaceStr+="<script>const ";
		for (let i=0; i<persistVals.length; i++) {
			if (!persistVals[i].isobject) {
					replaceStr+=persistVals[i].key+" = "+'"'+persistVals[i].value+'"';
				} else {
					replaceStr+=persistVals[i].key+" = "+persistVals[i].value;
				}
			if (i<persistVals.length-1) replaceStr+=", "; 
		} 
		replaceStr+="</script>\n"; 
	}
	if (persistScripts.length>0) {
		for (let i=0; i<persistScripts.length; i++) {
			if (typeof persistScripts[i]=="undefined") continue;  //catches case where aliases file does not exist
			replaceStr+='<script type="text/javascript" src="'+persistScripts[i]+'"></script>\n';
		}
		source=source.replace('<script id="placeholder"></script>', replaceStr);
//		if (self.config.hasOwnProperty("ssSearch") && source.indexOf('<div id="staticSearch"></div>')>-1) {
//			source=source.replace('<div id="staticSearch"></div>',self.config.ssSearch);
//		} 
	} 
	//remove all file references with ../common
//	source=source.replace(/src="[^"]+\/common\//g,'src="../../../common/');
	source=source.replace(/\/app\/data\/makeEdition\/common\/Commedia3\//g,'../../../');
//	source=source.replace(/url\(&quot;.*?\/common\//g, "url(&quot;../../../common/");
	if (isIndex) source=source.replaceAll("../../../", "");
	return(source);
 }


function checkEntities(self, callback) {
	if (self.config.standalone && !self.config.checkEntities) {
   		return(callback(null));
   } else {
   		let entitiesArray=[];
   		convertEntityPages(self.edition.entityPages, entitiesArray);
   		 $("#MEProgress").html("reading in "+self.config.entitiesflatfile);  //superfluous; already loaded
   		$.get(self.config.entitiesflatfile, function(data){ //load th
 			eval(data);  //should give us collentities
 			if (typeof collentities=="undefined") {
 				 $("#MEProgress").html("Error reading in "+self.config.entitiesflatfile+". No collentities defined");
 				 return(callback(null));
 			} else { //we do a check against each other. For each top level entity, we check it has the same members (but in different orders maybe)
				let errorstr1="", errorstr2="";
				for (let i=0; i<collentities.length; i++) {collentities[i]=collentities[i].replace("entity=", "")}
				for (let i=0; i<self.config.entities.length;i++) {
					let topent=self.config.entities[i];
					//check first in flatfile
					let flatents=collentities.filter(collent=>collent.indexOf(topent+":")==0);
					//now check that each flatent is in entities array derived from the witnesses
					for (let j=0; j<flatents.length; j++) {
						if (entitiesArray.findIndex(entity=>entity==flatents[j])==-1) {
							errorstr1+=flatents[j]+" ";
						}
					}
					flatents=entitiesArray.filter(collent=>collent.indexOf(topent+":")==0);
					for (let j=0; j<flatents.length; j++) {
						if (collentities.findIndex(entity=>entity==flatents[j])==-1) {
							errorstr2+=flatents[j]+" ";
						}
					}
				}
				if (errorstr1!="") errorstr1="Entities "+errorstr1+" present in "+self.config.entitiesflatfile+" but not found in the collateable documents in this community";
				if (errorstr2!="") errorstr2=" Entities "+errorstr2+" present in the collatable documents but not found in "+self.config.entitiesflatfile;
				if (errorstr1!="" || errorstr2!="") {
					return(callback(errorstr1+errorstr2+". You should check these"));
				} else {	
					return(callback(null)); 
				}
			} 				
 		 });
   	 }
}

module.exports = CommunityMakeEditionComponent;
