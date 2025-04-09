//generic javascript for handling CTP transcripts

//next injected into driver file
//var TCurl="";
//var TCimages="https://textualcommunities.org";
//var community="";
const punctuation=".,:-/&@¶§;·⸫▽?!'"+'"';
const suffixes=["","-mod","-orig"]; //used to handle alternative app readings
var popCollations=[];

	
//this creates whole transcript and send to the database..
function initMyTranscript(ms, page) {
	if (typeof ms != "undefined") currMS=ms;
	if (typeof page != "undefined") currPage=page;
	openImage(function(){
		openTranscript();
	});
}

function getCurrTale () {
	if (typeof MakeEdition!="undefined") {return true}
	let found=false;
	for (let j=0; j<currEntities.length && !found; j++) {
		if (typeof eval(currEntities[j].val+"pages")[currMS]!="undefined") {
			if (eval(currEntities[j].val+"pages")[currMS].filter(page=>page.page==currPage).length) {
				found=true;
				currTale=currEntities[j].val;
				$("#tale option[value='" + currTale + "']").prop("selected", true);
				populateMSS();
			}
		}
	}
	return(found);
}

//in makeEdition: we inject the currMS currPage prevPage nextPage viewType etc values into the index.html driver file

function initMyEdition() {
	if (viewType=="transcript") {
	//	TCurl=window.location.protocol + "//"+window.location.host;
	//	TCimages=window.location.protocol + "//"+ window.location.host;
		if (prevPage!="null") $("#prevPageLink").html("<a height='18px' id=\"pplA\" href=\""+prevPage+".html\">"+prevPage+"</a>");
		if (nextPage!="null") $("#nextPageLink").html("<a height='18px' id=\"nplA\" href=\""+nextPage+".html\">"+nextPage+"</a>");
		$("#titleEdition a").html(title);
		populateMSS();
		if (!getCurrTale()) console.log("problem finding page... from URL")
		initTranscript(currMS, currPage);
	} else if ($.urlParam("view")=="collation") {
		currLine=$.urlParam("line");
		currTale=$.urlParam("entity");
		$("#tale").val(currTale);
		$("#line").val(currLine);
		let regState=true;
		let wordState=true;
		if ($.urlParam("onlyReg")=="false") {
			$("#spellingBox").prop('checked', true);
			regState=false;
			$("#spellingSpan").show();
		}
		if ($.urlParam("words")=="false") wordState=false;
		if (wordState) $("#wordsBox").prop('checked', true);
		$("#splash").hide();
		$("#rTable").css("display","flex");
		initializeTranscript();
		resizeRTable();
		$(window).resize(resizeRTable);
		var panelRight = new Clay('#panel-right');
		panelRight.on('resize', function(size) {
			 resizeRTable();
		});
		getCollation(regState, wordState);
	} else if ($.urlParam("view")=="VBase") {
		startVBfromURL();
	}
}

