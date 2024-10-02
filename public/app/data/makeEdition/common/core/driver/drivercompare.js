const punctuation=".,:-/&@¶§;·⸫▽?!'"+'"';
const suffixes=["","-mod","-orig"]

function initCompare () {
	if (!isstandalone) {
		let banner=universalBanner;
	    banner=banner.replaceAll("xxxx", "<").replaceAll("yyyy", ">").replaceAll("zzzz", "&nbsp;");
	    $("#page-head").html(banner);
		createCompare();
	} else {
		if (!ssSearch) {
			$("#staticSearch").remove();
		}
		if (!hasVBase) {
			$("#VBase").remove();
			$("#VBaseLink").remove();
		}
		createCompare();
	}
}

function createCompare() {
	$("#title").html("Compare: "+makeEntitySpan(reformEntities(currEntities)));
	$("#entityMenu").html(initializeEntityChoice(currEntity));
	$("#rTable").show();
	$("#panel-left").hide();
	$("#panel-right").show();
	$("#compareFrame").show();
	resizeRTable(); 
	if (prevCompare!="") {
		$("#cfPrev").html("<a href='javascript:moveCompare(\""+prevCompare+"\",\""+prevCompare+"\")'><img class='cli' src='/app/data/makeEdition/common/core/images/iconPrev.png' height='24' /> "+formatEntityLabel(prevCompare))+"</a>";
	}
	if (nextCompare!="") {
		$("#cfNext").html("<a href='javascript:moveCompare(\""+nextCompare+"\",\""+nextCompare+"\")'>"+formatEntityLabel(nextCompare)+" <img class='cli' src='/app/data/makeEdition/common/core/images/iconNext.png' height='24' /></a>");
	}
	//link move on one line
	$("#cfNextLine").html("<a href='javascript:cfMoveNextLine()'>></a>");

	//get link for transcription
	let thisPage=getMSPage(currEntity, currMS)
	$("#cfTranscript").html("<a id=\"cfTranscriptLink\" href='javascript:getTranscriptFromCollation(\""+currMS+"\",\""+thisPage+"\",\""+currEntity+"\")'>Transcript</a>");
	let fref="../../collationreg/"+currEntity.slice(0, currEntity.lastIndexOf(":"))+"/"+currEntity.slice(currEntity.lastIndexOf(":")+1)+".html";
	$("#cfCollation").html("<a id=\"cfCollationLink\" href='"+fref+"'>Collation</a>");
	$("#cfInfo").html(makeEntitySpan(reformEntities(currEntities)));
	let topEntity="";
	let wits=[];
/*	for (let i=0; i<entityPages.filter(page=>page.entity==topEntity)[0].witnesses.length; i++) {
		wits.push(entityPages.filter(page=>page.entity==topEntity)[0].witnesses[i].name);
	}  */
	console.log("here");
	for (let i=0; i<currEntities.length; i++) {
		thisTopEntity=currEntities[i].slice(0, currEntities[i].lastIndexOf(":"));
		if (thisTopEntity==topEntity) {
			continue;
		} else {
			let myWits=entityPages.filter(page=>page.entity==thisTopEntity)[0].witnesses
			for (let j=0; j<myWits.length; j++) {
				if (!wits.includes(myWits[j].name)) {
					wits.push(myWits[j].name);
				}
			}
			topEntity=thisTopEntity;
		}
	}
//	wits.splice(5);  // to test on just a few mss	
	let mss=moveBase(wits.sort());
	if (mss[0]=="Base")	mss[0]="Edition";
//	mss=["Edition"];  //for test
	let select="";
	let boxes="";
	for (let i=0; i<mss.length; i++) {
		select+="<span class='cfSpan'><input id='cfTextSelect"+i+"' data-n='"+i+"' data-wit='"+mss[i]+"' onclick='cfChoose(\""+i+"\")' type='checkbox' />"+mss[i]+"</span> ";
		boxes+="<div id=\"cfText"+i+"\" class=\"cfText\"> \
					<div id=\"cfTextHeader"+i+"\" class=\"cfTextHeader\">\
						<span id=\"cfTextClose"+i+"\" class=\"cfTextClose\"><img onclick=\"closeCfText("+i+")\" src=\"../../../common/core/images/close.png\" height=\"16px\" /></span><span id=\"cfTextSigil"+i+"\" class=\"cfSigil\">"+mss[i]+"</span><span id=\"cfTextAdd"+i+"\" class=\"cfTextAdd\" ><a id=\"cfTextAddLink"+i+"\" class=\"cfTextAddLink\" href=\"javascript:addImage("+i+")\"><img class=\"menuimg\" height=\"12\" src=\"/app/data/makeEdition/common/core/images/camera-black.png\" width=\"15\"/></a></span>\
					</div>\
					<div id=\"cfTextWords"+i+"\" class=\"cfTextWords\">\
					</div>\
				</div>\
				<div id=\"cfImage"+i+"\" class=\"cfImage\"> \
					<div id=\"cfImageHeader"+i+"\" class=\"cfImageHeader\">\
						<span id=\"cfImageClose"+i+"\" class=\"cfImageClose\"><img onclick=\"closeCfImage("+i+")\" src=\"../../../common/core/images/close.png\" height=\"16px\" /></span><span id=\"cfImageSigil"+i+"\" class=\"cfSigil\">"+mss[i]+"</span><span id=\"cfImageSigilSpan"+i+"\" class=\"cfSigil\"></span><span id=\"cfImageAdd"+i+"\" class=\"cfImageAdd\" ><a id=\"cfImageAddLink"+i+"\" class=\"cfTextImageLink\" href=\"javascript:addText("+i+")\"><img class=\"menuimg\" height=\"18\" src=\"/app/data/makeEdition/common/core/images/text.png\" width=\"15\"/></a></span>\
					</div>\
					<div id=\"cfImageWords"+i+"\" class=\"cfImageWords\" data-iiifurl=\"\"> \
					</div> \
																																																						</div>";
	}
	$("#cfWitsChoice").html(select);
	//remove image link from edition
	$("#cfWitsFrame").html(boxes);
	$("#cfTextAdd0").remove();
	if (mss[0]=="Edition") mss[0]="Base";
	fillTextImageBoxes(mss, function(){
		//get the approved collation for each line
		doImages(mss, function(){
			doPUCollations(mss, function(){
				callbackCompare();
			});
		})
	})
}


