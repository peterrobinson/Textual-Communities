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
  ngOnInit: function() {
  },
  toggleType: function(value) {
  	this.edition.whole=value;
  	if (this.edition.whole) {
  		this.error="";
  		this.edition.title="An edition of "+this.state.community.attrs.longName;
		this.edition.editor="Edited by "+this.state.authUser.attrs.local.name;
  	}
  },
  filechange: function(filecontent) {
  try {
     this.config = JSON.parse(filecontent);
     this.error="";
     if (this.config.hasOwnProperty("longTitle")) this.edition.title=this.config.longTitle;
     if (this.config.hasOwnProperty("editor")) this.edition.editor=this.config.editor;
    
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
	async.waterfall([
		function (cb1) {
			loadBaseFiles(zip, self, function callback(){
				cb1(null,[]);
			});
		},
		function(arguments, cb1) {
			//get live documents
			 $.get(config.BACKEND_URL+'getDocNames/?community='+self.state.community._id, function(res) {
			 	if (self.edition.whole || (!self.edition.whole && !self.config.hasOwnProperty("documents"))) {
			 		for (let i=0; i<res.length; i++) {
			 			documents.push(res[i].name);
			 		}
			 	} else {
			 		for (let i=0; i<self.config.documents.length; i++) {
			 			let isDoc=res.filter(function (obj){return obj.name==self.config.documents[i]})[0];
			 			if (isDoc) {
			 				documents.push(self.config.documents[i]);
			 			} else {
			 				self.error+="Document '"+self.config.documents[i]+"', specified in 'documents' in the edition configuration file, does not exist in this community"
			 			}
			 		}
			 	}
				cb1(null, []);
			 });
		},
		function(arguments, cb1) {
			//fpr each level of entities in the files which are not terminal, generate ass list of 
			//what mss 
			var mssJs=[];
			//we might choose to filter the entities in the config file
			var seekEntities=[];
			if (self.edition.whole || !self.edition.whole && !self.config.hasOwnProperty("entities")) {
				for (let i=0; i<self.state.community.attrs.entities.length; i++) {
					seekEntities.push(self.state.community.attrs.entities[i].attrs.entityName)
				}
			} else {
				for (let i=0; i<self.config.entities.length; i++) {
					seekEntities.push(self.config.entities[i]);
				}
			}
//				async.mapSeries(self.state.community.attrs.entities, function (entity, cbents){
			async.mapSeries(seekEntities, function (entity, cbents){
				 var thisEnt=entity.slice(entity.indexOf("entity=")+7);
				 $.get(config.host_url+'/uri/urn:det:tc:'+config.authority+':'+self.community.attrs.abbr+'/entity='+thisEnt+':document=*?type=list', function (myfile) {
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
		},
		function(arguments, cb1) {
			var pageEntities=[], commentary=[];
			async.mapSeries(documents, function (doc, cbdocs){
				pageEntities.push({witness:doc, entities:[]})
				$.get(config.host_url+'/uri/urn:det:tc:'+config.authority+':'+self.community.attrs.abbr+'/document='+doc+':*=*?type=list', function (myfile) {
					//right. Let's get the xml and html for each page...
					//set the iframe source to load the page
					let iterator=0, prevPage="", nextPage="";
					async.mapSeries(myfile, function(tpage, cbpage){
						if (iterator==0) {
							prevPage="null"
						} else {
							prevPage=myfile[iterator-1].name;
						}
						if (iterator==myfile.length-1) {
							nextPage="null"
						} else {
							nextPage=myfile[iterator+1].name;
						}
						iterator++;
						$("#MEIframe").attr("src", config.host_url+"/app/data/makeEdition/driver/index.html?community="+self.community.attrs.abbr+"&ms="+doc+"&page="+tpage.name+"&prevPage="+prevPage+"&nextPage="+nextPage+"&title="+self.edition.title);
						//we poll for completion..
						let timeout=4000;
						let current=0;
						 $.get(config.host_url+'/uri/urn:det:tc:usask:'+self.community.attrs.abbr+'/entity=*:document='+doc+':pb='+tpage.name+'?type=list', function (pEnts) {
							let thisEnt=pageEntities.filter(function (obj){return obj.witness==doc})[0];
							for (let i=0; i<pEnts.length; i++) {
								//create match form for entity
								let match="";
								let index=pEnts[i].entity.indexOf("entity=")+7;
								let index2=pEnts[i].entity.indexOf(":", index);
								if (index2>-1) {
									let index3=pEnts[i].entity.indexOf("=", index2);
									match=pEnts[i].entity.slice(index, index2)+"_"+pEnts[i].entity.slice(index3+1);
								} else {
									match=pEnts[i].entity.slice(index);
								}
								thisEnt.entities.push({page: tpage.name, match: match, entity: pEnts[i].entity, collateable: pEnts[i].collateable});
							}
							var delay = setInterval(loader, 100); 
							function loader() {
								if (current == timeout) {
								  //not found...something went wrong in writing it
								  console.log("not written: ms"+doc+" page "+tpage.name)
								  clearInterval(delay);
								  cbpage(null);
								  return;
								} else {
								  current+=100;
								  $.get(config.host_url+'/api/isMakeEdition?editionID=Transcript-'+self.community.attrs.abbr+"-"+doc+"-"+tpage.name, function(result){
									if (result.success) {
										 clearInterval(delay);
										 $("#MEProgress").html("Creating "+doc+"/"+tpage.name+".html<br>");
										 //get the html from the database
										 $.get(config.host_url+'/api/getMakeEdition?editionID=Transcript-'+self.community.attrs.abbr+"-"+doc+"-"+tpage.name, function(result){
											 if (result.success) {
												let newHtml=result.html.replace('<div class="gutter gutter-horizontal" style="width: 10px;"></div>', "").replace('<div class="gutter gutter-vertical" style="width: 10px;"></div>', "").replaceAll('src="js/', 'src="../../../common/js/').replaceAll('href="css/', 'href="../../../common/css/').replaceAll('href="http://www.inklesseditions.com/CT/common/css/','href="../../../common/css/');
												 zip.file('edition/html/transcripts/'+doc+'/'+tpage.name+".html", newHtml);
												 //get the xml...
												 $.get(config.host_url+"/uri/urn:det:tc:usask:"+self.community.attrs.abbr+"/document="+doc+":folio="+tpage.name+"?type=transcript&format=xml", function(xml) {
													zip.file('edition/xml/transcripts/'+doc+'/'+tpage.name+".xml", xml);
													$.get(config.host_url+'/api/deleteMakeEdition?editionID=Transcript-'+self.community.attrs.abbr+"-"+doc+"-"+tpage.name, function(result){
														cbpage(null);	
														return;
												   });
												});
											 } 
										 });
									}
								  })
								}
							 }
						});
					}, function (err) {
						cbdocs(null);
					});
				 });
			}, function (err){
			//	cb(null, []);
				//lets now get all the collation and commentary files out of pageEntities
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
									$.get(config.host_url+'/api/getApprovedCommentaries?entity='+searchEnt, function (json){
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
									$.get(config.host_url+"/uri/urn:det:tc:usask:"+searchEnt+"?type=apparatus&format=approved", function (json) {
										if (typeof json.result !="undefined" && !json.result) {
											myEntity.hasCollation=false;
										} else {
											collEntities.push(myEntity.entity);
											myEntity.hasCollation=true;
											zip.file('edition/html/collation/'+ myEntity.topMatch+"/"+ myEntity.match+'.js', JSON.stringify(json));
										}
										cb(null, []);							
									});
								},
								function (arguments, cb) { 
									if (!myEntity.hasCollation) {
										cb(null, []);
									} else {
										$.get(config.host_url+"/uri/urn:det:tc:usask:"+searchEnt+"?type=apparatus&format=xml/positive", function (xml) {
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
			}); 
		}
	], function (err) {
		$("#MEProgress").html("Generating zipfile");								 
		zip.generateAsync({ type: 'blob' }).then(function (content) {
			FileSaver.saveAs(content, 'edition.zip'); 
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
  async.waterfall([
	function (cb) {
		self.restService.http.get('/app/data/makeEdition/index.html').subscribe(function(indexfile) {
			indexfile._body.replace(' <title id="title"></title>', '<title id="title">'+self.edition.title+'</title>')
			zip.file('edition/index.html',indexfile._body);
			cb(null, []);
		})
	},
	function(arguments, cb) {
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
		self.restService.http.get('/app/data/makeEdition/common/js/witnesses.js').subscribe(function(myfile) {
			zip.file('edition/common/js/mss/witnesses.js',myfile._body);
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
	}
  ], function (err) {
	    callback();
 });
}

module.exports = CommunityMakeEditionComponent;