function getTranscriptInf (cb){
	if (currMS=="Base") {
		cb(null, []);
		return;
	}
	$.get(TCurl+"/uri/urn:det:tc:usask:"+TCCommunity+"/document=Base:folio=1?type=transcriptInf", function(baseInf) {
		//may contain all the information we need...
		var transcriptInfo="Transcript of folio "+currPage+" in "+witnesses[currMS].id+". ";
			let node = document.createElement("div");
			$(node).html(baseInf.teiHeader);
			//$('#XMLBase').html(baseInf.teiHeader);
			if ($(node).find('respStmt[n="General"]').length==0) {
				var genMSInf=""
			} else {
				var genMSInf=$(node).find('respStmt[n="General"]')[0].innerText;
			}
			$.get(TCurl+"/uri/urn:det:tc:usask:"+TCCommunity+"/document="+currMS+":folio="+currPage+"?type=transcriptInf", function(transcriptInf) {
		//		$('#XMLP').html(transcriptInf.teiHeader);
				let node2 = document.createElement("div");
				$(node2).html(transcriptInf.teiHeader);
				//is there a header specific to this ms?
				var specMSInf=$(node2).find('respStmt[n="whole"]')[0]
				if (specMSInf) transcriptInfo+=specMSInf.innerText;
				else transcriptInfo+=genMSInf;
				//get the entities on this page
				$.get(TCurl+"/uri/urn:det:tc:usask:"+TCCommunity+"/entity=*:document="+currMS+":folio="+currPage+"?type=list", function(entities) {
					var ents=[];
					for (let i=0; i<entities.length; i++) {
						if (!entities[i].collateable) { //get CTP identifier
							if (typeof entities[i].entity!="undefined")
								ents.push(entities[i].entity.slice(entities[i].entity.indexOf("=")+1));
						}
					} 
					//get transcription statemeent for this part of the text
					for (let i=0; i<ents.length; i++)  {
						let findEnt='respstmt[n="'+ents[i]+'"]';
						if ($(node).find(findEnt).length>0)
						 	transcriptInfo+=$(node).find(findEnt)[0].innerText;
					}
					let findEnt='respstmt[n="'+currMS+'"]';
						if ($(node).find(findEnt).length>0)
						 	transcriptInfo+=$(node).find(findEnt)[0].innerText;
					for (let i=0; i<transcriptInf.transcribers.length; i++) {
						if (i==0) transcriptInfo+="This page transcribed by "
						 transcriptInfo+=transcriptInf.transcribers[i];
						 if (i<transcriptInf.transcribers.length-2) transcriptInfo+=", ";
						 if (i==transcriptInf.transcribers.length-2) transcriptInfo+=" and ";
						  if (i==transcriptInf.transcribers.length-1) transcriptInfo+=". ";
					}
					var date= new Date(transcriptInf.commitdate);
					var options = {year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false};
					transcriptInfo+="Last commit by "+transcriptInf.committer+": "+date.toLocaleTimeString("en-us", options)+".";
					if (transcriptInf.uncommittedtranscripts) transcriptInfo+=" There are uncommitted transcripts of this page."
					$('#transcriptInf').append(transcriptInfo);
					cb(null, []);
				});
			});
	});
}
function populateMSS() {
	if (typeof MakeEdition=="undefined") {
		currTale=$("#tale").val();
		let myMss=eval(currTale+"mss");
		$("#MS").empty();
		let isSelected=false;
		for (let i=0; i<myMss.length; i++) {
			if (currMS==myMss[i].name) {
				$("#MS").append("<option value='"+myMss[i].name+"' SELECTED>"+myMss[i].name+"</option>")
				isSelected=true; 
			} else {
				$("#MS").append("<option value='"+myMss[i].name+"'>"+myMss[i].name+"</option>")
			}
		}
		if (!isSelected) { //current ms selected not in this tale/link
			if (myMss.filter(ms => ms.name=="Hg").length) {
				currMS="Hg";
			} else if (myMss.filter(ms => ms.name=="El").length) {
				currMS="El";
			} else {
				currMS=myMss[0].name
			}
			$("#MS option[value='" + currMS + "']").prop("selected", true);
		}
	} 
}

function openImage (callback) {
	$.get(TCimages+"/uri/urn:det:tc:usask:"+imagesCommunity+"/document="+currMS+":folio="+currPage+"?type=IIIF&format=url", function(url) {
		if (url.length) {
// we write the url to the file here
//				if (viewer) viewer.open([source]);
				var conscript='<script type="text/javascript">\r\tconst iiifURL="'+url[0].url+'";\r\tconst thisMS="'+currMS+'";\r\tconst thisPage="'+currPage+'";\r</script>';
				$( "head" ).append(conscript);
				callback();
		} else { //we might not have an image! still write the transcript (could be the base)
			var conscript='<script type="text/javascript">\r\tconst iiifURL="null";\r\tconst thisMS="'+currMS+'";\r\tconst thisPage="'+currPage+'";\r</script>';
			$( "head" ).append(conscript);
			callback();
		}
	});
}

function openTranscript() {
	$("#t-c1-text").empty();
	$("#t-c1-text").width("600px");
	$("#t-c2-text").empty();
	$("#t-c2-text").width("600px");
	$("#transcriptFrame").show();
	$("#collationFrame").hide();
	$("#searchVBase").hide();
	$("#popUps").empty();
	$("#popUps").append("<div id=\"WordColl\">&nbsp;</div>");
//	getImageInf();	
	resizeRTable();
	$.get( TCurl+"/uri/urn:det:tc:usask:"+TCCommunity+"/document="+currMS+":folio="+currPage+"?type=transcript&format=xml", function(xml) {
		let text=adjustText(xml, true);  //get rid of superfluous encoding, changle lbs, deal with embedded ed notes
		// do we have columns???
		emptyMargins();
		if (text.indexOf("<cb")>-1) {
			doTextColumns(text);
			doMargins(1, true);
			doMargins(2);
			adjustMarginSizes();
			doLineNumbers(1);
			doLineNumbers(2);
			$($("#t-c2-linenumbers")[0]).css("width", "25px");
			if ($("#t-b").is(":visible")) {
				doExtraLineNumbers(1);
				doExtraLineNumbers(2);
			}
		} else {
			$("#t-c1-text").html("<div>"+text+"</div>");
			doMargins(1,false);
			adjustMarginSizes();
			doLineNumbers(1);
			finishTranscript();
		}
	});
}

