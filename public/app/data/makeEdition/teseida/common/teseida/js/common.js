if (typeof MakeEdition!="undefined") {
	var community;
}
var splitterResized=false;
dw_Tooltip.defaultProps = { 
	hoverable: true, 
	klass: 'tooltip',
	content_source: 'class_id' 
	}; 
dw_Tooltip.writeStyleRule(); 

$.urlParam = function(name){
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results==null){
       return null;
    }
    else{
       return results[1] || 0;
    }
}

var viewer=null;
var overlay=false;
var colors=[];  //use palette.js to generate all the colors we need...


function initEdition() {
//	showSplash();
	viewer = OpenSeadragon({
		id: "panel-left",
		maxZoomPixelRatio: 3,  //0.5 for stemmata
		minZoomImageRatio: 0.7,
		homeFillsViewer: true,
		prefixUrl: "https://openseadragon.github.io/openseadragon/images/"
	});	
	initMyEdition();   
 }
 
function initMyEdition(){
	//place holder, override in your edition
}

function initTranscript(ms, page, index) {
	$("#rTable").show();
	$("#splash").hide();
	$("#footer").show();
	$("#panel-left").show();
	$("#transcriptFrame").show();
	$("#compareFrame").hide();
	$(".gutter").show();
 	initializeTranscript();
 	resizeRTable();
 	$(window).resize(resizeRTable);
 	var panelRight = new Clay('#panel-right');
	panelRight.on('resize', function(size) {
		 resizeRTable();
	});
	initMyTranscript(ms, page, index);
 }
 
 function initMyTranscript(){
	//place holder, override in your edition
}

 
 function showSplash() {
	$("#rTable").hide();
	$("#splash").show();
	$("#footer").hide();
	$("#splash").css("display", "flex");
	window.history.pushState(null, null, "index.html");
}

function resizeRTable() {
		if ($("#panel-left").is(":visible") && $("#panel-right").is(":visible")) {
		if ($(".gutter-vertical").length && $(window).width()>$(window).height()) {
			//go from vertical to horizontal haha
	//		$("#rTable").height($(window).height()-$("#page-head").height()-12);
			$("#panel-left").height($(window).height()-$("#page-head").height()-12);
			$("#panel-left").css("max-height","");
			$("#panel-right").height($(window).height()-$("#page-head").height()-12);
			//remove all the other gutter stuff...
			$(".gutter-vertical").remove();
			setUpSplit();
		} else if ($(".gutter-horizontal").length && $(window).width()<=$(window).height()) {
			//go from horizontal to vertical lol
//			$("#rTable").height($(window).height()-$("#page-head").height()-12);
			$("#rTable").css("display","block");
			$("#panel-left").width($(window).width()-5);
			$("#panel-right").width($(window).width()-5);
			//remove all the other gutter stuff...
			$(".gutter-horizontal").remove();
			setUpSplit();
		}
	}
	if ($(window).width()<880) {
		$("#grp1").width("100%")
	} else {$("#grp1").width("50%")}
	if ($("#transcriptFrame").is(":visible")) {
//		$("#transcript-tm").width($("#transcript-text").width());   //set width of all transcript elements..
		if ($("#transcript-text").width()>$("#panel-right").width()) {
			$("#transcript").css("align-items", "flex-start");
		} else if ($("#transcript-text").width()>0) { //somehow, this happens
			 $("#transcript").css("align-items", "center") 
		}
	}
	if ($("#searchVBase").is(":visible")) {
		$("#searchVBase").height(($("body").height()-$("#page-head").height()-10)*99/100);
		$("#searchVBResults").height(($("body").height()-$("#page-head").height()-10-$("#searchVBheader").height()));
		return;
	}

	//are we split vertically or horizontally?
	if ($(".gutter-vertical").length) {
		resizeVertically();
		//reset max-height so that splitter works appropriately
		var adjustHeight=$(window).height()-15-$("#page-head").height()-100;
		$("#panel-left").css("max-height",""+adjustHeight+"px");
		//reset splitter width
	//	$("#splitter").width($("#panel-right").width());
	} else {
		//splitting horizontally
		var newHeight=$(window).height()-$("#page-head").height()-6;
		if ($("#transcriptFrame").is(":visible")) {
			var newHeight=$(window).height()-$("#page-head").height()-6;
			$("#transcript").height(newHeight-$("#p-r-top").height()-18);
			$("#OAstatement").show();
			$("#footer").show();
			if ($("#footer").length) {
				$("#panel-left").height(newHeight-$("#footer").height()-25);
				$("#panel-right").height(newHeight-$("#footer").height()-25);
			} else {
				$("#panel-left").height(newHeight-10);
				$("#panel-right").height(newHeight-10);
			}
			//we need this because somehow, footer might get squeezed...
			$("#rTable").height($("#panel-left").height());
//			$("#rTable").height(newHeight-$("#footer").height()-3);
		} 
		if ($("#collationFrame").is(":visible")) {
			$("#panel-left").height(newHeight-10);
			$("#panel-right").height(newHeight-10);
			$("#rTable").height(newHeight-10);
		}
		if ($("#searchContainer").is(":visible")) {
			$("#searchContainer").height(newHeight-10);
		}
	}
 }
 
 function setUpSplit(){
	if ($(window).height()>$(window).width()) { //portrait mode, check split status
		if (!$(".gutter-vertical").length) {
			$("#rTable").css("display", "block");
			$("#rTable").css("flex-direction", "");
			$("#panel-right").width("99.5%");
			Split(['#panel-left', '#panel-right'], {
			   direction: 'vertical',
    		   minSize: 100,
   			   gutterSize: 10,
			}) 
		}
	} else {//horizontal mode
		if (!$(".gutter-horizontal").length) {
			$("#rTable").css("display", "flex");
			$("#rTable").css("flex-direction", "row");
			Split(['#panel-left', '#panel-right'], {
	  		   minSize: 100,
   			   gutterSize: 10,
			}) 
		}
	}
}

