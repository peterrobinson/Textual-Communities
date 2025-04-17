var $ = require('jquery')
  , CommunityService = require('./services/community')
  , UIService = require('./services/ui')
  , config = require('./config')
  , BrowserFunctionService = require('./services/functions')
  , DualFunctionService = require('./services/dualfunctions')
  , async = require('async')
;

var retrieveSpellingsCollationComponent = ng.core.Component({
  selector: 'tc-managemodal-retrievespellingscollation',
  templateUrl: '/app/retrievespellingscollation.html',
  inputs : ['community'],
  directives: [
    require('./directives/modaldraggable'),
    require('./directives/filereader'),
  ],
}).Class({
  constructor: [CommunityService, UIService, function(communityService, uiService) {
//    var Doc = TCService.Doc, doc = new Doc()
    this._communityService = communityService;
    this.success="";
    this.message="";
    this.regMode=1;
    this.uiService = uiService;
    this.skipValidation=false;
    }],
  closeModalRSJ: function() {
    this.message=this.success="";
//    $('#MMADdiv').css("margin-top", "30px");
//    $('#MMADbutton').css("margin-top", "20px");
    $('#manageModal').modal('hide');
  },
  filechange: function(filecontent) {
    this.filecontent = filecontent;
  },
  ngOnChanges: function() {
    this.success="";
    this.message="";
    $('#manageModal').width("600px");
    $('#manageModal').height("300px");
  },
  chooseMode: function(value) {
  	this.regMode=value;
  },
  infoRSJ: function(){
  	alert("This choice extracts spellings from a collation JSON file and outputs the spellings, organized in various ways, into a TEI/XML apparatus, NEXUS or JSON file, ready for further processing.\r\rYou should use a JSON file created from the 'Retrieve Collations' item for this conversion.");
  },
  submit: function(){
      var self=this;
      var text = this.filecontent;
      if (!text) {
        this.message = 'Choose a file';
        $('#manageModal').height("220px");
        return;
      } else {
          const fileN = $("#FRinput")[0].files[0].name;
          let words=false;
          let fType="lemma";
          if (this.regMode==2) {
          	words=true;
          	fType="line";
          }
          $('#manageModal').height("220px");
          self.message="";
          if (this.regMode==1 || this.regMode==2) {
			  result=createXMLApp(JSON.parse(text), self, fileN, words);
//				 result=result.replace(/<br\/>/gi, "\r").replace(/&nbsp;/gi," ");
			 if ($('[name="TEI-1"]').is(':checked') || $('[name="TEI-2"]').is(':checked')) {
				 BrowserFunctionService.download(result, self.community.attrs.abbr+"-"+fType+"-regspellings-app.xml", "application/xml");
			 }
			 if ($('[name="NEXUS-1"]').is(':checked') || $('[name="NEXUS-2"]').is(':checked')) {
				let user=self.uiService.state.authUser.attrs.local.name;
				let email=self.uiService.state.authUser.attrs.local.email;
				let output=DualFunctionService.makeNEXUS(result, fileN, user, email);
				output=output.replace(/<br\/>/gi, "\r").replace(/&nbsp;/gi," ");
				BrowserFunctionService.download(output, self.community.attrs.abbr+"-"+fType+"-NEXUS.nex", "text/plain");
			 }
			 if ($('[name="JSON"]').is(':checked')) {
				 let convert=BrowserFunctionService.processSpellings(result, []);
				 BrowserFunctionService.download(convert.source, self.community.attrs.abbr+"-regspellings.json", "application/json");
			 }
			 self.message="";
			 self.success="Created output file of spellings. Check your downloads folder.";
		  } else if (this.regMode==3) {
		  	 result=createXMLApp(JSON.parse(text), self, fileN, true);
		  	 let output=BrowserFunctionService.createAllSpellingsJSON(result);
		  	 self.success="Created file of all spellings: "+output.instances+" instances of "+output.forms+" found. Check your downloads folder.";
		  	 BrowserFunctionService.download(output.source, self.community.attrs.abbr+"-allspellings.json", "application/json");
		  }
      }
  }
});