function finishTranscript() {
	if (typeof $("am")[0]!="undefined") {$("#selectAbbrev").show(); $("ex").hide();} else {$("#selectAbbrev").hide()}
	if (typeof $("app")[0]!="undefined")  {$("#selectApp").show()} else { $("#selectApp").hide()}
	$("rdg[type=orig]").hide();
	$("rdg[type=mod]").hide();
	$("rdg[type=lit]").show();
	$("#selectApp option[value='lit']").prop("selected", true);
	doUnderDots();
	getWECollationElements(function (){
		doWords();
		checkDivs();
		let words=$("#transcript-text w");
		for (let a=0; a<words.length; a++) {
//			$(words[a]).addClass("showTip WordColl");
//			$(words[a]).hover(setUpCollation, hideCollation);
		} 
		if (typeof MakeEdition=="undefined") {
			window.history.pushState(null, null, "index.html?ms="+currMS+"&page="+currPage);
		} else { // have to replace with call to write all the collations in ...
		//	getWECollationElements();
			//add currMS variables etc to the document, so we can open images in here
			//do a waterfall to 
			async.waterfall([
				function (cb) {
					getTranscriptInf (cb);
				}
			], function (err) {
				var s = new XMLSerializer();
				var d = document;
				var str = s.serializeToString(d);
				$.ajax({
				  url: TCurl+"/api/writeMakeEdition",
				  type: 'POST',
				  data:  JSON.stringify({id: "Transcript-"+TCCommunity+"-"+currMS+"-"+currPage, html: str, community: TCCommunity}),
				  accepts: 'application/json',
				  contentType: 'application/json; charset=utf-8',
				  dataType: 'json'
				}).done(function( data ) {
				   self.success="HTML saved to database";
				   self.error="";
				  })
				 .fail(function( jqXHR, textStatus, errorThrown) {
				  self.success="Error " + errorThrown;
				});
			});
		}
	}); // map collateable content on this page 
}

function getWECollationElements(callback) {
	//get every line collated here
	//do it this way. Get every collation level element on this page and then get the collation for each 
	//that way doesn't matter whether collatable chunks are lines, paras, abs
	return (callback());
	 $.get(TCurl+'/uri/urn:det:tc:usask:'+TCCommunity+'/entity=*:document='+currMS+':pb='+currPage+'?type=list', function (pEnts) {
	//	 let lines=$("l");  //obvio won't work if we have paragraphs
		 //restructure pEnts..
		 for (let i=0; i<pEnts.length; i++) {
			let match=";"
			let index=pEnts[i].entity.indexOf("entity=")+7;
			let index2=pEnts[i].entity.indexOf(":", index);
			if (index2>-1) {
				let index3=pEnts[i].entity.indexOf("=", index2);
				match=pEnts[i].entity.slice(index, index2)+"_"+pEnts[i].entity.slice(index3+1);
			} else {
				match=pEnts[i].entity.slice(index);
			}
			pEnts[i].match=match;
		 }
		 async.mapSeries(pEnts, function(entity, callback2){ 
			//grab collation for this span of text
			//we have to figure out which are the collatable elements (answer: lowest level with n attributes), excluding all w elements
			//then match to the entities found in this page and use the matched name to retrieve the collation
			//that is: values will match up the tree...
			//add: attribute to each collateable element
			nVals=$("[n]");
			let found=false;
			for (let i=0; i<nVals.length; i++) { 
				//can't be line number and must have n ancestor and no n children..
				if (!$(nVals[i]).hasClass("lineN") && $(nVals[i]).parents("[n]").length>0 && $(nVals[i]).children("[n]").length==0) {
					let match="";
					//get the n attributes 
					let index=$(nVals[i]);
					while (typeof index.attr("n")!= "undefined") {
						if (match!="") match=index.attr("n")+"_"+match;
						else match=index.attr("n");
						index = $(index).parents("[n]");
					}
					//match attribute to pEnt!
					//then grab the collation for that line
					if (match==entity.match) {
						//go get collation for this one
						found=true;
						let entitySought=entity.entity.slice(entity.entity.indexOf(":")+1);
						$.get(TCurl+"/uri/urn:det:tc:usask:"+TCCommunity+"/"+entitySought+"?type=apparatus&format=approved", {entitySought: entitySought})
							.done (function(json) {
								var foo=1;
								//add to the line...
								$(nVals[i]).attr("data-tce", entitySought);
								popCollations.push({entity:entitySought, collation: JSON.parse(json)});
								return(callback2(null, []));
								//showPopUpCollation (lineNumber, taleName, parseInt(wordNumber), 0);
							})
							.fail (function( jqXHR, textStatus, errorThrown ) {
					//        console.log(jqXHR);
					//        console.log(textStatus);
							 console.log(errorThrown );
							 return(callback2(null, []));
						});
					}
				} 
			}
			if (!found) return(callback2(null, []));
		}, function (err) {
			return(callback(null));
		});
	 });
}

