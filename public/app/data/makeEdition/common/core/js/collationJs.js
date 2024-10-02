function initCollation () {
	$("#page-head").load(universalBannerLocation, function (){
		if (ssSearch) {
				$("#staticSearch").html("<script xmlns='http://www.w3.org/1999/xhtml' src='../../../staticSearch/ssSearch.js'></script>\n<script xmlns='http://www.w3.org/1999/xhtml' src='../../../staticSearch/ssInitialize.js'>\n</script><script xmlns='http://www.w3.org/1999/xhtml' src='../../../staticSearch/ssHighlight.js'></script>\n<form xmlns='http://www.w3.org/1999/xhtml' accept-charset='UTF-8' id='ssForm'  data-allowphrasal='yes' data-allowwildcards='yes' data-minwordlength='2'  data-scrolltotextfragment='no' data-maxkwicstoshow='5' data-resultsperpage='5'  onsubmit='return false;' data-versionstring='' data-ssfolder='../../../staticSearch' data-kwictruncatestring='...' data-resultslimit='2000'><span class='ssQueryAndButton'><input type='text' id='ssQuery' style='height: 26px' aria-label='Search'/><button id='ssDoSearch' style='background-image: url(\"../../../common/core/images/searchicon.png\")');>Search</button></span></form>\n<div xmlns='http://www.w3.org/1999/xhtml' id='ssSearching'></div>")
			}
		$("#entityMenu").html(initializeEntityChoice(currEntity));
		$("#MS").val(currMS);
		if (hasVMap) {
			initializeSplitView();
			openStemma();
		} else {
			$("#panel-right").width("100%");
		}
		resizeRTable();  
	});
}

function openStemma() {
	let vMapMss=[];
	if (iiifURL) {
		viewer = OpenSeadragon({
			id: "panel-left",
			maxZoomPixelRatio: 1,  //0.5 for stemmata
			minZoomImageRatio: 0.7,
			homeFillsViewer: true,
			prefixUrl: "https://openseadragon.github.io/openseadragon/images/"
		});	
		$.get(iiifURL, function(source) {
			source.overlays=[];
			for (let i=0; i<vWitss.length; i++) {
				vMapMss.push("<span class='vMapMs' id='VMap-"+vWitss[i].name+"'>"+vWitss[i].name+"</span>")
				source.overlays.push({id: "VMap-"+vWitss[i].name, px:(vWitss[i].x*2.85), py:(vWitss[i].y*2.85), placement:"CENTER" })
			}
			$("#VMapIDs").html(vMapMss.join());
			if (viewer) viewer.open([source]);
			populateVMapLine();
			$('div.VMAdiv').hover(VMapHoverIn);
			$('#VMLine').hover(VMapLineHoverIn);
		});
	}
}


function setVMapColors(appno, id) {
	for (let i=0; i<vWitss.length; i++) {
		$("#VMap-"+vWitss[i].name).hide();
	}
	if (regState || (!regState && wordState)) {
		for (var a=0; a<VMapApp[appno].variants.length; a++) {
			for (var i=0; i<VMapApp[appno].variants[a].wits.length; i++) {
				$("#VMap-"+VMapApp[appno].variants[a].wits[i]).css({color:'#'+colors[a]});
				$("#VMap-"+VMapApp[appno].variants[a].wits[i]).show()
		//		else alert("Ms "+VMapApp[appno].variants[varno].wits[i]+" not found")
			}
		}
	}
	if (!regState && !wordState) {
		var index=0;
		for (var a=0; a<VMapApp[appno].variants.length; a++) { 
			for (var b=0; b<VMapApp[appno].variants[a].spellings.length; b++) {
				for (var c=0; c<VMapApp[appno].variants[a].spellings[b].wits.length; c++) {
					$("#VMap-"+VMapApp[appno].variants[a].spellings[b].wits[c]).css({color:'#'+colors[index]});
					$("#VMap-"+VMapApp[appno].variants[a].spellings[b].wits[c]).show()
				}
				index++;
			}
		}
	}
	for (let i=0; i<outMss.length; i++) {
		$("#VMap-"+outMss[i]).html("["+outMss[i]+"]");
		$("#VMap-"+outMss[i]).css("color","black");
		$("#VMap-"+outMss[i]).css("font-size","50%");
		$("#VMap-"+outMss[i]).show();
	}
}

function populateVMapLine() {
		//should test for error
	colors=palette('mpn65', 2);
	for (var i=0; i<currMss.length; i++) {
		$("#VMap-"+currMss[i]).css({color:'#'+colors[0]});
		$("#VMap-"+currMss[i]).show()
	}
//		else alert("Ms "+currWits[i]+" not found")
	for (var i=0; i<outMss.length; i++) {
		$("#VMap-"+outMss[i]).css({color:'#'+colors[1]});
		$("#VMap-"+outMss[i]).show()
	}
	$('#VMLine').css("background", "whitesmoke");
	$('#VMLine a').css("color", "#"+colors[0]);
	$('#VMLout').css("color", "#"+colors[1]);
}

function VMapLineHoverIn() {
	$("#collationText div").css("background", "");
	$("#collationText a").css("color", "")
	$("#collationText p").css("color", "")
	$("#collationText span").css("color", "")
	populateVMapLine();
}

function VMapHoverIn (){
	$("#collationText div").css("background", "");
	$("#collationText a").css("color", "")
	$("#collationText p").css("color", "")
	$("#collationText span").css("color", "")
	var myDiv="#"+$(this).attr("id");
	$('#VmapUL').empty();
	$(myDiv).css("background", "whitesmoke");
	var myPels=myDiv+" span";
	//set colors from color palette depending on how many we have...
	colors=palette('mpn65', $(myPels).length);
	$(myPels).each(function(index){
		$(this).find("a").css("color", "#"+colors[index]);
		$(this).css("color", "#"+colors[index]);
	})
	setVMapColors($(myDiv).attr("data-n"), $(this).attr("id"));
}