function createXMLApp(apps, self, fileN, words) {  //creates XML with spellings organized by word or regularized form 		
 	let myDate=(new Date()).toString();
	let xml="";
	let user=self.uiService.state.authUser.attrs.local.name;
	let community=self.community.attrs.abbr;
	let email=self.uiService.state.authUser.attrs.local.email;
	let currTopEntity="";
	var uniqueWits=[]; //update each time we get a new top entity. Maybe no need?
	let wordMessage;
	if (!words) {
		wordMessage="against each variant lemma"
	} else {
		wordMessage="within each line"
	}
	let start='<?xml version="1.0" encoding="utf-8"?>\r<TEI xmlns="http://www.tei-c.org/ns/1.0">\r <teiHeader>\r <fileDesc>\r<titleStmt>\r<title>Apparatus of spelling variants organized by regularized form '+wordMessage+' for '+user+' ('+email+'), generated at '+myDate+', from file '+fileN+' </title>\r</titleStmt>\r<publicationStmt><p rend="ital">dummy</p></publicationStmt>\r  <sourceDesc>\r   <listWit>\r';
	apps.map(function(app){
		xml+=doMakeAPP(app.collation, app.entity, words);
	})
	xml="<div>\r"+xml+"\r</div>";
	let myXMLDOM = new DOMParser().parseFromString(xml, "text/xml");
	let witnesses=myXMLDOM.getElementsByTagName("idno");  //ref for dante, idno for chaucer
	self.success= witnesses.length+" references to witnesses found";
	let witsfound=[];
	 for (let i=0; i<witnesses.length; i++) {
		if (!witsfound.includes($(witnesses[i]).html())) witsfound.push($(witnesses[i]).html());
	 }
	 //sort the wits!
	 witsfound.sort();
	 this.success=witsfound.length+" distinct witnesses found: "+witsfound.join(" ");
	 for (let i=0; i<witsfound.length; i++) {
		start+="<witness>"+witsfound[i]+"</witness>"
	 }
	 start+="\r  </listWit>\r  </sourceDesc>\r </fileDesc>\r </teiHeader>\r <text>\r  <body>\r  "
	 xml=start+xml+"\r  </body>\r </text>\r</TEI>";
	 xml=prettyfiXML(xml)
	 return(xml);
}

