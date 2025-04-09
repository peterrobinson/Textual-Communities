var $ = require('jquery');
var UIService = require('./services/ui')
  , CommunityService = require('./services/community')
  , RESTService = require('./services/rest')
  , async = require('async')
  , config = require('./config')
  , JSZip = require('jszip')
  , JSZipUtils = require('jszip-utils')
  , FileSaver = require ('file-saver')
  , BrowserFunctionService = require('./services/functions')

;

var WriteVbaseComponent = ng.core.Component({
  selector: 'tc-managemodal-makewebsite-vbase',
  templateUrl: '/app/writevbase.html',
  inputs : ['community', 'vBase'],
  directives: [
    require('./directives/modaldraggable'), require('./directives/modalresizable')
  ],
}).Class({
  constructor: [
    CommunityService, UIService, RESTService, function(
      communityService, uiService, restService
    ) {
//    var Doc = TCService.Doc, doc = new Doc();
    $('#manageModal').width("750px");
    $('#manageModal').height("750px");
    this.success="";
    this.error="";
    this.restService=restService;
    this.communityService=communityService;
    this.uiService = uiService;
    }],
  ngOnInit: function() {
  //this.vBase holds the VBase
  },
  submit: function(){
  	  const zip = new JSZip();
  	  const self=this;
	  async.waterfall([
		function (cb1) {
			$("#MEProgress").html("Loading base files");
			loadBaseFiles(zip, self, function callback(result){
				cb1(result,[]);
			});
		},
		function(arguments, cb1) {
			$("#MEProgress").html("Creating standalone VBase site for "+self.vBase.name);	
			let tcvBaseTemplate="/app/data/makeEdition/common/core/driver/tcvbasetemplate.html";
			let tcvBaseDriverJs="/app/data/makeEdition/common/core/driver/tcdrivervbase.js"; 
			$.get(tcvBaseTemplate, function(myfile){
				let srcdoc=myfile;
				let tcvBaseJs="/app/data/makeEdition/common/core/js/tcvBaseJs.js";
				let vBaseUtilsJs="/app/data/makeEdition/common/core/js/vBaseUtilsJs.js";
				let mydata=BrowserFunctionService.customTemplates(srcdoc, [{key: "vBase", value: JSON.stringify(self.vBase), isobject:true}, {key: "view", value: "editorial", isobject:false}], [tcvBaseDriverJs]); 
				$("#MEIframe").attr("srcdoc", mydata); 
				window.addEventListener("message", function (event){ 
					if (typeof event.data === "string") {
						let aliasesFile="/app/data/MakeEdition/common/core/js/aliases.js";
						let str=BrowserFunctionService.adjustResult(self, event.data, true, [{key: "standAlone", value: true, isobject:true}, {key: "vBase", value: JSON.stringify(self.vBase), isobject:true}, {key: "view", value: "editorial", isobject:false}],[tcvBaseJs, aliasesFile, vBaseUtilsJs]);	
						zip.file("edition/index.html", str);
						cb1(null, []);
					} else {
						cb1(null,[]);
					}
				},{once:true}); 
			});
		}
	], function(err){
		$("#MEProgress").html("Generating zipfile");								 
		zip.generateAsync({ type: 'blob' }).then(function (content) {
			FileSaver.saveAs(content, 'vbase.zip'); 
			$("#MEProgress").html("Standalone VBase site made");
		});
	});
},
 closeModalIM: function() {
    this.success="";
    $('#manageModal').modal('hide');
  },
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
		self.restService.http.get('/app/data/makeEdition/common/core/js/tcvBaseJs.js').subscribe(function(myfile) {
			zip.file('edition/common/core/js/tcvBaseJs.js',myfile._body);
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
		zip.file('edition/common/core/images/disablecondition.png', BrowserFunctionService.urlToPromise('/app/data/makeEdition/common/core/images/disablecondition.png', cb), {binary:true});
	},
	function(arguments, cb) {
		zip.file('edition/common/core/images/deletecondition.png', BrowserFunctionService.urlToPromise('/app/data/makeEdition/common/core/images/deletecondition.png', cb), {binary:true});
	},
	function(arguments, cb) {
		zip.file('edition/common/core/images/enablecondition.png', BrowserFunctionService.urlToPromise('/app/data/makeEdition/common/core/images/enablecondition.png', cb), {binary:true});
	},
	function(arguments, cb) {
		zip.file('edition/common/core/images/addcondition.png', BrowserFunctionService.urlToPromise('/app/data/makeEdition/common/core/images/addcondition.png', cb), {binary:true});
	},
	function(arguments, cb) {
		zip.file('edition/common/core/images/VBaseMartTriv.png', BrowserFunctionService.urlToPromise('/app/data/makeEdition/common/core/images/VBaseMartTriv.png', cb), {binary:true});
	},
	function(arguments, cb) {
		zip.file('edition/common/core/images/VBaseAshHamMartTriv.png', BrowserFunctionService.urlToPromise('/app/data/makeEdition/common/core/images/VBaseAshHamMartTriv.png', cb), {binary:true});
	},
	function(arguments, cb) {
		zip.file('edition/common/core/images/text.png', BrowserFunctionService.urlToPromise('/app/data/makeEdition/common/core/images/text.png', cb), {binary:true});
	},
	function(arguments, cb) {
		zip.file("edition/common/core/js/aliases.js", BrowserFunctionService.urlToPromise("/app/data/makeEdition/common/CTP2/js/aliases.js", cb), {binary:true});
	},
	function(arguments, cb) {
		zip.file("edition/common/core/js/indexJs.js", BrowserFunctionService.urlToPromise("/app/data/makeEdition/common/core/js/indexJs.js", cb), {binary:true});
	}
  ], function (err) {
		callback(null);
	 });
}

module.exports = WriteVbaseComponent;