function doPUCollations(mss, callback){ //just do edition now
	let index=0;
	let myMss=[mss[0]];
	async.mapSeries(myMss, function(ms, cbmss) {
		console.log("Making popup collations for "+ms)
		let lines=$("#cfTextWords"+index).find("l");
		index++;
		async.mapSeries(lines, function(line, cblines) {
			let myentity=$(line).attr("data-entity")
			let json=collations.filter(entity=>entity.entity==myentity)[0].collation;
			let structure=JSON.parse(json).structure;
			createWordAppLine(structure, line, myentity, json, ms, cblines);
			cblines(null,[]);
		}, function (err){
			cbmss(null,[]);
		})
	}, function (err) {
		callback(null, []);
	});
}

function doImages(mss, cb) {
	console.log("Getting images for manuscripts");
	async.mapSeries(mss, function (ms, callback){
		if (ms=="Base") {
			callback(null,[]);
		} else {
			let witn=mss.indexOf(ms);
			let lines=$("#cfTextWords"+witn).find("l");
			let lastPage="";
			let lastIIIF="";
			console.log("Getting images for "+ms);
			async.mapSeries(lines, function (line, cbline){
				if ($(line).find("span.cfTextOut").length>0) {
					cbline(null, []);
				} else {
					 let myEntity=$(line).attr("data-entity");
					 let myMs= $(line).attr("data-ms");
					 let myPage=getMSPage(myEntity, myMs);
					 if (myPage==lastPage) {
					 	if (lastIIIF!="")  {
					 		$(line).attr("data-iiifURL", lastIIIF);
					 		$(line).attr("data-page", myPage);
					 	}
					 	cbline(null, []);
					 } else {
						 $.get(TCimagesUrl+"/uri/urn:det:tc:usask:"+imagesCommunity+"/document="+myMs+":folio="+myPage+"?type=IIIF&format=url", function(url) {
							if (url.length) {
								lastPage=myPage;
								$(line).attr("data-iiifURL", url[0].url);
								$(line).attr("data-page", myPage);
								lastIIIF=url[0].url;
							} else {
								lastPage=myPage;
								lastIIIF="";
							}
							cbline(null, []);
						 });
					 }
				}
			}, function (err){
				callback(null, []);
			})
		}
	}, function (err){
		cb();
	});
}



function fillTextImageBoxes (mss, callback) {
	let collations=[];
	async.mapSeries(currEntities, function(entity, cblines){ 
		$.get(TCurl+"/uri/urn:det:tc:usask:"+TCcommunity+"/entity="+entity+"?type=apparatus&format=approved") 
			.done (function(json) {
				let collation=JSON.parse(json).structure;
				collations.push({"entity": entity, "collation":json})
				let wits=identifyAppWits(collation, mss); //witnesses.noApps has wits with no mod/orig which can be constructed from the collations; readings with -mod -orig cannnot
				//process here just those without any apps.. get from collation alone
				for (let i=0; i<wits.noApps.length; i++) {
					let witn=mss.indexOf(wits.noApps[i]);
					createCollationLine (collation, wits.noApps[i], witn, entity, "compare"); 
				}
				//now we need to process mss which have apps..
				if (wits.hasApps.length>0) {
					async.mapSeries(wits.hasApps, function(hasApp, cbHasApps) {
						getAppLine(TCcommunity, entity, hasApp, mss.indexOf(hasApp), "compare", cbHasApps);
					}, function (err) {
						console.log("Written compare for "+entity)
						cblines(null,[]);
					});
				} else {
					console.log("Written compare for "+entity)
					cblines(null,[]);
				}
			})
			.fail (function( jqXHR, textStatus, errorThrown ) {
				//if there is NO collation we going to have to get the line from each witness
				//as indeed we do for hasApps wits ... follow same procedure..
				console.log(jqXHR);
				console.log(textStatus);
				console.log(errorThrown );
				cblines(null,[]);
		})
	}, function (err) {
		let conscript2='\r<script type="text/javascript">const collations='+JSON.stringify(collations)+';';
		conscript2+='</script>';
		$( "head" ).append(conscript2);
		callback(null);
	});
}


function callbackCompare () {
 	//only here if all tasks complete. Prepare for ulitmate display
 	$(".driverScript").remove();
	$("#rTable").height("90%");
	$("#panel-right").height("100%");
	$("#panel-right").width("100%");
 	$(".gutter").remove();
 	$("#cfWitsFrame").hide();
 	var s = new XMLSerializer();
	var d = document;
	var str = s.serializeToString(d);
	window.parent.postMessage(str, "*");
 }











