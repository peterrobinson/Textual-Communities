var $ = require('jquery')
  , async = require('async')
  , UIService = require('./services/ui')
  , DocService = require('./services/doc')
  , RESTService = require('./services/rest')
  , Dropzone = require('dropzone')
  , ElementRef = ng.core.ElementRef
  , config = require('./config')
;


var EditVmapComponent = ng.core.Component({
  selector: 'tc-managemodal-editvmap',
  templateUrl: '/app/editvmap.html',
  directives: [
    require('./directives/modaldraggable'),
    require('./directives/modalresizable'),
  ],
  inputs: [
    'vMap'
  ]
}).Class({
  constructor: [
    UIService, DocService, ElementRef, RESTService,
  function(
    uiService, docService, elementRef, restService
  ) {
    this._docService = docService;
    this._elementRef = elementRef;
    this.uiService = uiService;
    this.restService = restService;
    this.message="";
    this.chosen={name:"", left:"", top:""};
    this.addwit={name:"", left:50, top:50};
    this.success="";

//    this.pdfjsLib = window['pdfjs-dist/build/pdf'];
//	this.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://mozilla.github.io/pdf.js/build/pdf.worker.js';
	$( window ).resize(function() {
		$('#manageModal').width($(window).width()-15);
    	$('#manageModal').height($(window).height()-15);
		document.getElementById("div1").style.height=document.getElementById("edVmap").offsetHeight-document.getElementById("div1").offsetTop-45+"px";
		document.getElementById("div2").style.height=document.getElementById("edVmap").offsetHeight-document.getElementById("div1").offsetTop-45+"px";
	});
  }],
  ngOnInit: function() {
  	this.pdf2=this.vMap.pdflabelled.src;
  	var self=this;
    $('#manageModal').width($(window).width()-15);
    $('#manageModal').height($(window).height()-15);
    var pdf1=atob(this.vMap.pdfunlabelled.src);
    var loadingTask = pdfjsLib.getDocument({data: pdf1});
    loadingTask.promise.then(function(pdf) {
    	pdf.getPage(1).then(function(page) {
    		var viewport = page.getViewport({scale: 1});
    		var canvas = document.getElementById('canvas1');
    		var context = canvas.getContext('2d');
    		canvas.height = viewport.height;
    		canvas.width = viewport.width;
    		var renderContext = {
			  canvasContext: context,
			  viewport: viewport
			};
			//add drag-events for every wit here...
/**/
			page.render(renderContext);
    		for (var i=0; i<self.vMap.wits.length; i++) {
				document.getElementById(self.vMap.wits[i].name).addEventListener("dragstart", (e) => {
				  e.dataTransfer.setData("text/plain", e.target.id);
				  setTimeout(() => e.target.style.opacity = "0.4", 0); // Optional: change style while dragging
				});
				document.getElementById(self.vMap.wits[i].name).addEventListener("dragend", (e) => {
				  e.target.style.opacity = "1"; // Restore style
				});	 
			} 
			const dropTarget=document.getElementById("div1");
			dropTarget.addEventListener("dragover", (e) => {
			  e.preventDefault(); // Prevent default to allow drop
			});
			dropTarget.addEventListener("drop", (e) => {
			  e.preventDefault();
			  const data = e.dataTransfer.getData("text/plain");
			  const x = e.offsetX;
			  const y = e.offsetY;
			  var myWit=self.vMap.wits.filter(wit=>wit.name==data)[0];
			  self.chosen.name=data;
			  self.chosen.left=x;
			  self.chosen.top=y;
			  myWit.x=x;
			  myWit.y=y;
//			  alert("drop me! "+data+ " x "+x+" y "+y);
//			  const data = e.dataTransfer.getData("text/plain");
//			  e.target.appendChild(document.getElementById(data));
			}); 
	 	}); 
	 });
  },
  submit: function() {
    var self = this;
    //update wits array
  /*  for (var i=0; i<this.vMap.wits.length; i++) {
    	var myEl=document.getElementById(this.vMap.wits[i].name);
    	this.vMap.wits[i].x=parseInt(myEl.style.left, 10);
    	this.vMap.wits[i].y=parseInt(myEl.style.top, 10);
    } */
    //save this sucker!!
     $.ajax({
		url: config.BACKEND_URL+'saveVMap?community='+self.uiService.state.community.attrs.abbr+'&name='+self.vMap.name,
		type: 'POST',
		data:  JSON.stringify(self.vMap),
		accepts: 'application/json',
		contentType: 'application/json; charset=utf-8',
		dataType: 'json'
	}).done(function(data) {
		self.success="Variant Map "+self.vMap.name+" saved to database";
	}).fail(function( jqXHR, textStatus, errorThrown) {
		self.message="Error " + errorThrown ;
	}).always(function(){
		var boo=1;
	});
  },
  closeModalAP: function() {
    $('#manageModal').modal('hide');
  },
  editPlace: function(which) {
  	this.chosen.name=which;
  	this.chosen.left= parseInt(document.getElementById(which).style.left, 10);
  	this.chosen.top= parseInt(document.getElementById(which).style.top, 10);
   },
  changeLeft: function(){
  	  document.getElementById(this.chosen.name).style.left=this.chosen.left+"px";
  },
  changeTop: function(){
  	  document.getElementById(this.chosen.name).style.top=this.chosen.top+"px";
  },
  addWitWits: function(){
  	this.vMap.wits.push({name:this.addwit.name, x:parseInt(this.addwit.left, 10), y:parseInt(this.addwit.top,10)});
  	this.addwit.name="";
   	this.addwit.left=50;
   	this.addwit.top=50;
  }
});

module.exports = EditVmapComponent;
