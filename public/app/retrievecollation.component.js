var $ = require('jquery')
  , UIService = require('./services/ui')
  , CommunityService = require('./services/community')
  , config = require('./config')
  , async = require('async')
  , _ = require('lodash')
  , BrowserFunctionService = require('./services/functions')
;

var RetrieveCollationComponent = ng.core.Component({
  selector: 'tc-managemodal-retrievecollation',
  templateUrl: '/app/retrievecollation.html',
  inputs : ['community'],
  directives: [
    require('./directives/modaldraggable')
  ],
}).Class({
  constructor: [CommunityService, UIService, function(communityService, uiService) {
//    var Doc = TCService.Doc, doc = new Doc()
    this._communityService = communityService;
    this.message=this.success="";
    this.everycollation=true;
    this.nAllCollations=0;
    this.inSearch=false;
    this.uiService = uiService;
    }],
  closeModalCE: function() {
    this.message=this.success="";
    $('#MMADdiv').css("margin-top", "30px");
    $('#MMADbutton').css("margin-top", "20px");
    $('#manageModal').modal('hide');
  },
  ngOnInit: function() {
    this.header="Retrieve Collations for "+this.community.attrs.name;
    if (this.community.attrs.collationents.length>1) {
    	this.success="Collation entity file "+this.community.attrs.collentsfilename+" loaded with "+this.community.attrs.collationents.length+" entities.";
    } else {
    	this.success="No collation entity file loaded. If your texts are complex or long you should load a collation entity file through the Edit community dialogue.";
    }
    this.ranges=[{start:this.community.attrs.abbr+"/entity=X:line=Y", end:this.community.attrs.abbr+"/entity=X:line=Y", count:0}];
    let self=this;
    this.inSearch=false;
    if (this.community.attrs.collationents.length>1) {
    	self.nAllCollations=self.community.attrs.collationents.length;
    } else {
		$.get(config.BACKEND_URL+'countCommunityCollations?community='+this.community.attrs.abbr, function(res) {
			if (res.success) self.nAllCollations=res.count;
		});
	}
  },
  ngOnChanges: function() {
//    this.communi
    this.message="";
    this.success="";
    $('#manageModal').width("700px");
    $('#manageModal').height("310px");
  },
 chooseCollations: function(choice){
    this.everycollation=choice;
  },
  addRange: function() {
  	this.ranges.push({start:"", end:"", count:0});
  	let height=$('#manageModal').height();
  	$('#manageModal').height(height+20);
  },
  removeRange: function(i) {
  	this.ranges.splice(i, 1);
  	 let height=$('#manageModal').height();
  	$('#manageModal').height(height-20);
  },
  clickEntity: function(i) {
  	  let self=this;
  	  if (rangeReady(self, self.ranges[i].start) && rangeReady(self, self.ranges[i].end)) {
  	  	  if (self.inSearch) {
  	  	  	self.success="Searching range. Wait!";
  	  	  	self.ranges[i].count=0;
  	  	  	return;
  	  	  }
  	  	  self.inSearch=true;
		  $.ajax({
			url:config.BACKEND_URL+'countRangeCollations?community='+self.community.attrs.abbr,
			type: 'POST',
			data: JSON.stringify({range: self.ranges[i], collentities: self.community.attrs.collationents}),
			accepts: 'application/json',
			contentType: 'application/json; charset=utf-8',
			dataType: 'json'
		  })
		   .done(function(data){
		//	if (data.success) self.success="Found "+data.count+" approved collations"
			 self.ranges[i].count=data.count;
			 self.success="";
			 self.inSearch=false;
		   })
		   .fail(function( jqXHR, textStatus, errorThrown) {
		    self.inSearch=false;
		    self.success="";
			alert( "error" + errorThrown );
		   });
	  } else {
	  	self.ranges[i].count=0;
	  }
  },
  infoRC: function(){
  	alert("• TEI/XML: outputs apparatus in TEI/XML encoding. Use this form to create NEXUS files for phylogenetic analysis and creation of VBase variant databases.\r• JSON: outputs apparatus in Collation Editor JSON format. Use this form to retrieve spelling information created during regularization.");
  },
  submit: function(){
      var self=this;
      let choice=$("input[name='outputForm']:checked").val();
      let partorall="all"
      if (!this.everycollation) partorall="part";
      self.success="Now assembling the collations. This may take a while! Make some coffee...";
      $.ajax({
      	url:config.BACKEND_URL+'getCollations?community='+self.community.attrs.abbr,
      	type: 'POST',
      	data: JSON.stringify({ranges: self.ranges, collentities: self.community.attrs.collationents, output:choice, partorall:partorall}),
		accepts: 'application/json',
		contentType: 'application/json; charset=utf-8',
		dataType: 'json'
	})
	 .done (function(result) {
	 	  if (choice=="TEI") {
	 	  	self.success="Collation for "+result.length+" block(s) found. Now assembling the XML apparatus";
	 	  	assembleXML(result, self, function (xml){
     	      BrowserFunctionService.download(xml, self.community.attrs.abbr+"-COLLATION.xml", "application/xml")	 	  	
	 	  	  self.success="Assembled the XML.  Now downloading.  Check your downloads folder; close this window when it is downloaded";
	 	  	});
 	 	  } else {
	 	  	self.success="Collation for "+result.length+" block(s) found. Now downloading. Check your downloads folder; close this window when it is downloaded";
            BrowserFunctionService.download(JSON.stringify(result), self.community.attrs.abbr+"-COLLATION.json", "application/json")
	 	  }
  	})
     .fail (function(jqXHR, textStatus, errorThrown) {
         alert( "error" + errorThrown );
    });
 }
});