function initializeTranscript() {
/*	if ($("#transcript-text").width()>$("#panel-right").width()) {
		$("#transcript").css("align-items", "flex-start") 
	} else {
		 $("#transcript").css("align-items", "center") 
	} */
	if ($(window).width()<880) {
		$("#grp1").width("100%")
	} else {$("#grp1").width("50%")}
	//two scenarios. Side by side, or one above the other.
	//if one above the other: panel width+30> window width
	
	
	if ($(window).width()<$(window).height()) {
		//first time through .. set to half height. 
		 var newHeight=($(window).height()-$("#page-head").height())/2-12;
		setUpSplit();
		 $("#panel-left").height(newHeight);
		 $("#panel-right").height(newHeight);
//		 $("#rTable").height($(window).height()-$("#page-head").height()-12);
		 $("#rTable").css("display","block");
	 	$("#transcript").height(newHeight-$("#p-r-top").height()-18);
 		$("#panel-left").width($(window).width()-5);
		$("#panel-right").width($(window).width()-5);
		resizeVertically()
	} else {
		//we have standard side by side
		setUpSplit();
		$("#panel-right").css("min-width", "150px");
		$("#panel-left").css("min-width", "100px");
		 var newHeight=($(window).height()-$("#page-head").height())-16;
		 $("#rTable").height(newHeight);
		$("#rTable").css("flex-wrap", "nowrap");  // to stop wrapping in this view
		//set height of left and right to fill the screen
		 $("#panel-left").height(newHeight);
		 $("#panel-right").height(newHeight);
		 $("#transcript").height(newHeight-$("#p-r-top").height()-18);
		 resizeHorizontally();
	}
}

function resizeHorizontally(){
	splitterResized=true;
	resizeRTable();
	//haha... we might have reoriented the panel, in which case this does not apply
	if ($(".gutter-horizontal").length) $("#panel-right").width($("#rTable").width()-$("#panel-left").width()-15);
}

//called when window is narrow and we want to move splitter up and down
function resizeVertically() {
//	console.log("change right panel");
	var newHeight=$(window).height()-15-$("#page-head").height()-$("#panel-left").height();
	if (newHeight<110){
		newHeight=110;
		var adjustHeight=$(window).height()-15-$("#page-head").height()-newHeight;
		$("#panel-left").height(adjustHeight);
		$("#panel-left").css("max-height",""+adjustHeight+"px");
	} else {
		$("#panel-right").height(newHeight-6);
		if ($("#transcriptFrame").is(":visible")) {
			$("#transcript").height(newHeight-$("#p-r-top").height()-20);
		}
		if ($("#collationFrame").is(":visible")) {
			$("#collation").height(newHeight-$("#c-r-top").height()-20);
		}
	}
}
