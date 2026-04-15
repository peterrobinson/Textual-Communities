function initCollation () {
	$.get(universalBannerLocation, function (data, status){
		$("#editorialMenu").html($(data).find("#editorialMenu").html());
		$("#entityMenu").html($(data).find("#entityMenu").html());		
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
			maxZoomPixelRatio: 4,  //0.5 for stemmata
			minZoomImageRatio: 0.7,
			homeFillsViewer: true,
			prefixUrl: "https://openseadragon.github.io/openseadragon/images/"
		});	
		$.get(iiifURL, function(source) {
			source.overlays=[];
			let scale=1;
			let addX=10;
			let addY=5;
			for (let i=0; i<vWitss.length; i++) {
				vMapMss.push("<span class='vMapMs' id='VMap-"+vWitss[i].name+"'>"+vWitss[i].name+"</span>")
				source.overlays.push({id: "VMap-"+vWitss[i].name, px:(vWitss[i].x*scale+addX), py:(vWitss[i].y*scale+addY), placement:"CENTER" })
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
		$("#VMap-"+outMss[i]).css("font-size","80%");
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