function rangesReady(self) {
	for (let i=0; i<self.ranges.length; i++) {
		if (!rangeReady(self, self.ranges[i].start) || !rangeReady(self, self.ranges[i].end)) return false;
	}
	return true;
}

function assembleXML(lines, self, callback1) {
	let myDate=(new Date()).toString();
	let xml="";
	let user=self.uiService.state.authUser.attrs.local.name;
	let community=self.community.attrs.abbr;
	let email=self.uiService.state.authUser.attrs.local.email;
	let start='<?xml version="1.0" encoding="utf-8"?>\r<TEI xmlns="http://www.tei-c.org/ns/1.0">\r <teiHeader>\r <fileDesc><titleStmt><title>Collation output for '+user+' ('+email+'), generated at '+myDate+'</title></titleStmt><publicationStmt><p rend="ital">dummy</p></publicationStmt>\r  <sourceDesc>\r   <listWit>';
	let currTopEntity="";
	var uniqueWits=[]; //update each time we get a new top entity
	let active=[];
	async.mapSeries(lines, function(line, callback){
		let myTES=line.entity.slice(line.entity.indexOf("=")+1);
		let myTopEntity=myTES.slice(0, myTES.indexOf(":"));
		if (myTopEntity!=currTopEntity) {
		//which manuscripts have this entity?
			$.get(config.host_url+"/uri/urn:det:tc:usask:"+community+"/entity="+myTopEntity+":document=*?type=list", function(wits) {
				uniqueWits = _.uniqBy(wits, "name");
				active=[];
				for (var i=0; i<uniqueWits.length; i++) {	
			//		start+="<witness>"+uniqueWits[i].name+"</witness>" do this at the end??
					active.push(uniqueWits[i].name);
				}
				currTopEntity=myTopEntity;
				xml+=processLine(line.collation, line.entity, active)
				callback(null);
			});
		} else {
			xml+=processLine(line.collation, line.entity, active);
			callback(null);
		}
	}, function(err){ //add wit-list, including all mod and orig as witnesses
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
		callback1 (start+xml+"\r  </body>\r </text>\r</TEI>");
	});
}

function processLine(fullApp, entity,  active) {
	let fullApp2=fullApp.replace("<?xml version='1.0' encoding='utf-8'?>","");	   			
	let apparatus=new DOMParser().parseFromString(fullApp2, "text/xml");
	let appLac=apparatus.querySelectorAll("app[type=lac]")[0];
	if (appLac) {
		var ids=appLac.querySelectorAll("idno");
		var lacwits=[];
		//deduce what mss reallu are omitted.. ie they have some text of the entity, just not tjis line or para
		for (var i=0; i<ids.length; i++) {
			var isActive=active.filter(function (obj){return obj== ids[i].innerHTML;})[0];
			//if on both lists.. 
			if (isActive) lacwits.push(isActive)
		}
		//rebuild lacWit to reflect actual omissions
		if (lacwits.length>0) {
			var rdgAttr=lacwits.join(" ");
			var witel="<idno>"+lacwits.join("</idno><idno>")+"</idno>";
			appLac.querySelectorAll("rdg")[0].setAttribute("wit",rdgAttr);
			appLac.querySelectorAll("wit")[0].innerHTML=witel;
		} else {//eliminate the app
			appLac.parentNode.removeChild(appLac);
		}
	}
	var xml=apparatus.getElementsByTagName('ab')[0].outerHTML;
	if (xml.indexOf('"></rdg>"')>-1) {
		alert("Error in line "+entity+". Possibly because there is a stray forwardslash character in the collation (eg. coming from a transcription with '<rdg type='orig' /> rather than <rdg type='orig'/> ). Check this");
	}
	var xml2=prettyfiXML(xml);
	return xml2;
}

function prettyfiXML(inApp) {
	inApp=inApp.replace(/<ab xmlns=\"http:\/\/www.tei-c.org\/ns\/1.0\" xml:id/g, "    <ab n");
	inApp=inApp.replace(/<app /g, "\r         <app ");
	inApp=inApp.replace(/<\/app>/g, "\r        <\/app>");
	inApp=inApp.replace(/<\/ab>/g, "\r    <\/ab>\r");
	inApp=inApp.replace(/<lem /g, "\r            <lem ");
	inApp=inApp.replace(/<rdg /g, "\r            <rdg ");
	return inApp;
}


function rangeReady(self, entity) {
	if (entity=="") return true;
	let community=entity.slice(0, entity.indexOf("/"));
	if (community!=self.community.attrs.abbr) return false;
	let parts=entity.slice( entity.indexOf("/")+1).split(":");
	let topEntity=parts[0].slice(parts[0].indexOf("=")+1);  //do we know the top entity?
	if (self.community.attrs.entities.filter(entity=>entity.attrs.name==topEntity).length==0) return false;
	for (let i=1; i<parts.length; i++) {
		let bits=parts[i].split("=");
		if (bits.length!=2) return false;
		if (bits[0]=="" || bits[1]=="") return false;
	}
	return true;
}



module.exports = RetrieveCollationComponent;