function doTextColumns(text) {
	//first, grab text before second column break and put it in the first column. Stuff in fw notes with places etc will be moved into the right column
	let firstCol="", secondCol="", thirdCol="", fourthCol="";
	let startCB=text.indexOf("<cb");
	let col1Pre=text.slice(0, startCB);
	startCB=text.indexOf(">", startCB+1);
	let startCB2=text.indexOf("<cb", startCB);
	firstCol=col1Pre+text.slice(startCB+1, startCB2)
	startCB2=text.indexOf(">", startCB2+1);
//might be text in third and fourth columns, in second zone of two column page.. do we have another cb?
	let startCB3=text.indexOf("<cb", startCB2+1);
	if (startCB3>0) {
		$("#t-b").show();
		secondCol=text.slice(startCB2+1, startCB3);
		startCB3=text.indexOf(">", startCB3+1);
		let startCB4=text.indexOf("<cb", startCB3);
		thirdCol=text.slice(startCB3+1, startCB4);
		startCB4=text.indexOf(">", startCB4+1);
		fourthCol=text.slice(startCB4+1);
	} else {
		$("#t-b").hide();
		secondCol=text.slice(startCB2+1);
	}
	$($("#t-c1-text")[0]).html(firstCol);
	$($("#t-c2-text")[0]).html(secondCol);
	if (thirdCol!="") {
		$($("#t-b")[0]).css("display","block");
		$($("#t-b-c1-text")[0]).html(thirdCol);
	}
	if (fourthCol!="") $($("#t-b-c2-text")[0]).html(fourthCol);
}

function checkDivs() { //coz it can get complicated if there is more than one column!
	if ($("#t-c2-text").html()!="") {
		let prevDivN = $("#t-c1-text div[n]").last().attr("n");
		$("#t-c2-text").attr("n", prevDivN);
	}
}

//gets called when choice made from menu bar



//need to redo when we hit two columns
function doMargins(column, isTwoColumns) {
// get fw and note elements. We have already removed all note type=ed elements.
	let fws=$("#t-c"+column+"-text").find("fw");
	for (let i=0; i<fws.length; i++) {
		let fwplace=$(fws[i]).attr("place");
		switch(fwplace) {
			case "tl":
				$(fws[i]).detach().appendTo("#transcript-tm-left"); break;
			case "tm":
				$(fws[i]).detach().appendTo("#transcript-tm-centre"); break;
			case "tr":
				$(fws[i]).detach().appendTo("#transcript-tm-right"); break;
			case "bl":
				$(fws[i]).detach().appendTo("#transcript-bm-left"); break;
			case "bm":
				$(fws[i]).detach().appendTo("#transcript-bm-centre"); break;
			case "br":
				$(fws[i]).detach().appendTo("#transcript-bm-right"); break;
			default:
				console.log("Place attribute '"+fwplace+"' missing or not recognized on fw element in ms "+currMS+", page "+currPage);
		}
	}
	let notes=$("#t-c"+column+"-text").find("note");
	///hm... might be we have to sort these notes so we only deal with right and left margin later...
	for (let i=0; i<notes.length; i++) {
		let noteplace=$(notes[i]).attr("place");
		let lineNum=$($(notes[i])).parent("l").attr("n");
		let book=$($(notes[i])).parents("div").attr("n")
		switch(noteplace) {
			case "margin-left":
				let top=notes[i].offsetTop;
				$(notes[i]).attr("n", "N"+column+"-"+book+lineNum);
				if (column==1) {
					$(notes[i]).detach().appendTo("#t-c1-left"); 
				} //complexb things happening .. right and left depend on how many columns
				let numtop=$("note[n='N"+column+"-"+book+lineNum+"']")[0].offsetTop;
				$($("note[n='N"+column+"-"+book+lineNum+"']")[0]).css({position:"relative", top:""+(top-numtop+3)+"px"});
				break;
			case "margin":
				$(notes[i]).detach().appendTo("#t-c1-left"); break;  //we deprecate use of this;  replace by margin left or right
			case "margin-right":
				let rtop=notes[i].offsetTop;
				if (column==1 && isTwoColumns) {
					$(notes[i]).attr("n", "RG"+column+"-"+book+lineNum);
					$(notes[i]).detach().appendTo("#t-c1c2-gutter"); 
					let rnumtop=$("note[n='RG"+column+"-"+book+lineNum+"']")[0].offsetTop;
					$($("note[n='RG"+column+"-"+book+lineNum+"']")[0]).css({position:"relative", top:""+(rtop-rnumtop+3)+"px"});
				} else {
					$(notes[i]).attr("n", "RN"+column+"-"+book+lineNum);
					$(notes[i]).detach().appendTo("#t-c2-right"); 
					let rnumtop=$("note[n='RN"+column+"-"+book+lineNum+"']")[0].offsetTop;
					$($("note[n='RN"+column+"-"+book+lineNum+"']")[0]).css({position:"relative", top:""+(rtop-rnumtop)+"px"});
				}
				break;
			case "2col-banner":  //this one is complex! see Wy e3v
		//		$(notes[i]).detach().appendTo("#t-b-banner-text"); 
				let banLine=$($(notes[i]).parent("l")[0]).attr("n");
				let divT=$("#t-c1-text div[n]").last().attr("n") //not yet set in checkDivs, that comes later, but this works
				let divN=$($(notes[i]).parents("div")[0]).attr("n");
				if (typeof(divN)=="undefined") {
					$("#t-b-banner-text").attr("n", divT);
					$("#t-b-banner-text").append('<l n="'+banLine+'">'+$(notes[i])[0].innerHTML+'</l>');
					$($(notes[i]).parents("l")[0]).remove();
				} else {
					$("#t-b-banner-text").append('<div n="'+divN+'"><l n="'+banLine+'">'+$(notes[i])[0].innerHTML+'</l></div');
					$($(notes[i]).parents("l")[0]).remove();  //!!! bad might remove t-c2-text or similar lol
					$("#t-b-c1-text").attr("n", divN);
					$("#t-b-c2-text").attr("n", divN);  //might be some cases where this is not true, but hey
				}
				break;
			case "tl":
				$(notes[i]).detach().appendTo("#transcript-tm-left"); break;
			case "tm":
				$(notes[i]).detach().appendTo("#transcript-tm-centre"); break;
			case "tr":
				$(notes[i]).detach().appendTo("#transcript-tm-right"); break;
			case "margin-bl":
			case "bl":
				$(notes[i]).detach().appendTo("#transcript-bm-left"); break;
			case "bm":
				$(notes[i]).detach().appendTo("#transcript-bm-centre"); break;
			case "br":
				$(notes[i]).detach().appendTo("#transcript-bm-right"); break;
			default:
				console.log("Place attribute '"+noteplace+"' missing or not recognized on note element in ms "+currMS+", page "+currPage);
		}
	}
}

