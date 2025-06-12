//for merging spellings from xml files into a cumulative JSON record
/* import JSZip from 'jszip';
import FileSaver from 'file-saver'; */

var $ = require('jquery')
  , JSZip = require('jszip')
  , FileSaver = require ('file-saver')
  , CommunityService = require('../services/community')
  , BrowserFunctionService = require('../services/functions')
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
//	var anonMss={"Ad1":"L1","Ad2":"H2","Ad3":"M3","Ad4":"O1","Ar":"A2","Bo1":"B3","Bo2":"X1","Bw":"Aa","Ch":"Ef","Cn":"Ya","Cp":"Y1","Ct":"E2","Cx1":"Fc","Cx2":"Qa","Dd":"B5","Dl":"X7","Do":"C6","Ds1":"W5","Ds2":"D1","Ee":"Vx","El":"E1","En1":"Wa","En2":"Fx","En3":"Vc","Fi":"Ga","Gg":"Wd","Gl":"H1","Ha1":"V9","Ha2":"Ia","Ha3":"U4","Ha4":"Jz","Ha5":"T3","He":"Kx","Hg":"S1","Hk":"L0","Hl1":"Ro","Hl2":"M4","Hl3":"Qt","Hl4":"N6","Hn":"Pa","Ht":"O2","Ii":"Ax","Kk":"Z1","La":"Bx","Lc":"Y9","Ld1":"Cd","Ld2":"Xf","Ll1":"Da","Ll2":"Wz","Ln":"Ey","Ma":"Xy","Mc":"Fw","Me":"W8","Mg":"G7","Mm":"V7","Ne":"H9","Nl":"W6","Np":"I0","Ox1":"V5","Ox2":"J1","Ph1":"W4","Ph2":"K2","Ph3":"V3","Ph4":"L3","Pl":"W2","Pn":"M9","Pp":"U1","Ps":"N4","Pw":"T0","Py":"O5","Ra1":"S9","Ra2":"P6","Ra3":"R8","Ra4":"Q7","Ry1":"Aq","Ry2":"Zj","Se":"Bb","Si":"Yi","Sl1":"Cc","Sl2":"Xh","Sl3":"Dt","St":"Wg","Tc1":"Ed","Tc2":"Vg","Tc3":"Ff","To1":"Uf","To2":"Gh","Wy":"Te"}
    let convert=BrowserFunctionService.processSpellings(this.xmlfile, spellings);
	zip.file('spellings.json', convert.source);
	zip.generateAsync({ type: 'blob' }).then(function (content) {
  	  FileSaver.saveAs(content, 'download.zip'); 
	}); 
	this.success=""+convert.nLemmata+" lemmata found; "+convert.nSpellings+" different spellings found; "+convert.nForms+" instances of these spellings found"
  }
});




module.exports = AllSpellingsComponent;