function doMakeAPP(collation, entity, words, active) { //if onlyReg false: show original spellings
	var inWits=[];
	currWits=[];
	outMSS=[];
//	var collation=JSON.parse(apparatus);
	//there could be duplicate readings, a by-product of overlapping variants. Resolve them.
	collation=resolveDuplicates(collation);
	//ok. There are faults in the way the XML apparatus does things on overlaps etc. So we go into the json apparatus
	 //this is the lemma
	if (!words) { //work direct from JSON full app. Here we treat overlapped apps differently
		var vartext="";
		var appText='<ab n="'+entity+'-APP">';
		for (var i=0, n=0; i<collation.structure.apparatus.length; i++, n++) {
			rdgNo=0;
			appText+='<app from="'+((i+1)*2)+'" n="'+entity+'" to="'+((i+1)*2)+ '" type="main">';
			for (var j=0; j<collation.structure.apparatus[i].readings.length; j++) {
				if (collation.structure.apparatus[i].readings[j].created) continue;
				if ((collation.structure.apparatus[i].readings[j].type=="om" || collation.structure.apparatus[i].readings[j].type=="om_verse") && collation.structure.apparatus[i].readings[j].overlap_status!="duplicate") {
					for (var m=0; m<collation.structure.apparatus[i].readings[j].witnesses.length; m++) {
						var thisWit=collation.structure.apparatus[i].readings[j].witnesses[m];
						if (currWits.includes(thisWit) || thisWit.indexOf("-")!=-1) {
							//deal with active mss here
						}  
				   }
				} else {
					vartext="";
					for (k=0; k<collation.structure.apparatus[i].readings[j].text.length; k++) {
						vartext+=collation.structure.apparatus[i].readings[j].text[k].interface;
						if (k<collation.structure.apparatus[i].readings[j].text.length-1) vartext+=" ";
					}
					if (j==0) {
						//nothing to be done here
					}  else {
						if (collation.structure.apparatus[i].readings[j].overlap_status!="duplicate")
						 {
							//nothing here either
						}
					}
					if (collation.structure.apparatus[i].readings[j].overlap_status=="duplicate") {/* appText+=" (<i>overlapped variation</i>) " */}
					else {
						appText+=createUnRegRdg(collation.structure.apparatus[i].readings[j], n, collation.context);
					}
				}
			}
			appText+="</app>"
			//check overlap readings existence...
			if (collation.structure.hasOwnProperty("apparatus2"))  {
				var iO=-1;
				//check we have an entry with a start associating with this word..
				for (let x=0; x<collation.structure.apparatus2.length; x++) {
					if (collation.structure.apparatus2[x].start==collation.structure.apparatus[i].start) iO=x;
				}
				if (iO!=-1) { 
					n++;
					var overWits=[];   
					overLem="";
					//far simpler!!! get lemma first. This will be the first reading found
					for (let x=0; x<collation.structure.apparatus2[iO].readings[0].text.length; x++) {
						overLem+=collation.structure.apparatus2[iO].readings[0].text[x].interface;
						if (x<collation.structure.apparatus2[iO].readings[0].text.length-1) overLem+=" ";
					}
					//now populate the overWits structure with unreg readings
					for (let x=1; x<collation.structure.apparatus2[iO].readings.length; x++) {
						var OWT="";
						var OWW=collation.structure.apparatus2[iO].readings[x].witnesses;
						var spellings=[];
						for (let y=0; y<OWW.length; y++) {
							var thisSp="";
							for (let z=0; z<collation.structure.apparatus2[iO].readings[x].text.length;z++) {
								thisSp+=collation.structure.apparatus2[iO].readings[x].text[z][OWW[y]].original;
								if (z<collation.structure.apparatus2[iO].readings[x].text.length-1) thisSp+=" ";
							}
							//do we have this spelling already??
							var alreadySp=spellings.filter(function (obj){return obj.spelling === thisSp;})[0]
							if (alreadySp) alreadySp.wits.push(OWW[y]);
							else spellings.push({wits: [OWW[y]], spelling: thisSp})
						}
						for (let y=0; y<collation.structure.apparatus2[iO].readings[x].text.length; y++) {
							OWT+=collation.structure.apparatus2[iO].readings[x].text[y].interface;
							if (y<collation.structure.apparatus2[iO].readings[x].text.length-1) OWT+=" ";
						}
						for (let y=0; y<spellings.length; y++) {
							let witAttr="";
							let rdgIds="";
							for (let z=0; z<spellings[y].wits.length; z++) {
									witAttr+=spellings[y].wits[z];
									if (z<spellings[y].wits.length-1) {witAttr+=" "};
									rdgIds+="<idno>"+spellings[y].wits[z]+"</idno>"
							}
							rdgNo++;
							appText+='<rdg type="overlap" n="'+rdgNo+'" varSeq="'+rdgNo+'" wit="'+witAttr+'">'+spellings[y].spelling+'<wit>'+rdgIds+'</wit></rdg>'
						}
					}
					appText+="</app>"
				}
			}
		}
		appText+="</ab>"
	}
	if (words) {
			//used in transform to generate spelling tables
		//get the base..
	//	appText+="<p class='lemma'>Base text: ";
		var appText='<ab n="'+entity+'-words-APP">';
		for (var i=0; i<collation.structure.apparatus.length; i++) {
			for (j=0; j<collation.structure.apparatus[i].readings[0].text.length; j++) {
				//nothing to do here
			}
			appText+=" ";
		}
		//now get all the spellings...
		var spellings=[];
		for (var i=0; i<collation.structure.apparatus.length; i++) {
			for (j=0; j<collation.structure.apparatus[i].readings.length; j++) {
				for (k=0; k<collation.structure.apparatus[i].readings[j].text.length; k++) {
					for (var p=0; p<collation.structure.apparatus[i].readings[j].text[k].reading.length; p++) {
						var thisWit=collation.structure.apparatus[i].readings[j].text[k].reading[p];
						if (thisWit!="Base") {
							if (collation.structure.apparatus[i].readings[j].text[k][thisWit] ) {
								var reg="_"+collation.structure.apparatus[i].readings[j].text[k].interface;
								var orig="_"+collation.structure.apparatus[i].readings[j].text[k][thisWit].original;
								if (orig=="length") orig="Length";  //because length is a reserved key, naturally
								//actually ... lots of reserved words. at every with etc. so preface with x and remove
								if ((typeof spellings[reg]!="undefined") && (typeof spellings[reg][orig]!="undefined"))  {
									if (typeof spellings[reg][orig].wits == "undefined") { //wierdly..spellings[reg][orig] can be wrongly defined
										spellings[reg][orig]={wits:[thisWit]};
									}
									if (!spellings[reg][orig].wits.includes(thisWit)) {
										spellings[reg][orig].wits.push(thisWit);
									}
								} else if (typeof spellings[reg]!="undefined") {
									spellings[reg][orig]={wits:[thisWit]};
								} else {
									spellings[reg]=[];
									spellings[reg][orig]={wits:[thisWit]};
								}
							}
						}
					}
				} //deal with subreadings...
				if (collation.structure.apparatus[i].readings[j].standoff_subreadings) {
					for (var k=0; k<collation.structure.apparatus[i].readings[j].standoff_subreadings.length; k++) {
						var thisWit=collation.structure.apparatus[i].readings[j].standoff_subreadings[k];
						if (thisWit!="Base") {
							if (collation.structure.apparatus[i].readings[j].SR_text[thisWit]) {
								for (var m=0; m<collation.structure.apparatus[i].readings[j].SR_text[thisWit].text.length; m++) {
									var reg="_"+collation.structure.apparatus[i].readings[j].SR_text[thisWit].text[m].interface;
									var orig="_"+collation.structure.apparatus[i].readings[j].SR_text[thisWit].text[m][thisWit].original;
									if (spellings[reg] && spellings[reg][orig])  {
										if (!spellings[reg][orig].wits.includes(thisWit)) {
											spellings[reg][orig].wits.push(thisWit);
										}
									} else if (spellings[reg]) {
										spellings[reg][orig]={wits:[thisWit]};
									} else {
										spellings[reg]=[];
										spellings[reg][orig]={wits:[thisWit]};
									}
								}
							}
						}
					}
				}
			}
		}
		//ok... extract all the regularizations
		var sortSpells=Object.keys(spellings);
		for (var i=0; i<sortSpells.length; i++) {
			appText+='<app type="main" n="'+collation.context+'">'
			var theseSpells=Object.keys(spellings[sortSpells[i]]);
			for (var j=0; j<theseSpells.length; j++) {
				spellings[sortSpells[i]][theseSpells[j]].wits.sort();
				let mySpelling=[theseSpells[j]][0].slice(1); //remove leading _ from spelling
				var spWits="";
				var spIds="";
				for (var k=0; k<spellings[sortSpells[i]][theseSpells[j]].wits.length; k++) {
					var thisWit=spellings[sortSpells[i]][theseSpells[j]].wits[k];
					spWits+=thisWit+" ";
					spIds+="<idno>"+thisWit+"</idno>"
				}
				appText+='<rdg n="'+(j+1)+'" varSeq="'+(j+1)+'" wit="'+spWits.trim()+'">'+mySpelling+'<wit>'+spIds+'</wit></rdg>'
			}
			appText+="</app>"
		}
		appText+="</ab>"
	}
	return(appText);
}