function emptyMargins() { //reset widths too; and also 
	$("#transcript-tm-left").empty();
	$("#transcript-tm-centre").empty();
	$("#transcript-tm-right").empty();
	$("#transcript-bm-left").empty();
	$("#transcript-bm-centre").empty();
	$("#transcript-bm-right").empty();
	$("#t-c1-left").empty();
	$("#t-c1-left").width("300px");
	$("#t-c1-linenumbers").empty();
	$("#t-c2-linenumbers").empty();
	$("#t-c1c2-gutter").empty();
	$("#t-c1c2-gutter").width("100px");
	$("#t-c2-right").empty();
	$("#t-c2-right").width("300px");
	$("#t-b-banner-text").empty();
	$("#t-b-c1-linenumbers").empty();
	$("#t-b-c1-text").empty();
	$("#t-b-c1c2-gutter").empty();
	$("#t-b-c2-linenumbers").empty();
	$("#t-b-c2-text").empty();

}

function adjustText(xml) {  //sets up popups within text
	let text=xml.replace("<text>","").replace("</text>","").replace("<body>","").replace("</body>","").replaceAll("<lb/><lb/>","<br>").replaceAll("<lb/>","<br>").replaceAll("<head n=\"Title\">","<l type=\"Title\" n=\"Title\">").replaceAll("</head>","</l>");
	//remove the <pb.. 
	text=text.slice(0, text.indexOf("<pb"))+text.slice(text.indexOf(">",text.indexOf("<pb"))+1);
	//first, are there any notes in here???
	//ok, need to deal with both kinds of notes...
	text=popNotes(text, "ed");
	text=popNotes(text, "tr");
	let isNote=text.indexOf("<note");
	let noteNumber=1;
	while (isNote>-1) { //look at every note element...
		let endSpec=text.indexOf(">", isNote);
		let noteSpec=text.slice(isNote, endSpec);
		let endNote=text.indexOf("</note>", endSpec);
		if (noteSpec.indexOf("type=\"ed\"")>-1 || noteSpec.indexOf("type=\"tr\"")>-1) {
			let startXML=text.slice(0, isNote);
			let textNote=text.slice(endSpec+1, endNote);
			text=startXML+" <span class=\"showTip note"+noteNumber+" noteFlag\"><img src=\"http://www.inklesseditions.com/TCR/common/images/noteIcon.png\" height=\"12px\"></span> "+text.slice(endNote+7);
			$("#popUps").append("<div id=\"note"+noteNumber+"\">"+textNote+"</div>");
			noteNumber++; 
		}
		isNote=text.indexOf("<note", endNote);
	}
	return(text);
}

function popNotes (text, type) {
	let isNote=text.indexOf("type=\""+type+"\"");
	let noteNumber=1;
	while (isNote>-1) { //look at every note element...
		let endSpec=text.indexOf(">", isNote);
		let endNote=text.indexOf("</note>", endSpec);
		let startXML=text.slice(0, text.lastIndexOf("<note", isNote));
		let textNote=text.slice(endSpec+1, endNote);
		text=startXML+" <span class=\"showTip note"+type+noteNumber+" noteFlag\"><img src=\"http://www.inklesseditions.com/TCR/common/images/noteIcon.png\" height=\"12px\"></span> "+text.slice(endNote+7);
		$("#popUps").append("<div id=\"note"+type+noteNumber+"\">"+textNote+"</div>");
		noteNumber++; 
		isNote=text.indexOf("type=\""+type+"\"");
	}
	return(text);
}

