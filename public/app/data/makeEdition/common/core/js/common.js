//contains routines used by multiple files


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

$(window).bind('resize', resizeRTable);



  
 //TCimages, etc, declared in master HTML file for each page
function openImage () {
	if (iiifURL) {
		viewer = OpenSeadragon({
			id: "panel-left",
			maxZoomPixelRatio: 3,  //0.5 for stemmata
			minZoomImageRatio: 0.7,
			homeFillsViewer: true,
			prefixUrl: "https://openseadragon.github.io/openseadragon/images/"
		});	
		$.get(iiifURL, function(source) {
					if (viewer) viewer.open([source]);
		});
	}
}


function resizeRTable() {
		if ($("#panel-left").is(":visible") && $("#panel-right").is(":visible")) {
		if ($(".gutter-vertical").length && $(window).width()>$(window).height()) {
			//go from vertical to horizontal haha
	//		$("#rTable").height($(window).height()-$("#page-head").height()-12);
			$("#panel-left").height($(window).height()-$("#page-head").height()-12);
			$("#panel-left").css("max-height","");
			$("#panel-right").height($(window).height()-$("#page-head").height()-12);
			console.log("v to h");
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
			console.log("h to v");
			setUpSplit();
		}
	}
	if ($(window).width()<880) {
		$("#grp1").width("100%")
	} else {$("#grp1").width("50%")}
	if (view=="editorial" || view=="compare") {
		$("#panel-right").width("100%");
		$("#rTable").height(""+($(window).height()-$("#page-head").height()-15)+"px");
	}
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
			if ($(".gutter-horizontal").length) $("#transcript").height(newHeight-$("#p-r-top").height()-18);
			if (!$("#panel-left").is(":visible")) {
				$("#panel-right").width("100%");
				$("#transcript").height($("#panel-right").height()-$("#p-r-top").height());
			}
			$("#OAstatement").show();
			$("#footer").show();
			if ($("#footer").length) {
				$("#panel-left").height(newHeight-$("#footer").height()-15);
				$("#panel-right").height(newHeight-$("#footer").height()-15);
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
			$("#collation").height(newHeight-10-$("#c-r-top").height());
		}
		if ($("#searchContainer").is(":visible")) {
			$("#searchContainer").height(newHeight-10);
		}
	}
	if ($("#OAstatement").is(":visible")) {
		var newHeight=$(window).height()-$("#page-head").height()-24-$("#OAstatement").height();
		$("#rTable").height(newHeight);
	}
 }
 
 function setUpSplit(){
 	if (view=="index") return;
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

function initializeSplitView() {
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
	//reset rTable height...
	
	if ($(window).width()<$(window).height()) {
		//first time through .. set to half height. 
		 var newHeight=($(window).height()-$("#page-head").height())/2-12;
		setUpSplit();
		 $("#panel-left").height(newHeight);
		 $("#panel-right").height(newHeight);
		 $("#rTable").height($(window).height()-$("#page-head").height()-18); //needed in mE
		 $("#rTable").css("display","block");
	 	if ($(".gutter-horizontal").length) $("#transcript").height(newHeight-$("#p-r-top").height()-18);
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
		 if ($(".gutter-horizontal").length) $("#transcript").height(newHeight-$("#p-r-top").height()-18);
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
//			$("#transcript").height(newHeight-$("#p-r-top").height()-20);
		}
		if ($("#collationFrame").is(":visible")) {
			$("#collation").height(newHeight-$("#c-r-top").height()-20);
		}
	}
}


 var mydragg = function(){
	return {
		move : function(divid,xpos,ypos){
			divid.style.left = xpos + 'px';
			divid.style.top = ypos + 'px';
		},
		startMoving : function(divid,container,evt){
			evt = evt || window.event;
			var posX = evt.clientX,
				posY = evt.clientY,
			divTop = divid.style.top,
			divLeft = divid.style.left,
			eWi = parseInt(divid.style.width),
			eHe = parseInt(divid.style.height),
			cWi = parseInt(document.getElementById(container).style.width),
			cHe = parseInt(document.getElementById(container).style.height);
			divTop = divTop.replace('px','');
			divLeft = divLeft.replace('px','');
			var diffX = posX - divLeft,
				diffY = posY - divTop;
			document.onmousemove = function(evt){
				evt = evt || window.event;
				var posX = evt.clientX,
					posY = evt.clientY,
					aX = posX - diffX,
					aY = posY - diffY;
					if (aX < 0) aX = 0;
					if (aY < 0) aY = 0;
					if (aX + eWi > cWi) aX = cWi - eWi;
					if (aY + eHe > cHe) aY = cHe -eHe;
				mydragg.move(divid,aX,aY);
			}
		},
		stopMoving : function(container){
			var a = document.createElement('script');
			document.onmousemove = function(){}
		},
	}
}();

function label(entity) {
	let parts=entity.split(":");
	let labelStr="";
	for (let i=0; i<parts.length; i++) {
		if (i==0) {
			if (typeof aliases!="undefined") {
				if (aliases.filter(item=>item.topEntity==parts[i] && item.context=="all").length>0) {
					labelStr=aliases.filter(item=>item.topEntity==parts[i] && item.context=="all")[0].alias;
				} else {
					labelStr=parts[i];
				}
			} else {
				labelStr=parts[i];
			}
		} else {
			let keyVals=parts[i].split("=");
			if (typeof aliases !="undefined") {
				if (aliases.filter(item=>item.key==keyVals[0] && item.context=="menus").length>0) {
					let alias=aliases.filter(item=>item.key==keyVals[0] && item.context=="menus")[0].alias;
					if (alias=="") {
						labelStr+=" "+aliases.filter(item=>item.key==keyVals[0] && item.context=="menus")[0].alias+keyVals[1];
					} else {
						labelStr+=" "+aliases.filter(item=>item.key==keyVals[0] && item.context=="menus")[0].alias+" "+keyVals[1];
					}
				} 
			}
		}
		if (i<parts.length-1) labelStr+", ";
	}
	return (labelStr);
}

function setCookie(cname, cvalue, exdays) {
  const d = new Date();
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
  let expires = "expires="+d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
  let name = cname + "=";
  let ca = document.cookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}