function resolveDuplicates(collation) { //needed because overlap readings can create a duplicate lemma
	for (var i=0; i<collation.structure.apparatus.length; i++) {
		for (var j=0; j<collation.structure.apparatus[i].readings.length; j++) {
			var origWord="";
			for (var m=0; m<collation.structure.apparatus[i].readings[j].text.length; m++) {
				origWord+=collation.structure.apparatus[i].readings[j].text[m].interface;
				if (m<collation.structure.apparatus[i].readings[j].text.length-1) origWord+=" ";
			}
			for (var k=j+1; k<collation.structure.apparatus[i].readings.length; k++) {
				var rdgWord="";
				for (var m=0; m<collation.structure.apparatus[i].readings[k].text.length; m++)  {
					rdgWord+=collation.structure.apparatus[i].readings[k].text[m].interface;
					if (m<collation.structure.apparatus[i].readings[k].text.length-1) rdgWord+=" ";
				}
				if (rdgWord==origWord) { //same lemma! collapse the two
					for (var n=0; n<collation.structure.apparatus[i].readings[k].witnesses.length; n++) {
						var thisWit=collation.structure.apparatus[i].readings[k].witnesses[n];
						collation.structure.apparatus[i].readings[j].witnesses.push(thisWit);
					}
					collation.structure.apparatus[i].readings[j].witnesses.sort();
					//now deal with each reading in the text structure
					for (var p=0; p<collation.structure.apparatus[i].readings[k].text.length; p++) {
						for (var q=0; q<collation.structure.apparatus[i].readings[k].text[p].reading.length; q++) {
							var thisWit=collation.structure.apparatus[i].readings[k].text[p].reading[q];
							collation.structure.apparatus[i].readings[j].text[p].reading.push(thisWit);
							collation.structure.apparatus[i].readings[j].text[p][thisWit]=collation.structure.apparatus[i].readings[k].text[p][thisWit];
						}
						collation.structure.apparatus[i].readings[j].text[p].reading.sort();
					}
					//delete the duplicate reading
					collation.structure.apparatus[i].readings.splice(k, 1);
					k--;
				}
			}
		}
	}
	return(collation);
}