function doLineNumbers(column, cb) {   //defer finding commentary; just put up instances where line number is divisible by three...
	let lines=$("#t-c"+column+"-text").find("l");
	//construct match for element up to top level div
	for (i=0; i<lines.length; i++) {
		let match="";
		//get the n attributes 
		let index=$(lines[i]);
		let top=lines[i].offsetTop;
		let LineN=index.attr("n");
		while (typeof index.attr("n")!= "undefined") {
			if (match!="") match=index.attr("n")+"_"+match;
			else match=index.attr("n");
			index = index.parents("[n]");
		}
		$("#t-c"+column+"-linenumbers").append("<div class='lineN' data-tce='"+match+"' n='"+match+"-"+column+"'></div>");
		let numtop=$("div[n='"+match+"-"+column+"']")[0].offsetTop;
		$($("div[n='"+match+"-"+column+"']")[0]).css({position:"relative", top:""+(top-numtop+3)+"px"});
		if (!isNaN(LineN) && (parseInt(LineN) % 5==0)) { 
			$($("div[n='"+match+"-"+column+"']")[0]).html(LineN);
		} else {
			$($("div[n='"+match+"-"+column+"']")[0]).html("&nbsp;");
		}
	}
}
		



function doExtraLineNumbers(column) {
	let lines=$("#t-b-c"+column+"-text").find("l");
	for (let i=0;i<lines.length;i++) {
		let lineNum=$(lines[i]).attr("n");
		if (!isNaN(lineNum) && (parseInt(lineNum) % 5==0)) {
			let top=lines[i].offsetTop;
			let book=$($(lines[i]).parent("div")[0]).attr("n");
			$("#t-b-c"+column+"-linenumbers").append("<div class='lineN' n='"+book+lineNum+"'>"+lineNum+"</div>");
			let numtop=$("div[n='"+book+lineNum+"']")[0].offsetTop;
			$($("div[n='"+book+lineNum+"']")[0]).css({position:"relative", top:""+(top-numtop+3)+"px"});
		}
	}
	$($("#t-b-c"+column+"-linenumbers")[0]).css("width", "25px");
}



function adjustMarginSizes(){
	doMarginSize("#t-c1-left");
	doMarginSize("#transcript-tm-left"); 
	doMarginSize("#t-c1-text");
	doMarginSize("#t-c1c2-gutter");
	doMarginSize("#t-c2-text");
	doMarginSize("#t-c2-right"); 
	doMarginSize("#t-b-c1-text"); 
	doMarginSize("#t-b-c1c2-gutter"); 
	doMarginSize("#t-b-c2-text"); 
//if we have extra columns, as in Wy e3v:
	if ($("#t-b").is(":visible")) {
		let c1Width=$("#t-c1-text").width();
		let c2Width=$("#t-c2-text").width();
		let c3Width=$("#t-b-c1-text").width();
		let c4Width=$("#t-b-c2-text").width();
		if (c1Width>=c3Width) {
			$("#t-b-c1-text").width(c1Width+"px");
		} else {
			$("#t-c1-text").width(c3Width+"px")
		}
		if (c2Width>=c4Width) {
			$("#t-b-c2-text").width(c2Width+"px");
		} else {
			$("#t-c2-text").width(c4Width+"px")
		}
	}
}

function doMarginSize (id) {
	let fontSize=$(id).css("font-size");
	width=getTextSize($(id)[0].innerHTML, fontSize);
	$(id).css("width", (width+2) + "px");
}
function doUnderDots (){
	var uds=$('seg[rend="ud"]');
	for (let i=0; i<uds.length; i++) {
		let udDot="";
		let udText=uds[i].innerText;
		for (let j=0; j<udText.length; j++) {
			udDot+='<span class="ud">'+udText[j]+'</span>';
//			udDot+=udText[j]+'̣';  //unicode underdot
		}
//		$(uds[i]).replaceWith(udDot);
		$(uds[i]).html(udDot);
	}
}

//have to treat divs as inline blocks here..
function getTextSize(html, fontSize){
	var text = document.createElement("span");
    document.body.appendChild(text);
	text.style.font = "junicoderegular";
	text.style.fontSize = fontSize;
	text.style.height = 'auto';
	text.style.width = 'auto';
	text.style.position = 'absolute';
	text.style.whiteSpace = 'no-wrap';
	text.innerHTML = html;
	$($(text)[0]).find("div").css("display", "inline");   //could be divs in there which will screw things up lol
//if there are orncps here .. make it wider lol
//need to make this an increment we add to the overall width...
	let incr=0;
	if (getLetterWidth(text, "orncp8")>incr) incr=getLetterWidth(text, "orncp8");
	if (getLetterWidth(text, "orncp7")>incr) incr=getLetterWidth(text, "orncp7");
	if (getLetterWidth(text, "orncp6")>incr) incr=getLetterWidth(text, "orncp6");
	if (getLetterWidth(text, "orncp5")>incr) incr=getLetterWidth(text, "orncp5");
	if (getLetterWidth(text, "orncp4")>incr) incr=getLetterWidth(text, "orncp4");
	if (getLetterWidth(text, "orncp3")>incr) incr=getLetterWidth(text, "orncp3");
	if (getLetterWidth(text, "orncp2")>incr) incr=getLetterWidth(text, "orncp2");
	if (getLetterWidth(text, "unexcp2")>incr) incr=getLetterWidth(text, "unexcp2");
	if (getLetterWidth(text, "unexcp3")>incr) incr=getLetterWidth(text, "unexcp3");
	if (getLetterWidth(text, "unexcp4")>incr) incr=getLetterWidth(text, "unexcp4");
	$($(text)[0]).find("note").css('display','block');
	let width = Math.ceil(text.clientWidth)+incr+2;  //for some reason, need to add the extra pixel
	document.body.removeChild(text);
	return(width);
}

