const suffixes=["","-mod","-orig"]; //used to handle alternative app readings

function initCollation() {
	if (!isstandalone) {
		let banner=universalBanner;
	    banner=banner.replaceAll("xxxx", "<").replaceAll("yyyy", ">").replaceAll("zzzz", "&nbsp;");
	    $("#page-head").html(banner);
		createCollation();
	} else {
		createCollation();
	}
}

function createCollation() {
	if (!regState) {
		$("#spellingBox").prop('checked', true);
		$("#spellingSpan").show();
		if (wordState) $("#wordsBox").prop('checked', true);
	}
	$("#entityMenu").html(initializeEntityChoice(currEntity));
	$("#MS").val(currMS);
	$("#title").html("Collation of "+label(currEntity));
	$("#rTable").show();
	$("#panel-right").show();
	$("#collationFrame").show();
	if (!ssSearch) {
		$("#staticSearch").remove();
	}
	if (!hasVBase) {
		$("#VBase").remove();
		$("#VBaseLink").remove();
	}
	if (hasVMap) {
		initializeSplitView();
		resizeRTable();
	} else {
		$("#panel-left").hide();
		$("#panel-right").width("100%");
		$("#VMInfo").hide();
		resizeRTable();
	}
	async.waterfall([
		function(callback) {
			setUpVMap(callback);
		 },
		 function(arguments, callback) {
		 	getXMLApp(callback);
		 },
		 function(apparatus, currMSS, callback) {
			getChoice(apparatus, currMSS, regState, wordState, callback);
		 },
	 ], function (err) {
		//get here when we are ready to write to the database
		callbackCollation();
	});
}


function callbackCollation () {
	//remove driver stuff
	let conscript2='\r<script type="text/javascript">const currMss='+JSON.stringify(currWits)+';\r';
	conscript2+='const outMss='+JSON.stringify(outWits)+';</script>';
	$( "head" ).append(conscript2);
	if (thisVMapApp!=[]) {
		conscript2='\r<script type="text/javascript">const VMapApp='+JSON.stringify(thisVMapApp)+'</script>';
		$( "head" ).append(conscript2);
	}
	$(".driverScript").remove();
	$("#tipDiv").remove();
	$("#rTable").height("90%");
	$("#panel-right").height("100%");
	$("#panel-right").width("50%");
 	$(".gutter").remove();
	var s = new XMLSerializer();
	var d = document;
	var str = s.serializeToString(d); 
	window.parent.postMessage(str, "*");
}




function setUpVMap(callback) {
	//open the image here
	if (!hasVMap) {
		callback(null, null);
	} else {
		//note: will need to deal with different stemmas for different parts of a work. Done in stemmatics.js
		$.get(TCurl+"/uri/urn:det:tc:usask:"+VMap.community+"/document="+VMap.document+":folio="+VMap.page+"?type=IIIF&format=url", function(url) {
			if (url.length) {
				let conscript='\r<script type="text/javascript">\r\tconst iiifURL="'+url[0].url+'";</script>';
				$( "head" ).append(conscript);
				$.get(TCurl+"/uri/urn:det:tc:usask:"+community+"/vmap="+VMap.document, function (vMap) {
					let conscript2='\r<script type="text/javascript">\r\tconst vWitss='+JSON.stringify(vMap.wits)+"; </script>";
					$( "head" ).append(conscript2);
					callback(null, null);
				});

			} else {
				console.log="No stemma found for "+VMap.document+" "+VMap.page;
				$( "head" ).append('\r<script type="text/javascript">\r\tconst iiifURL=null; </script>');
				callback(null, null);
			}
	/*		$.get(url[0].url, function(source) {
				source.overlays=[];
				$.get(TCurl+"/uri/urn:det:tc:usask:"+community+"/vmap="+thisTale, function (vMap) {
					entities.filter(entity=>entity.entity==thisTale)[0].vMapWits=JSON.parse(JSON.stringify(vMap.wits));  //probably need to deep copy this fella
					populateVMaps(source);
					callback(null, null);
				});
			}); */
		});
	} 
}

function populateVMaps(source) {
	let vMapMss=[];
	let thisTale="";
	if (typeof entities.filter(entity=>entity.entity==currTale)[0].vMapAlias=="undefined") {
		thisTale=currTale;
	} else {
		thisTale=entities.filter(entity=>entity.entity==currTale)[0].vMapAlias;
	}
	for (let i=0; i<entities.filter(entity=>entity.entity==thisTale)[0].vMapWits.length; i++) {
		let myMs=entities.filter(entity=>entity.entity==thisTale)[0].vMapWits[i];
		vMapMss.push("<span class='vMapMs' id='VMap-"+myMs.name+"'>"+myMs.name+"</span>")
		source.overlays.push({id: "VMap-"+myMs.name, px:(myMs.x*4/3), py:(myMs.y*4/3), placement:"CENTER" })
	};
	
	$("#VMapIDs").html(vMapMss.join());
	//save this for viewer...
	$("#VMapImageSource").html(JSON.stringify(source));  //unpack when we display
/*	if (viewer) viewer.open([source]);
	viewer.viewport.maxZoomPixelRatio=1; */
	for (let i=0; i<entities.filter(entity=>entity.entity==thisTale)[0].vMapWits.length; i++) {
		let thisMs=entities.filter(entity=>entity.entity==thisTale)[0].vMapWits[i];
		$("#VMap-"+thisMs.name).hide();
	}
}

function getChoice(xmlApparatus, currMSS, onlyReg, words, callback) {
	$.get(TCurl+"/uri/urn:det:tc:usask:"+community+"/entity="+currEntity+"?type=apparatus&format=approved", function (apparatus) {
		$("#searchVBase").hide()
		$("#splash").hide()
		$("#rTable").css("display","flex")
		$('#collationFrame').show();
		$('compareFrame').hide();
		$('#transcriptFrame').hide();
		$('#OAstatement').hide();	
		$('#collationText').empty();  
		$('#collation').css("margin", "20");
		makeFromAppME(xmlApparatus, currMSS, apparatus, onlyReg, words, hasVMap,false, false, currEntity, callback);
	});
}



//only needed when we display...

function populateVMapLine() {
		//should test for error
	colors=palette('mpn65', 2);
	let thisTale="";
	if (typeof entities.filter(entity=>entity.entity==currTale)[0].vMapAlias=="undefined") {
		thisTale=currTale;
	} else {
		thisTale=entities.filter(entity=>entity.entity==currTale)[0].vMapAlias;
	}
	for (var i=0; i<currWits.length; i++) {
		var thisMs=entities.filter(entity=>entity.entity==thisTale)[0].vMapWits.filter(function (obj){return obj.name === currWits[i];})[0];
		if (thisMs) {
			$("#VMap-"+thisMs.name).css({color:'#'+colors[0]});
			$("#VMap-"+thisMs.name).show()
		}
//		else alert("Ms "+currWits[i]+" not found")
	}
	for (var i=0; i<outMSS.length; i++) {
		var thisMs=entities.filter(entity=>entity.entity==thisTale)[0].vMapWits.filter(function (obj){return obj.name === outMSS[i];})[0];
		if (thisMs) {
			$("#VMap-"+thisMs.name).css({color:'#'+colors[1]});
			$("#VMap-"+thisMs.name).show()
//		else alert("Ms "+currWits[i]+" not found")
		}
	}
	$('#VMLine').css("background", "whitesmoke");
	$('#VMLine a').css("color", "#"+colors[0]);
	$('#VMLout').css("color", "#"+colors[1]);
}
