//for merging spellings from xml files into a cumulative JSON record
/* import JSZip from 'jszip';
import FileSaver from 'file-saver'; */

var $ = require('jquery'),
  JSZip = require('jszip'),
  FileSaver = require ('file-saver')
  , CommunityService = require('../services/community')
 ;

var AllSpellingsComponent = ng.core.Component({
  selector: 'tc-community-allspellings',
  templateUrl: '/app/community/allspellings.html',
  directives: [
     require('../directives/filereader'),
  ],
}).Class({
  constructor: [
     CommunityService, function(
        communityService
    ) {
    var self=this;
//    var Doc = TCService.Doc, doc = new Doc();
    this.doc = {name:""};
    $('#manageModal').width("420px");
    $('#manageModal').height("180px");
    this.message="";
    this.success="";
    this.xmlfile="";
     /*this for scope variables */
    this.jsonfile = '';
    this.spellings={};
  }],
 filechange: function(file) {
   if (file.indexOf("{\"")==0) {
   	 this.jsonfile= file;
    } else {
     this.xmlfile = file;    
	}	
  },
  submit: function() {
    var self = this;
    const zip = new JSZip();
    if (this.jsonfile!="") {
    	var spellings=JSON.parse(this.jsonfile);
    } else {
    	var spellings={};
    }
    //use this to anonomize mss for spelling tests...
	var anonMss={"Ad1":"L1","Ad2":"H2","Ad3":"M3","Ad4":"O1","Ar":"A2","Bo1":"B3","Bo2":"X1","Bw":"Aa","Ch":"Ef","Cn":"Ya","Cp":"Y1","Ct":"E2","Cx1":"Fc","Cx2":"Qa","Dd":"B5","Dl":"X7","Do":"C6","Ds1":"W5","Ds2":"D1","Ee":"Vx","El":"E1","En1":"Wa","En2":"Fx","En3":"Vc","Fi":"Ga","Gg":"Wd","Gl":"H1","Ha1":"V9","Ha2":"Ia","Ha3":"U4","Ha4":"Jz","Ha5":"T3","He":"Kx","Hg":"S1","Hk":"L0","Hl1":"Ro","Hl2":"M4","Hl3":"Qt","Hl4":"N6","Hn":"Pa","Ht":"O2","Ii":"Ax","Kk":"Z1","La":"Bx","Lc":"Y9","Ld1":"Cd","Ld2":"Xf","Ll1":"Da","Ll2":"Wz","Ln":"Ey","Ma":"Xy","Mc":"Fw","Me":"W8","Mg":"G7","Mm":"V7","Ne":"H9","Nl":"W6","Np":"I0","Ox1":"V5","Ox2":"J1","Ph1":"W4","Ph2":"K2","Ph3":"V3","Ph4":"L3","Pl":"W2","Pn":"M9","Pp":"U1","Ps":"N4","Pw":"T0","Py":"O5","Ra1":"S9","Ra2":"P6","Ra3":"R8","Ra4":"Q7","Ry1":"Aq","Ry2":"Zj","Se":"Bb","Si":"Yi","Sl1":"Cc","Sl2":"Xh","Sl3":"Dt","St":"Wg","Tc1":"Ed","Tc2":"Vg","Tc3":"Ff","To1":"Uf","To2":"Gh","Wy":"Te"}
    var myXMLDOM = new DOMParser().parseFromString(this.xmlfile, "text/xml");
  	let apps=myXMLDOM.getElementsByTagName("app");
  	for (let i=0; i<apps.length; i++) {
    	this.success="Processing "+(i+1)+" of "+apps.length+" apps found";
		var rdgs=apps[i].getElementsByTagName("rdg");
  		for (let j=0; j<rdgs.length; j++) {
  			try {
				if (typeof rdgs[j].childNodes[0].nodeValue== "undefined") {
					var rdg="Omitted";
				} else {var rdg=rdgs[j].childNodes[0].nodeValue;}
				if (typeof rdgs[0].childNodes[0].nodeValue == "undefined") {
					 var lemma="Omitted";
				} else { var lemma=rdgs[0].childNodes[0].nodeValue;}
				if (j==0) {
					if (typeof spellings[lemma]=="undefined") {
						spellings[lemma]={};
					} 
				}
				if (typeof spellings[lemma][rdg]=="undefined") {
					spellings[lemma][rdg]={};
				}
				let witIds=rdgs[j].getElementsByTagName("wit")[0].getElementsByTagName("idno");
				for (let k=0; k<witIds.length; k++) {
					if (typeof witIds[k].childNodes[0].nodeValue == undefined) {
						var  witId= "dummy"
					} else {var witId=witIds[k].childNodes[0].nodeValue;}
					if (typeof spellings[lemma][rdg][witId]=="undefined") {
						spellings[lemma][rdg][witId]=1;
					} else {
						spellings[lemma][rdg][witId]++;
					}
				}
			}
			catch(err) {
				var foo=1;
				alert("err");
			}
  		}
  	}
  	let nLemmata=0;
  	let nSpellings=0;
  	let nForms=0;
  	var sorted=sortObjectByKeys(spellings)
  	for (const key in spellings) {
  		nLemmata++;
  		const theseSpellings = spellings[key];
  		for (const keySp in theseSpellings) {
  			nSpellings++;
  			const theseMss = theseSpellings[keySp];
  			for (const keyMs in theseMss ) {
  				nForms+=theseMss[keyMs];
  			}
  		}
	}
  	let convert= JSON.stringify(sorted);
  	//prettify!
  	var rex3= /}},/g;
  	var rex4='}},\r\r';
  	var rex5=/},"/g;
  	var rex6='},\r\t"';
  	var rex1=/\r"([^"]*)":{/g;
  	var rex2='\r"$1":{\r\t';
  	convert=convert.replaceAll(rex3, rex4);
  	convert=convert.replaceAll(rex5, rex6);
  	convert=convert.replaceAll(rex1, rex2);
	zip.file('spellings.json', convert);
	zip.generateAsync({ type: 'blob' }).then(function (content) {
  	  FileSaver.saveAs(content, 'download.zip'); 
	}); 
	this.success=""+nLemmata+" lemmata found; "+nSpellings+" different spellings found; "+nForms+" instances of these spellings found"
  }
});

function sortObjectByKeys(o) {
    return Object.keys(o).sort().reduce((r, k) => (r[k] = o[k], r), {});
}



module.exports = AllSpellingsComponent;