function getLetterWidth (myText, rend) {
	if ($($(myText)[0]).find("hi[rend="+rend+"]").length>0) {
		return Math.ceil($($(myText)[0]).find("hi[rend="+rend+"]").outerWidth(true));
	} else {
		return 0;
	}
}

function getImageInf() {
	if (currMS=="Base") return;
	$('#OAstatement').css("height", "auto");
	var imageInfo=" Image of folio "+currPage+" in "+witnesses[currMS].id +" "+ witnesses[currMS].permission;
	$('#imageInf').append(imageInfo);
}


function doWords() {
	let lines=$("l");
	for (let i=0; i<lines.length; i++) {
	 	if ($(lines[i]).children().length==0) {
	 		let myline=$(lines[i]).html().split(" ");
	 		let newArray=[];
	 		for (let j=0; j<myline.length; j++) {
	 			if (punctuation.includes(myline[j])) {
	 				if (j==0) {
	 					newArray.push(myline[j]+" "+myline[1]);
	 					j++;
	 				} else {
	 					newArray[newArray.length-1]=newArray[newArray.length-1]+" "+myline[j];
	 				}
	 			} else {
	 				newArray.push(myline[j]);
	 			}
	 		}
	 		let newLine="";
	 		for (let j=0; j<newArray.length; j++) {
	 			newLine+='<w n="'+((j+1)*2)+'">'+newArray[j]+'</w>';
	 			if (j<newArray.length-1) newLine+=" ";
	 		}
	 		$(lines[i]).html(newLine);
	 	} else { //we have embedded xml .. so cut it into elements
	 		//xml could be embedded in a word too lol. If 
	 		let newArray=[];
	 		let newline=$(lines[i]).html();
	 		let startEl=newline.indexOf("<");
	 		let openElements=[]; //pop and pull elements off and on as they open and close
	 		let startPos=0;
	 		if (startEl>-1) {
	 			let startStr=newline.slice(startPos, startEl);
	 			if (startStr!="") splitWords(newArray, startStr, openElements);
	 			newline=newline.slice(startEl);
	 			handleXML(newArray, newline, lines[i], openElements);
	 		}
	 		constructWElements(newArray, lines[i]);
	 	}
	}
}

function splitWords(newWords, myStr, openElements) {  //newWord true if < at the beginning of a word, false if it is not
	let mywords=myStr.split(" ");
	if (mywords[0]=="") {
		mywords.shift();
		if (newWords.length>0) newWords[newWords.length-1].finished=true;
	}
	for (let j=0; j<mywords.length; j++) {
		newWords.push({word: mywords[j], start:JSON.parse(JSON.stringify(openElements)), finished:true});
	}
	if (newWords.length>0 && newWords[newWords.length-1].word=="") {
		newWords.pop();
	} else if (myStr.charAt(myStr.length-1)!=" ") {
		newWords[newWords.length-1].finished=false; //marker to concatenate...
	}
}