function createUnRegRdg(rdg, vno, context) { 
	//dig into the full apparatus to create an apparatus showing the fully regularized readings
	//for each witness to each reading here...
	//note offset. First reading in xml app is always info on block present/absent. So appN is one less: skip for app
	var apparatus=""; 
	var srcWits=[];
	for (var m=0; m<rdg.witnesses.length; m++) {
		srcWits.push({name: rdg.witnesses[m], text:"", spellWits: []});  //use ms name as key
	}
	for (var k=0; k<rdg.text.length; k++) { //we can do this two ways. Treat as phrases, or as single words
	//phrases! note that this is a bit tricky.. rdg.witnesses MAY include mss which don't actually have words here..
	//(they might be in overlap, or somewhere, who knows)
		for (var j=0; j<rdg.text[k].reading.length; j++) {
			//find srcWit corresponding to this reading wit...
			for (var n=0; n<srcWits.length && srcWits[n].name!=rdg.text[k].reading[j]; n++);
			if ((typeof srcWits[n]=="undefined")) {
				var boo=1; //when for example we have Ht-orig but I think no corresponding orig (phrase reg? eg RE 218)
			} else {
				srcWits[n].text+=rdg.text[k][rdg.text[k].reading[j]].original;  //build up srcWits text
				if (k<rdg.text.length-1) srcWits[n].text+=" ";
			}
		}
	}
		//there could be subreadings here. If so... the wit will appear in standoff_subreadings, and its text will be in SR_text
	for (var j=0; j<srcWits.length; j++) {
		if (srcWits[j].text=="") {
			if (rdg.hasOwnProperty("standoff_subreadings") && rdg.standoff_subreadings.includes(srcWits[j].name)) {
				if (rdg.SR_text[srcWits[j].name]) {
					for (var k=0; k<rdg.SR_text[srcWits[j].name].text.length; k++) {
						srcWits[j].text+=rdg.SR_text[srcWits[j].name].text[k].interface;
						if (k<rdg.SR_text[srcWits[j].name].text.length-1) srcWits[j].text+=" ";
					}
				}
			}
		}
	}
	for (var j=0; j<srcWits.length; j++) {
		srcWits[j].spellWits.push(srcWits[j].name);
		for (var k=j+1; k<srcWits.length; k++) { //build lists of wits with spellings
			if (srcWits[j].text==srcWits[k].text) {
				srcWits[j].spellWits.push(srcWits[k].name);
				srcWits.splice(k, 1);
				k--;
			}
		}
	}  
	for (var i=0; i<srcWits.length; i++) {
		let spellingMss="";
		let spellingWits="";
		for (var j=0; j<srcWits[i].spellWits.length; j++) {
			spellingMss+=srcWits[i].spellWits[j];
			spellingWits+='<idno>'+srcWits[i].spellWits[j]+'</idno>'
			if (j<srcWits[i].spellWits.length-1) spellingMss+=" ";
		}
		rdgNo++;
		//look for conversion problems here
		if (srcWits[i].text.indexOf("''")>-1) messages+="<br>Error in "+context+": \"''\" found in reading. This will likely cause conversion errors";
		if (srcWits[i].text.indexOf("&lt;am")>-1) messages+="<br>Possible error in "+context+": \"&lt;am\" found in reading. Check for valid xml, etc";
		if (srcWits[i].text.indexOf("&lt;ex")>-1) messages+="<br>Possible error in "+context+": \"&lt;ex\" found in reading. Check for valid xml, etc";
		if (srcWits[i].text.indexOf("&lt;/am")>-1) messages+="<br>Possible error in "+context+": \"&lt;/am\" found in reading. Check for valid xml, etc";
		if (srcWits[i].text.indexOf("&lt;/ex")>-1) messages+="<br>Possible error in "+context+": \"&lt;/ex\" found in reading. Check for valid xml, etc";
		if (srcWits[i].text.indexOf("&lt;hi")>-1) messages+="<br>Possible error in "+context+": \"&lt;hi\" found in reading. Check for valid xml, etc";
		if (srcWits[i].text.indexOf("&lt;/hi")>-1) messages+="<br>Possible error in "+context+": \"&lt;/hi\" found in reading. Check for valid xml, etc";
		if (srcWits[i].text=="") messages+="<br>Error in "+context+": no text found in reading. This will cause conversion errors";
		apparatus+='<rdg n="'+rdgNo+'" varSeq="'+rdgNo+'" wit="'+spellingMss+'">'+srcWits[i].text+'<wit>'+spellingWits+'</wit></rdg>';
	}
	return apparatus;
}

function prettyfiXML(inApp) {
	inApp=inApp.replace(/<ab xmlns=\"http:\/\/www.tei-c.org\/ns\/1.0\" xml:id/g, "    <ab n");
	inApp=inApp.replace(/<app /g, "\r         <app ");
	inApp=inApp.replace(/<\/app>/g, "\r         <\/app>");
	inApp=inApp.replace(/<ab /g, "\r   <ab ");
	inApp=inApp.replace(/<\/ab>/g, "\r   <\/ab>");
	inApp=inApp.replace(/<lem /g, "\r            <lem ");
	inApp=inApp.replace(/<rdg /g, "\r            <rdg ");
	return inApp;
}


module.exports = retrieveSpellingsCollationComponent;
