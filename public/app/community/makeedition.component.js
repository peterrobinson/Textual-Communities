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
    this.edition={whole:true, works:true, title: "An edition of "+this.state.community.attrs.longName, editor:"Edited by "+this.state.authUser.attrs.local.name};
  }],
  ngOnInit: function() {  //identify servers where stuff is coming from
  	this.edition.TCurl="";
  	this.edition.TCimages="";
   	this.edition.imagesCommunity=this.community.attrs.abbr; 	
   	this.edition.TCCommunity=this.community.attrs.abbr;
   	this.edition.TCBackEndurl=this.edition.TCurl+"/api/";
   	this.config={"makePagesHtml":true, "makePageEntities":true, "makeEntities":true, "makeCompare":true};
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
     if (this.config.hasOwnProperty("longTitle")) this.edition.title=this.config.longTitle;
     if (this.config.hasOwnProperty("editor")) this.edition.editor=this.config.editor;    
     if (this.config.hasOwnProperty("TCurl")) this.edition.TCurl=this.config.TCurl;    
     if (this.config.hasOwnProperty("TCimages")) this.edition.TCimages=this.config.TCimages;    
     if (this.config.hasOwnProperty("imagesCommunity")) this.edition.imagesCommunity=this.config.imagesCommunity; 
     if (this.config.hasOwnProperty("TCCommunity")) this.edition.TCCommunity=this.config.TCCommunity; 
     //might have overridden config defaults without setting them; restore defaults here
     if (!this.config.hasOwnProperty("makePageEntities")) this.config.makePageEntities=true; 
     if (!this.config.hasOwnProperty("makeEntities")) this.config.makeEntities=true; 
     if (!this.config.hasOwnProperty("makePagesHtml")) this.config.makePagesHtml=true; 
     if (!this.config.hasOwnProperty("makeCompare")) this.config.makeCompare=true; 
  	} catch (e) {
		this.error+=e.message;
		this.edition.title="An edition of "+this.state.community.attrs.longName;
		this.edition.editor=this.state.authUser.attrs.local.name;
   	}
  },
  submit: function() {
  	var self=this;
  	const zip = new JSZip();
  	var documents=[];
  	var entities=[];
  	var pageEntities=[];
	async.waterfall([
		function (cb1) {
			$("#MEProgress").html("Loading base files");
			loadBaseFiles(zip, self, function callback(){
				cb1(null,[]);
			});
		},
		function(arguments, cb1) {
			 $("#MEProgress").html("Assembling information about documents");
			 $.get(self.config.DBUrl+'/api/getDocNamesCommunity/?community='+self.config.docsCommunity, function(res) {
				if (self.edition.whole || (!self.edition.whole && !self.config.hasOwnProperty("documents"))) {
					for (let i=0; i<res.length; i++) {
						documents.push({name:res[i].name, pages:[]});
					}
				} else {
					for (let i=0; i<self.config.documents.length; i++) {
						let isDoc=res.filter(function (obj){return obj.name==self.config.documents[i].name})[0];
						if (isDoc) {
							documents.push({name:self.config.documents[i].name, pages:[]});
						} else {
							self.error+="Document '"+self.config.documents[i]+"', specified in 'documents' in the edition configuration file, does not exist in this community"
						}
					}
				}
				cb1(null, []);
			 });
		},
		function(arguments, cb1) {
			if (self.config.standalone) {
				cb1(null,[]);
			} else {
				$("#MEProgress").html("Creating header information for each document");
				if (!self.edition.whole && self.config.hasOwnProperty("witnessHTTP"))  {
					self.restService.http.get(self.config.witnessHTTP).subscribe(function(myfile) {
						if (myfile._body.indexOf("var witnesses={};")!=0) {
							self.error+="Error found reading "+self.config.witnessHTTP+". This file must begin with 'var witnesses={}'; see the documentation on the witness information file";
						} else {
							self.edition.witnesses=myfile._body;
						}
						cb1(null, []);
					})
				} else {	//no config file, or no witnessHTTP file ... read all the document headers and create the witnesses file from there
					let myWitnesses="var witnesses={};";
					async.mapSeries(documents, function (mydocument, cbdocs){
						$.get(self.edition.TCurl+'/uri/urn:det:tc:'+config.authority+':'+self.community.attrs.abbr+'/document='+mydocument.name+'?type=teiheader', function (myHeader) {
							let myXMLDOM = new DOMParser().parseFromString(myHeader, "text/xml");
							let description="", permission="";
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
								permission+"";
							}
							if (description=="") description="No information found. Check the documentation";
							if (permission=="") permission="No permission found. Check the documentation";
							myWitnesses+="\nwitnesses['"+mydocument.name+"']={id:'"+description+"', permission:'"+permission+"'};";
							cbdocs(null);
						});
					}, function (err) {
						self.edition.witnesses=myWitnesses;
						cb1(null, []);
					})
				}
			}
		},
		function(arguments, cb1) {
			$("#MEProgress").html("Creating ancillary files");
			//fpr each level of entities in the files which are not terminal, generate ass list of 
			if (self.config.standalone) {
				cb1(null, []);
			} else {
				//what mss 
				var mssJs=[];
				//we might choose to filter the entities in the config file
				var seekEntities=[];
				if (self.edition.whole || (!self.edition.whole && !self.config.hasOwnProperty("entities"))) {
					for (let i=0; i<self.state.community.attrs.entities.length; i++) {
						seekEntities.push(self.state.community.attrs.entities[i].attrs.entityName)
					}
				} else {
					for (let i=0; i<self.config.entities.length; i++) {
						seekEntities.push(self.config.entities[i]);
					}
				}
				async.mapSeries(seekEntities, function (entity, cbents){
					 var thisEnt=entity.slice(entity.indexOf("entity=")+7);
					 $.get(self.edition.TCurl+'/uri/urn:det:tc:'+config.authority+':'+self.community.attrs.abbr+'/entity='+thisEnt+':document=*?type=list', function (myfile) {
						if (!self.edition.whole && self.config.hasOwnProperty("documents")) {
							for (let i=0; i<myfile.length; i++) {
								if (!self.config.documents.includes(myfile[i].name)) {
									myfile.splice(i,1);
									i--;
								}
							}
						} 
						mssJs.push({entity: thisEnt, witnesses: myfile});
						cbents(null);
					 });
				}, function (err){
					zip.file('edition/common/js/mss/mssEntities.js', 'const mssEntities='+JSON.stringify(mssJs));
					cb1(null,[]);
				});
			}
		},    //add a step to filter pages of documents so that only those which have entities we are looking for ...
		function(arguments, cb1) { //identify all pages of all documents sought, and which pages have entities we are looking for
			$("#MEProgress").html("Processing information about documents");
			if (self.config.standalone && self.config.makePageEntities) {
				async.mapSeries(self.config.documents, function (doc, cbdocs) { //get AUT.js etc from store
					pageEntities.push({witness:doc.name, entities:[]});
					self.restService.http.get('/app/data/makeEdition/'+self.config.dirName+'/js/'+doc.name+".js").subscribe(function(myfile) {
						let myJSON=JSON.parse(myfile._body);
						doc.pages=myJSON;
						if (typeof self.config.pagesLimit!="undefined") {
							doc.pages.splice(self.config.pagesLimit)
						}
						async.mapSeries(doc.pages, function (myPage, saCB) {
							$("#MEProgress").html("Reading entities on "+myPage.page+" in "+doc.name);	
							$.get(self.edition.TCurl+'/uri/urn:det:tc:usask:'+self.config.TCCommunity+'/entity=*:document='+doc.name+':pb='+myPage.page+'?type=list', function (pEnts) {
								let thisMs=pageEntities.filter(function (obj){return obj.witness==doc.name})[0];
								//remove lines, and sort remaining pEnts...
								for (let i=0; i<pEnts.length; i++) {
									pEnts[i].match=makeMatch(pEnts[i].entity);
									if (pEnts[i].entity.indexOf("line=")>-1 && pEnts[i].entity.indexOf("lg=")>-1) {
										pEnts.splice(i--, 1);
									} else {
										if (pEnts[i].match.indexOf("_")>-1) {
											pEnts[i].sort=pEnts[i].match.split("_")[1];
											if (isNaN(pEnts[i].sort)) pEnts[i].sort=0;
											else pEnts[i].sort=parseInt(pEnts[i].sort);
										}
									}
								}				
								pEnts.sort((a, b) => (a.sort > b.sort) ? 1 : -1);
								for (let i=0; i<pEnts.length; i++) {
									thisMs.entities.push({page: myPage.page, match: makeMatch(pEnts[i].entity), entity: pEnts[i].entity, collateable: pEnts[i].collateable});
								}
								saCB(null);
							});
						}, function (err) {
							cbdocs(null);
						});
					});
				}, function (err) {
					documents=self.config.documents;
					zip.file('edition/common/js/mss/pageEntities.js', 'const pageEntities ='+JSON.stringify(pageEntities));
					cb1(null,[]);
				});
			} else if (!self.config.makePageEntities) {
				 self.restService.http.get('/app/data/makeEdition/'+self.config.pageEntitiesFile).subscribe(function(myfile) {
				 	pageEntities=JSON.parse(myfile._body);
				 	//now write the pages into the documents...
				 	for (let i=0; i<documents.length; i++) {
				 		documents[i].pages=[];
				 		let doc=pageEntities.filter(function (obj){return obj.witness==documents[i].name})[0];
				 		for (let j=0; j<doc.entities.length; j++) {
				 			if (!documents[i].pages.filter(function (obj) {return obj.page==doc.entities[j].page})[0]) {
				 				documents[i].pages.push({"page":doc.entities[j].page});
				 			}
				 		}
				 		if (typeof self.config.pagesLimit!="undefined") {
				 			documents[i].pages.splice(self.config.pagesLimit);
				 		}
				 	}
				 	cb1(null,[]);
				 });
			} else {
				async.mapSeries(documents, function (doc, cbdocs){
					pageEntities.push({witness:doc.name, entities:[]});
					$.get(self.edition.TCurl+'/uri/urn:det:tc:'+config.authority+':'+self.community.attrs.abbr+'/document='+doc.name+':*=*?type=list', function (myfile) {
						//we now have a set of pages. Look at each page: what entities are on them?
						async.mapSeries(myfile, function(tpage, cbpage){
							 $.get(self.edition.TCurl+'/uri/urn:det:tc:usask:'+self.community.attrs.abbr+'/entity=*:document='+doc.name+':pb='+tpage.name+'?type=list', function (pEnts) {
								$("#MEProgress").html("Reading entities on "+tpage.name+" in "+doc.name);
								let thisMs=pageEntities.filter(function (obj){return obj.witness==doc.name})[0];
								if (self.edition.whole || (!self.edition.whole && !self.config.hasOwnProperty("entities"))) {
									doc.pages.push(tpage.name);
									for (let i=0; i<pEnts.length; i++) {
										thisMs.entities.push({page: tpage.name, match: makeMatch(pEnts[i].entity), entity: pEnts[i].entity, collateable: pEnts[i].collateable});
									}
								} else {
									//does this page contain any of the entities we are looking for?
									let isEnt=null;
									for (let i=0; i<self.config.entities.length && !isEnt; i++) {
										isEnt=pEnts.filter(function (obj){return obj.entity==self.config.entities[i]})[0];
									}
									if (!isEnt) { // none on this page! go to next!
										let foo=1;
									} else { //add page to livePages
										doc.pages.push(tpage.name);
										for (let i=0; i<pEnts.length; i++) {
											thisMs.entities.push({page: tpage.name, match: makeMatch(pEnts[i].entity), entity: pEnts[i].entity, collateable: pEnts[i].collateable});
										}
									}
								}
								 cbpage(null)
							 })
						
						}, function (err) {
							cbdocs(null)
						});
					});	
				}, function (err) {
					cb1(null,[]);
				});
			}
		},
		function(arguments, cb1) { //read-in barebones index file; later inject data into it ready to use 
			if (self.config.standalone) {
				if (self.config.makePagesHtml) {
					self.restService.http.get('/app/data/makeEdition/'+self.config.indexPagesHtml).subscribe(function(myfile) {
						self.pagesdoc=myfile._body;
						cb1(null,[]);
					});
				} 
				if (self.config.makeCompare) {
					self.restService.http.get('/app/data/makeEdition/'+self.config.indexCompareHtml).subscribe(function(myfile) {
						self.comparedoc=myfile._body;
						cb1(null,[]);
					});
				} 
				cb1(null,[]);
			} else {
				self.restService.http.get('/app/data/makeEdition/driver/index.html').subscribe(function(myfile) {
					self.srcdoc=myfile._body;
					cb1(null, []);
				})
			}
		}, 
		function(arguments, cb1) { 
			if (!self.config.makeMenu) {
				cb1(null, []);
			} else {
				$("#MEProgress").html("Creating editorial HTML files");
				self.restService.http.get(self.config.indexMenuHtml).subscribe(function(myfile) {
					self.menudoc=myfile._body;
					self.restService.http.get(self.config.makeMenuFile).subscribe(function(myfile) {
						let editorial=JSON.parse(myfile._body);
						async.mapSeries(editorial, function (item, cbmenu) { 
							let myDOM = new DOMParser().parseFromString(self.menudoc, "text/html");
							let scriptTag = "<script id='driverScript'>const key='"+item.key+"', makeEdition=true, TCCommunity='"+self.edition.TCCommunity+"';</script>";
							$(myDOM).contents().find("head").append(scriptTag);
							let s = new XMLSerializer();
							$("#MEIframe").attr("srcdoc", s.serializeToString(myDOM));
							let current=0;
							var delay = setInterval(loaderMenu, 500); 
							function loaderMenu() {
								current+=500;  //note: DBUrl is whee we wrote the temporary file
								$.get(self.config.DBUrl+'/api/isMakeEdition?editionID=Editorial-'+self.edition.TCCommunity+"-"+item.key, function(result){
									if (result.success) {
										 clearInterval(delay);
										 //get the html from the database
										 $.get(self.config.DBUrl+'/api/getMakeEdition?editionID=Editorial-'+self.edition.TCCommunity+"-"+item.key, function(result){
											 if (result.success) {
												let newHtml1=result.html.replaceAll('makeEdition=true', 'makeEdition=false').replaceAll("/app/data/makeEdition/common/", "../../../common/").replaceAll("/app/data/makeEdition/teseida/common/", "../../../common/").replaceAll("/app/data/makeEdition/teseida/driver/", "../../../common/")
												let newHtml=newHtml1.replace('<div id="staticSearch"></div>', self.config.ssSearch);
												zip.file('edition/html/editorial/menu/'+item.key+'.html', newHtml);
												 //get the xml...
												$.get(self.config.DBUrl+'/api/deleteMakeEdition?editionID=Compare-'+self.edition.TCCommunity+"-"+item.key, function(result){
													console.log("Finished editorial for "+item.key+" (time: "+current+")")
													return(cbmenu(null));	
												});
											 } 
										 });
									 }
								  }) 
						       }
						}, function (err) {
							cb1(null, []);
						});
					});
				});
			}
		}, 
		function(arguments, cb1) {  //actually makes the pages for the documents...
			if (!self.config.makePagesHtml) {
				cb1(null, []);
			} else {
				$("#MEProgress").html("Creating html for document pages");
				var commentary=[];
				async.mapSeries(documents, function (doc, cbdocs){
				//for every live page in the pages...
					//right. Let's get the xml and html for each page...
					//if working from a config file: check the page contains at least one of the entities sought; 
					//set the iframe source to load the page
					let iterator=0, prevPage="", nextPage="";
					if (doc.pages.length==0) {
						$("#MEProgress").html("No pages found holding these entities in "+doc.name+". Likely a problem here! Check you have defined the right community on the right server\r");
						cbdocs(null);
					} else {
						async.mapSeries(doc.pages, function(tpage, cbpage){
							//are we specifying particular pages?
							let doIt=true;
							if (self.config.standalone && (typeof self.config.pages!="undefined")) {
								doIt=false;
								for (let i=0; i<self.config.pages.length; i++) {
									if (self.config.pages[i].doc==doc.name &&  self.config.pages[i].page==tpage.page) {
										doIt=true;
										i=self.config.pages.length;
									}
								}
							}
							if (!doIt) { //page not specified
									iterator++;
									cbpage(null);
							} else {
								if (iterator==0) {
									prevPage=null;
								} else {
									if (self.config.standalone) {prevPage="'"+doc.pages[iterator-1].page+"'"} else {prevPage="'"+doc.pages[iterator-1]+"'"};
								}
								if (iterator==doc.pages.length-1) {
									nextPage=null
								} else {
									if (self.config.standalone) {nextPage="'"+doc.pages[iterator+1].page+"'"} else {nextPage="'"+doc.pages[iterator+1]+"'"};
								}
								iterator++;
								if (self.config.standalone) tpage=tpage.page;
								$("#MEProgress").html("Creating "+doc.name+"/"+tpage+".html<br>");
								//we manipulate the srcdoc to include the variables we need for this page
								let myDOM = new DOMParser().parseFromString(self.pagesdoc, "text/html");
								let scriptTag = "<script>var community='"+self.community.attrs.abbr+"', currMS='"+doc.name+"', currPage='"+tpage+"', prevPage="+prevPage+", nextPage="+nextPage+", title='"+doc.name+" "+tpage+"';\n";
								scriptTag+="\nvar TCurl='"+self.edition.TCurl+"', TCimages='"+self.edition.TCimages+"', makeEdition=true, imagesCommunity='"+self.edition.imagesCommunity+"', TCCommunity='"+self.edition.TCCommunity+"'\n<";
								scriptTag +=  "/script>";
								$(myDOM).contents().find("head").append(scriptTag);
								let s = new XMLSerializer();
								$("#MEIframe").attr("srcdoc", s.serializeToString(myDOM));
								//we poll for completion..
								let current=0;
								var delay = setInterval(loader, 1000); 
								function loader() {
									current+=500;  //note: DBUrl is whee we wrote the temporary file
									  $.get(self.config.DBUrl+'/api/isMakeEdition?editionID=Transcript-'+self.edition.TCCommunity+"-"+doc.name+"-"+tpage, function(result){
										if (result.success) {
											 clearInterval(delay);
											 //get the html from the database
											 $.get(self.config.DBUrl+'/api/getMakeEdition?editionID=Transcript-'+self.edition.TCCommunity+"-"+doc.name+"-"+tpage, function(result){
												 if (result.success) {
								//					let newHtml=result.html.replace('<div class="gutter gutter-horizontal" style="width: 10px;"></div>', "").replace('<div class="gutter gutter-vertical" style="width: 10px;"></div>', "").replaceAll('src="/app/data/makeEdition/driver/js/', 'src="../../../common/js/').replaceAll('href="/app/data/makeEdition/driver/css/', 'href="../../../common/css/');
													let newHtml2=result.html.replace('<div class="gutter gutter-horizontal" style="width: 10px;"></div>', "").replace('<div class="gutter gutter-vertical" style="width: 10px;"></div>', "")
													let newHtml3=newHtml2.replaceAll('makeEdition=true', 'makeEdition=false');
													let newHtml5=newHtml3.replace('<div id="staticSearch"></div>', self.config.ssSearch);
													let newHtml6=newHtml5.replaceAll('/app/data/makeEdition/common/', '../../../common/').replaceAll('makeEdition=true', 'makeEdition=false');
													let newHtml7=newHtml6.replaceAll('/app/data/makeEdition/teseida/driver/', '../../../common/');
													let newHtml=newHtml7.replaceAll('/app/data/makeEdition/teseida/common/', '../../../common/');
									
													zip.file('edition/html/transcripts/'+doc.name+'/'+tpage+".html", newHtml);
													 //get the xml...
													 $.get(self.edition.TCurl+"/uri/urn:det:tc:usask:"+self.edition.TCCommunity+"/document="+doc.name+":folio="+tpage+"?type=transcript&format=xml", function(xml) {
														zip.file('edition/xml/transcripts/'+doc.name+'/'+tpage+".xml", xml);
														$.get(self.config.DBUrl+'/api/deleteMakeEdition?editionID=Transcript-'+self.edition.TCCommunity+"-"+doc.name+"-"+tpage, function(result){
															console.log("Written to zip file for "+doc.name+" "+tpage+" (timer: "+current+")")
															cbpage(null);	
													   });
													});
												 } 
											 });
										}
									})
								 }
							 }
						}, function (err) {
							cbdocs(null);
						});
					}
			 }, function (err){
				//	cb(null, []);
					//skip if standalone
					if (self.config.standalone) {
						cb1(null, []);
					} else {
						//lets now get all the collation and commentary files out of pageEntities
						$("#MEProgress").html("Assembling collation and commentary files");
						const doneEntities=[], collEntities=[], commEntities=[], commMenuEntities={}; //coz commMneuEntities is a collection of objects, not an array
						async.mapSeries(pageEntities, function (witness, cbPE) {
						   async.mapSeries(witness.entities, function(myEntity, cbWitness) {
				   
			//			   		cbWitness(null, []);
								if (doneEntities.includes(myEntity.entity) || myEntity.match.indexOf("_")==-1) { //top entity can't have collation or commentary
									if (commEntities.includes(myEntity.entity)) {
										myEntity.hasCommentary=true;
									} else {
										myEntity.hasCommentary=false;
									}
									if (collEntities.includes(myEntity.entity)) {
										myEntity.hasCollation=true;
									} else {
										myEntity.hasCollation=false;
									}
									return(cbWitness(null, []));
								} else {
									let searchEnt=myEntity.entity.replace(":","/");
									myEntity.topMatch=myEntity.match.split("_")[0];
									async.waterfall([
										function (cb) {
											$.get(self.edition.TCurl+'/api/getApprovedCommentaries?entity='+searchEnt, function (json){
												$("#MEProgress").html("Checking for commentary on "+searchEnt);
												if (json.result) {
													if (typeof commMenuEntities[myEntity.topMatch]=="undefined") {
														commMenuEntities[myEntity.topMatch]=[];
													}
													let menuItems=myEntity.match.split("_");
													let menuItem="";
													for (let i=1; i<menuItems.length; i++) {menuItem+=menuItems[i]+" "};
													commMenuEntities[myEntity.topMatch].push({entity: myEntity.entity, item: menuItem.trim()}); 
													commEntities.push(myEntity.entity);
													myEntity.hasCommentary=true;
													//group by top level entitities, to enable menu building
													//create commentary menu and stand-alone html
													if (commentary.filter(entity=>entity.entity==myEntity.topMatch).length==0) {
														commentary.push({entity: myEntity.topMatch, json:[]});
													}
													commentary.filter(entity=>entity.entity==myEntity.topMatch)[0].json.push(json)
													zip.file('edition/html/commentary/'+ myEntity.topMatch+"/"+myEntity.match+'.js', JSON.stringify(json));
		//					   							for (let j=)
													zip.file('edition/xml/commentary/'+ myEntity.topMatch+"/"+ myEntity.match+'.xml', '<div type="commentary" n="'+myEntity.match+'">\r\t<entity>'+json.result[0].entity+'</entity>\r\t<approver>'+json.result[0].approver+"</approver>\r\t<entityTo>"+json.result[0].entityto+"</entityTo>\r\t<text>"+json.result[0].text+"</text>\r\t<date>"+json.result[0].date+"</date>\r</div>");
												} else {
													myEntity.hasCommentary=false;
												}
												cb(null, []);	
											});
										},
										function (arguments, cb) { 
											if (!myEntity.collateable) {
												myEntity.hasCollation=false;
												cb(null, []);
											} else {
												$.get(self.edition.TCurl+"/uri/urn:det:tc:usask:"+searchEnt+"?type=apparatus&format=approved", function (json) {
													$("#MEProgress").html("Checking for collation on "+searchEnt);
													if (typeof json.result !="undefined" && !json.result) {
														myEntity.hasCollation=false;
													} else {
														collEntities.push(myEntity.entity);
														myEntity.hasCollation=true;
														zip.file('edition/html/collation/'+ myEntity.topMatch+"/"+ myEntity.match+'.js', JSON.stringify(json));
													}
													cb(null, []);							
												});
											}
										},
										function (arguments, cb) { 
											if (!myEntity.hasCollation) {
												cb(null, []);
											} else {
												$.get(self.edition.TCurl+"/uri/urn:det:tc:usask:"+searchEnt+"?type=apparatus&format=xml/positive", function (xml) {
													if (typeof xml.result =="undefined") {
														myEntity.hasCollation=true;
														zip.file('edition/xml/collation/'+ myEntity.topMatch+"/"+ myEntity.match+'.xml', xml.replaceAll("&lt;","<"));
													}
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
							zip.file('edition/common/js/editorial/commentary.js', 'const commentary ='+JSON.stringify(commentary));
							zip.file('edition/common/js/mss/pageEntities.js', 'const pageEntities ='+JSON.stringify(pageEntities));
							zip.file('edition/common/js/entities/commMenuEntities.js', 'const commMenuEntities ='+JSON.stringify(commMenuEntities));
							cb1(null, []);
						});  
					}
				}); 
			}
		},
		function (arguments, cb1) {
			if (!self.config.makeEntities) {
			    self.restService.http.get('/app/data/makeEdition/'+self.config.entitiesFile).subscribe(function(myfile) {
			    	let tempEnts=JSON.parse(myfile._body);  //turn into a flat file
			    	for (let i=0; i<tempEnts.length; i++) {
			    		for (let j=0; j<tempEnts[i].entities.length; j++) {
			    			entities.push({"book":tempEnts[i].entity, "line":tempEnts[i].entities[j]});
			    		}
			    	}
			    	cb1(null, []);
			    });
			} else { //construct from collateable entities
				cb1(null, []);
			}
		},
		function (arguments, cb1) { //write the compare files
			if (self.config.makeCompare) {
			   let iterator=0, prevPage="", nextPage="", prevLink="", nextLink="";
			   if (typeof self.config.entitiesLimit!="undefined") {
				   entities.splice(self.config.entitiesLimit);
				}
				async.mapSeries(entities, function(entity, cbpage){
					let doIt=true;
					if (self.config.standalone && (typeof self.config.entities!="undefined")) {
						doIt=false;
						for (let i=0; i<self.config.entities.length; i++) {
							if (self.config.entities[i].book==entity.book && self.config.entities[i].line==entity.line) {
								doIt=true;
								i=self.config.entities.length;
							}
						}
					}
					if (!doIt) {
						cbpage(null);
					} else {
						console.log("starting on: book "+entity.book+" line/stanza "+entity.line)
						$("#MEProgress").html("Creating "+entity.book+"/"+entity.line+".html<br>");
						if (iterator==0) {
							prevPage=null;
						} else {
							 prevPage="'"+entities[iterator-1].book+", "+entities[iterator-1].line+"'";
							 prevLink=entities[iterator-1].book+"/"+entities[iterator-1].line;
						}
						if (iterator==entities.length-1) {
							nextPage=null;
						} else {
							nextPage="'"+entities[iterator+1].book+", "+entities[iterator+1].line+"'";
							nextLink=entities[iterator+1].book+"/"+entities[iterator+1].line;
						} 
						iterator++; 
						//we manipulate the srcdoc to include the variables we need for this page
						let myDOM = new DOMParser().parseFromString(self.comparedoc, "text/html");
						let scriptTag = "<script type='text/javascript' id='driverScript'>var community='"+self.community.attrs.abbr+"', thisBook='"+entity.book+"', thisStanza='"+entity.line+"', prevPage="+prevPage+", nextPage="+nextPage+", title='Bk."+entity.book+", st. "+entity.line+"';\n";
						scriptTag+="\nvar TCurl='"+self.edition.TCurl+"', prevLink='"+prevLink+"', nextLink='"+nextLink+"', makeEdition=true, TCCommunity='"+self.edition.TCCommunity+"'\n<";
						scriptTag +=  "/script>"; 
						$(myDOM).contents().find("head").append(scriptTag); 
						let s = new XMLSerializer();
						$("#MEIframe").attr("srcdoc", s.serializeToString(myDOM));
						//we poll for completion..
						let current=0;
						var delay = setInterval(loader, 500); 
						function loader() {
						  current+=500;  //note: DBUrl is whee we wrote the temporary file
						  $.get(self.config.DBUrl+'/api/isMakeEdition?editionID=Compare-'+self.edition.TCCommunity+"-"+entity.book+"-"+entity.line, function(result){
							if (result.success) {
								 clearInterval(delay);
								 //get the html from the database
								 $.get(self.config.DBUrl+'/api/getMakeEdition?editionID=Compare-'+self.edition.TCCommunity+"-"+entity.book+"-"+entity.line, function(result){
									 if (result.success) {
										let newHtml1=result.html.replaceAll('/app/data/makeEdition/teseida/driver/js/', '../../../common/js/').replaceAll('/app/data/makeEdition/common/', '../../../common/').replaceAll('makeEdition=true', 'makeEdition=false');
										let newHtml=newHtml1.replaceAll('/app/data/makeEdition/teseida/common/', '../../../common/').replace('<div id="staticSearch"></div>', self.config.ssSearch);
										zip.file('edition/html/compare/'+entity.book+'/'+entity.line+".html", newHtml);
										 //get the xml...
										$.get(self.config.DBUrl+'/api/deleteMakeEdition?editionID=Compare-'+self.edition.TCCommunity+"-"+entity.book+"-"+entity.line, function(result){
											console.log("Finished compare for: book "+entity.book+" line "+entity.line+" (time: "+current+")")
											return(cbpage(null));	
										});
									 } 
								 });
							 }
						  })
					   }
					}
				}, function (err) {
					cb1(null, []);
				});
			 } else {
				cb1(null, []);
			}
		}, 
		function (arguments, cb1) { //write the index file for everything
		  if (self.config.standalone) {
			   cb1(null, []);
		  } else {
			  self.restService.http.get('/app/data/makeEdition/index.html').subscribe(function(indexfile) {
				$("#MEProgress").html("Writing index.html");								 
				let myFullTitle=self.edition.title;
				let myShortTitle=self.edition.shorttitle;
				if (pageEntities[0].entities.length==0) {
					$("#MEProgress").html("It seems no pages have been found for expression as HTML in this edition. Check your settings!");
					var startTranscriptPage="";
				} else {
					var startTranscriptPage="html/transcripts/"+pageEntities[0].witness+"/"+pageEntities[0].entities[0].page+".html";
				}
				if (!self.edition.whole) {
					if (self.config.hasOwnProperty("longTitle")) {
						myFullTitle=self.config.longTitle;
					}
					if (self.config.hasOwnProperty("shortTitle")) {
						myShortTitle=self.config.shortTitle;
					}
					if (self.config.hasOwnProperty("firstTranscript")) {
						startTranscriptPage="html/transcripts/"+self.config.firstTranscript+".html";
					}
				}
				indexfile._body=indexfile._body.replaceAll('fullTitle', myFullTitle);
				indexfile._body=indexfile._body.replaceAll('startPage', startTranscriptPage);
				zip.file('edition/index.html',indexfile._body);
				cb1(null, []);
			})
		}
	  }
	], function (err) {
		$("#MEProgress").html("Generating zipfile");								 
		zip.generateAsync({ type: 'blob' }).then(function (content) {
			FileSaver.saveAs(content, 'edition.zip'); 
			if (pageEntities[0].entities.length==0) {
				$("#MEProgress").html("Warning: edition completed, but it appears no pages for expression as HTML were found");
				self.finished=true;
				return;
			} else {
				$("#MEProgress").html("Edition completed");
				self.finished=true;
				return;
			}
		});
	}); 	  	
  }
});

//from https://stackoverflow.com/questions/44096065/download-images-and-download-as-zip-with-jszip-and-js-zip-utils
function urlToPromise(url,cb) {
	return new Promise(function(resolve, reject) {
		JSZipUtils.getBinaryContent(url, function (err, data) {
			if(err) {
				reject(err);
			} else {
				resolve(data);
				cb(null, []);
			}
		});
	});
}


function loadBaseFiles(zip, self, callback) {
  if (self.config.standalone) {
  	async.mapSeries(self.config.localFiles, function (myFile, cbfiles) {
  		zip.file(myFile.dest, urlToPromise(myFile.src, cbfiles), {binary:true});
  	}, function (err) {
  		callback();
  	});
  } else {
	  async.waterfall([
		function(cb) {
			self.restService.http.get('/app/data/makeEdition/common/js/async.js').subscribe(function(myfile) {
				zip.file('edition/common/js/async.js',myfile._body);
				cb(null, []);
			})
		},
		function(arguments, cb) {
			self.restService.http.get('/app/data/makeEdition/common/js/clay.js').subscribe(function(myfile) {
				zip.file('edition/common/js/clay.js',myfile._body);
				cb(null, []);
			})
		},
		 function(arguments, cb) {
			self.restService.http.get('/app/data/makeEdition/common/js/split.js').subscribe(function(myfile) {
				zip.file('edition/common/js/split.js',myfile._body);
				cb(null, []);
			})
		},
		 function(arguments, cb) {
			self.restService.http.get('/app/data/makeEdition/common/js/common.js').subscribe(function(myfile) {
				zip.file('edition/common/js/common.js',myfile._body);
				cb(null, []);
			})
		},
		 function(arguments, cb) {
			self.restService.http.get('/app/data/makeEdition/common/js/transcript.js').subscribe(function(myfile) {
				zip.file('edition/common/js/transcript.js',myfile._body);
				cb(null, []);
			})
		},
		 function(arguments, cb) {
			self.restService.http.get('/app/data/makeEdition/common/js/palette.js').subscribe(function(myfile) {
				zip.file('edition/common/js/palette.js',myfile._body);
				cb(null, []);
			})
		},
		function(arguments, cb) {
			self.restService.http.get('/app/data/makeEdition/common/js/palette.js').subscribe(function(myfile) {
				zip.file('edition/common/js/collation.js',myfile._body);
				cb(null, []);
			})
		},
		function(arguments, cb) {
			self.restService.http.get('/app/data/makeEdition/common/js/dw_tooltips/js/dw_event.js').subscribe(function(myfile) {
				zip.file('edition/common/js/dw_tooltips/js/dw_event.js',myfile._body);
				cb(null, []);
			})
		},
		function(arguments, cb) {
			self.restService.http.get('/app/data/makeEdition/common/js/dw_tooltips/js/dw_tooltip_aux.js').subscribe(function(myfile) {
				zip.file('edition/common/js/dw_tooltips/js/dw_tooltip_aux.js',myfile._body);
				cb(null, []);
			})
		},
		function(arguments, cb) {
			self.restService.http.get('/app/data/makeEdition/common/js/dw_tooltips/js/dw_tooltip.js').subscribe(function(myfile) {
				zip.file('edition/common/js/dw_tooltips/js/dw_tooltip.js',myfile._body);
				cb(null, []);
			})
		},
		function(arguments, cb) {
			self.restService.http.get('/app/data/makeEdition/common/js/dw_tooltips/js/dw_viewport.js').subscribe(function(myfile) {
				zip.file('edition/common/js/dw_tooltips/js/dw_viewport.js',myfile._body);
				cb(null, []);
			})
		},
		 function(arguments, cb) {
			self.restService.http.get('/app/data/makeEdition/common/css/common.css').subscribe(function(myfile) {
				zip.file('edition/common/css/common.css',myfile._body);
				cb(null, []);
			})
		},
		 function(arguments, cb) {
			self.restService.http.get('/app/data/makeEdition/common/css/dropdown.css').subscribe(function(myfile) {
				zip.file('edition/common/css/dropdown.css',myfile._body);
				cb(null, []);
			})
		},
		function(arguments, cb) {
			self.restService.http.get('/app/data/makeEdition/common/css/transcript.css').subscribe(function(myfile) {
				zip.file('edition/common/css/transcript.css',myfile._body);
				cb(null, []);
			})
		},
		function(arguments, cb) {
			zip.file('edition/common/images/close.png', urlToPromise('/app/data/makeEdition/common/images/close.png', cb), {binary:true});
		},
		function(arguments, cb) {
			zip.file('edition/common/images/iconPrev.png', urlToPromise('/app/data/makeEdition/common/images/iconPrev.png', cb), {binary:true});
		},
		function(arguments, cb) {
			zip.file('edition/common/images/iconNext.png', urlToPromise('/app/data/makeEdition/common/images/iconNext.png', cb), {binary:true});
		},
		function(arguments, cb) {
			zip.file('edition/common/images/inklesslogo.png', urlToPromise('/app/data/makeEdition/common/images/inklesslogo.png', cb), {binary:true});
		},
		function(arguments, cb) {
			zip.file('edition/common/images/right-arrow-brown.png', urlToPromise('/app/data/makeEdition/common/images/right-arrow-brown.png', cb), {binary:true});
		},
		function(arguments, cb) {
			zip.file('edition/common/images/down-arrow-brown.png', urlToPromise('/app/data/makeEdition/common/images/down-arrow-brown.png', cb), {binary:true});
		},
		function(arguments, cb) {
			zip.file('edition/common/images/splash.jpg', urlToPromise('/app/data/makeEdition/common/images/splash.jpg', cb), {binary:true});
		}
	  ], function (err) {
			callback();
	 });
  }
}

window.uploadPageDone=function(){
	//here we inject extra data into the file we are creating ...
	var scriptTag = "<script>var peter=1<";
	scriptTag +=  "/script>";
	$("#MEIframe").contents().find("head").append(scriptTag);
};

function makeMatch(entity) {
	match="";
	let index=entity.indexOf("entity=")+7;
	while (index>0) {
		let index2=entity.indexOf(":", index);
		if (index2>0) {
			match+=entity.slice(index, index2)+"_";
			index2=entity.indexOf("=", index2)+1;
		} else {
			match+=entity.slice(index)
		}
		index=index2;
	}
	return(match);
}
module.exports = CommunityMakeEditionComponent;