function handleXML(newArray, myline, line, openElements) {
	//could be start or end element...
	//get startEl... could be several, one after another lol
	let endEl=myline.indexOf(">");
	let element="";
	let closeEl="";
	let fullElement="";
	let startingEl=true;
	//if this an empty element, just <br>, add <br> to words array, but we don't increment word number
	//by definition ... we should not have any empty elements except <br> here
	let elString=myline.slice(1, endEl);
	if (elString[0]=="/") {
		elString=elString.slice(1);
		startingEl=false;
		closeEl=elString;
	}
	myline=myline.slice(endEl+1);
	if (elString.indexOf(" ")>-1) {
		element=elString.slice(0, elString.indexOf(" "));
		fullElement=elString;
		
	} else {
		element=fullElement=elString;
	}
	if (element=="br") {
		newArray.push({word: "<br>", start: JSON.parse(JSON.stringify(openElements)), end:[], finished:false});
		//more elements... or not ...
		if (myline.indexOf("<")>-1) {
			//deal with words before ...
			let startEl=myline.indexOf("<");
			let startStr=myline.slice(0, startEl);
	 		if (startStr!="") splitWords(newArray, startStr, openElements);
	 		myline=myline.slice(startEl);
			handleXML(newArray, myline, line, openElements);
			return;
		} else {
			splitWords(newArray, myline, openElements);
			return;
		}
	} else {  //track to the end of the element if it is in this word...
		let testWord="";
		if (startingEl) { 
			if (fullElement.indexOf('span class="showTip ')>-1) {
				let endSpan=myline.indexOf("</span>");
				let span=myline.slice(0, endSpan+7);
				myline=myline.slice(endSpan+7);
				if (myline[0]==" ") myline=myline.slice(1);
				newArray.push({word: "<"+fullElement+">"+span, start: JSON.parse(JSON.stringify(openElements)), end: closeEl, finished:true});
			} else {
				openElements.push({gi:element, element:fullElement, written: false});
			}
			//more xml coming..?
			let startEl=myline.indexOf("<");
			if (startEl>-1) {
				let startStr=myline.slice(0, startEl);
				if (startStr!="") splitWords(newArray, startStr, openElements);
				myline=myline.slice(startEl);
				handleXML(newArray, myline, line, openElements);
				return;
			} else {
				splitWords(newArray, myline, openElements);
				return;
			}
		} else { //closing element...could correspond to end of word or not
			if (closeEl==openElements[openElements.length-1].gi) {
				openElements.pop();
				newArray.push({word: testWord, start: JSON.parse(JSON.stringify(openElements)), end: closeEl, finished:false});
				//if this is the end of a word..space following ...
				if (myline[0]==" ") {
					newArray[newArray.length-1].finished=true;
					myline=myline.slice(1);
				}
			} else { //error!
				console.log("closing element "+closeEl+" found; last open is "+openElements[openElements.length-1].gi)		
			};
		//case one. this element ends in this word
			for (let k=0; k<myline.length; k++) {
				if (myline[k]!="<" && myline[k]!=" ") {
					testWord+=myline[k];
				} else if (myline[k]=="<") {
					if (testWord!="") newArray.push({word:testWord, start: JSON.parse(JSON.stringify(openElements)), finished: false});
					myline=myline.slice(k)
					handleXML(newArray, myline, line, openElements); //just keep recursing
					return;
				} else if (myline[k]==" ") {
					//we have reached the end of a word!
					if (testWord!="") {
						newArray.push({word:testWord, start: JSON.parse(JSON.stringify(openElements)), finished: true});
						myline=myline.slice(k);
						k=0;
						testWord="";
					}
				}
			}
	  	}
		if (testWord!="") newArray.push({word:testWord, start: JSON.parse(JSON.stringify(openElements)), finished: true});
	}
}

function constructWElements(newArray, line) {
	let newStr="";
	let newWord="";
	let counter=0;
	newArray[newArray.length-1].finished=true;
	for (let i=0; i<newArray.length; i++) {
		if (newArray[i].finished) {	
			if (newArray[i].word=="<br>") {
				newStr+="<br/>"
			} else if (newArray[i].word.indexOf('span class="showTip ')>-1) {
				newStr+=newArray[i].word;
			} else {
				for (let j=0; j<newArray[i].start.length; j++) {
					newWord+="<"+newArray[i].start[j].element+">"
				}
				newWord+=newArray[i].word;
				if  (typeof newArray[i].end!="undefined") newWord+="</"+newArray[i].end+">";
				for (let j=newArray[i].start.length-1; j>-1; j--) {
					newWord+="</"+newArray[i].start[j].gi+">"
				}
				newStr+='<w n="'+((counter+1)*2)+'">'+newWord+'</w>';
				newWord="";
				counter++;
				if (i<newArray.length-1) {
					for (let j=0; j<newArray[i].start.length; j++) {
						if (typeof newArray[i+1].start[j]!="undefined" && newArray[i].start[j].element==newArray[i+1].start[j].element) {
							newStr+="<"+newArray[i].start[j].element+">";
						}
					}
					newStr+=" ";
					for (let j=newArray[i].start.length-1; j>=0; j--) {
						if (typeof newArray[i+1].start[j]!="undefined" && newArray[i].start[j].gi==newArray[i+1].start[j].gi) {
							newStr+="</"+newArray[i].start[j].gi+">";
						}
					}
				}
			}
		} else { //add unfinished to next array word...note that by definition ??? next word should have same openElements as this one??
			for (let j=0; j<newArray[i].start.length; j++) {
				if (typeof newArray[i].end=="undefined") newWord+="<"+newArray[i].start[j].element+">"
			}
			if (newArray[i].word!="") newWord+=newArray[i].word;
			if (typeof newArray[i].end!="undefined") newWord+="</"+newArray[i].end+">";
		}
	}
	$(line).html(newStr);
}

function formatDate(rawdate) {
    var date = new Date(rawdate);
    var options = {
    year: "numeric", month: "short",
    day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false
    };
    return date.toLocaleTimeString("en-us", options);
}