//generic javascript for handling all transcripts

const punctuation=".,:-/&@¶§;·⸫▽?!'"+'"';
const suffixes=["","-mod","-orig"]; //used to handle alternative app readings
var hasMultiColumns=false;
var isPopUpOrigSpelling=false;
var isShowPopUps=true;

function initTranscript () {
	if (!isstandalone) {
		let banner=universalBanner;
	    banner=banner.replaceAll("xxxx", "<").replaceAll("yyyy", ">").replaceAll("zzzz", "&nbsp;");
	    $("#page-head").html(banner);
		createTranscript();
	} else {
		if (!ssSearch) {
			$("#staticSearch").remove();
		}
		if (!hasVBase) {
			$("#VBase").remove();
			$("#VBaseLink").remove();
		}
		createTranscript();
	}
}


function showPopUps () {
	if ($("#showPops").is(":checked")) {//turn on showTip
		$(".showTip").removeClass("dummy");
		$("w.showTip").hover(showCollation, hideCollation);
		$(".commRef").hover(initComm);
		$(".msInf").hover(initComm);
		isShowPopUps=true;
	} else { //turn it off
		$(".showTip").addClass(function () {
			let existingClasses=$(this).attr("class");
			existingClasses="dummy "+existingClasses;
			$(this).attr("class", existingClasses);
			$("w.showTip").unbind('mouseenter mouseleave');;
			$(".commRef").unbind('mouseenter mouseleave');;
			$(".msInf").unbind('mouseenter mouseleave');;
			isShowPopUps=false;
		});
	}
}


function getImageCall(callback) {
	$.get(TCimages+"/uri/urn:det:tc:usask:"+imagesCommunity+"/document="+currMS+":folio="+currPage+"?type=IIIF&format=url", function(url) {
		if (url.length) {
		  	var conscript='\r<script type="text/javascript">\r\tconst iiifURL="'+url[0].url+'";</script>';
			$( "head" ).append(conscript);
		} else {
			console.log="No image found for "+currMS+" "+currPage;
			$( "head" ).append('\r<script type="text/javascript">\r\tconst iiifURL=null; </script>');
		}
		callback(null,[]);
	});
}


function createTranscript() { //currEntities read from starting script, allEntities from entities.js
	$("#entityMenu").html(initializeEntityChoice(currEntity));
	$("#MS").val(currMS);
	$("#title").html(currMS+" "+currPage);
	initializeSplitView();
	getImageInf();
	setupPageLinks();
	async.waterfall([
		function(callback) {
			getImageCall(callback);
		 }, 
		 function(arguments, callback) {
			makeTranscriptInf(callback);
		 },
		function(arguments, callback) { 
			openTranscript(callback);
		 },   
		 function(arguments, callback) { 
			doLineNumbers(1, callback);
		 }, 
		  function(arguments, callback) { 
			doLineNumbers(2, callback);
		 },
		 function(arguments, callback) { 
			if ($("#t-b").is(":visible")) {
				doExtraLineNumbers(1);
				doExtraLineNumbers(2);
			}
			$(".commRef").hover(initComm);
			$(".msInf").hover(initComm);
			callback(null, []);
		},   
		 function(arguments, callback) { 
			createPopUpCollationME(callback);
		 }

	], function (err) {
		//get here when we are ready to write to the database
		callbackTranscript();
	})
}

function callbackTranscript () {
 	//only here if all tasks complete. Prepare for ulitmate display
 	$(".driverScript").remove();
	$("#rTable").height("90%");
	$("#panel-right").height("100%");
	$("#panel-right").width("50%");
 	$(".gutter").remove();
 	var s = new XMLSerializer();
	var d = document;
	var str = s.serializeToString(d);
	window.parent.postMessage(str, "*");
 }


function highLightWords() {
	let thisID=$("#tipDiv").find(".popAppFrame").attr("data-id");
	$("."+thisID).addClass("collLemmaText");
}

function movePopUpCollation (thisID, type) {
	//type is: prevLine, nextLine, prevWord, nextWord
	hideCollation();
	if (type=="prevWord") { //get the first word with this class
		//could be after omission at the beginning of the verse and so no previous word...
		let prevWord=$($("w."+thisID)[0]).prev("w");
		let prevId="";
		if (prevWord.length) {
			 prevId=$(prevWord).attr("class").split(" ")[1];
		} else {
			let prevNum=parseInt(thisID.slice(thisID.lastIndexOf("_")+1))-1;
			prevId=thisID.slice(0, thisID.lastIndexOf("_")+1)+prevNum;
		}
		setUpDrag(thisID);
		$("#tipDiv").html($($("#"+prevId)[0]).html());
		$("."+prevId).addClass("collLemmaText");
		selectPUsp($("#tipDiv").find(".puCB")[0])
//		adjustPopUpPosition(prevId, null);
	} else if (type=="nextWord") { //get the last word with this class
		let thisWord=$("w."+thisID)[$("w."+thisID).length-1];
		let nextId="";  //possible there is no first word with the id of the first variant, because it is an omission
		if (!thisWord) {  //we assume only one omission...that omission is followed by a variant on a word
			let nextNum=parseInt(thisID.slice(thisID.lastIndexOf("_")+1))+1;
			nextId=thisID.slice(0, thisID.lastIndexOf("_")+1)+nextNum;
			thisWord=$("w."+nextId)[$("w."+nextId).length-1]
		} else {
			 nextId=$(thisWord).next("w").attr("class").split(" ")[1];
		}
		setUpDrag(nextId);
		$("#tipDiv").html($($("#"+nextId)[0]).html());
		$("."+nextId).addClass("collLemmaText");
		selectPUsp($("#tipDiv").find(".puCB")[0])
//		adjustPopUpPosition(nextId, null);
	} else if (type=="prevLine" || type=="nextLine") { //get the next line with this class
		setUpDrag(thisID);
		$("#tipDiv").html($($("#"+thisID)[0]).html());
		$("."+thisID).addClass("collLemmaText");
		selectPUsp($("#tipDiv").find(".puCB")[0])
//		adjustPopUpPosition(thisID, null);
	} 
}


function showPUCollLink(element){
	$(element).find(".showCollLink").hide();
	$(element).find(".chooseColl").show()
}

function hidePUCollLink(element){
	$(element).find(".showCollLink").show();
	$(element).find(".chooseColl").hide()

}


function adjustPopUpPosition (thisID, event) { //gets called when we are moving within the popUp window; tipDiv already exists
//wait for it to be visible...
	setTimeout(() => {
 		let popHeight=$("#tipDiv").height();
		let allHeight=$("#whole").height();
		let topPop=$("#tipDiv").offset().top;
		let wordLeft=$("w."+thisID).offset().left;
		let popLeft=$("#tipDiv").offset().left;
		let popWidth=$("#tipDiv").width();
		let lineTop=$("w."+thisID).parents("l").offset().top;
		let lineBottom=lineTop+$("w."+thisID).height();
//case one ... space for tipDiv box below the line. Put it there brother
		if (lineBottom+popHeight<allHeight) {
			$("#tipDiv").css({top:(lineBottom-3)+"px"})
		} else if (topPop<lineBottom) { //tipdiv above the line
			$("#tipDiv").css({top:(lineTop-popHeight-8)+"px"})
		}
//nudge tipdiv to right if we have to
		if (popLeft+popWidth<wordLeft+20) {
			$("#tipDiv").css({left:(popLeft+30)+"px"})
		}
	}, "50");
}

function showCollation (event) {
	//the event could actually be on an embedded element within the word
	let idColl=$(event.currentTarget).attr("class").split(" ")[1];
	setUpDrag(idColl);
	 $("."+idColl).addClass("collLemmaText");
	 adjustPopUpPosition(idColl, event);
	 setTimeout(() => {selectPUsp($("#tipDiv").find(".puCB")[0])});
}





function openImage () {
	$.get(TCimages+"/uri/urn:det:tc:usask:"+TCcommunity+"/document="+currMS+":folio="+currPage+"?type=IIIF&format=url", function(url) {
		$.get(url[0].url, function(source) {
			if (viewer) viewer.open([source]);
		});
	});
}

function openTranscript(callback) {
	$("#t-c1-text").empty();
	$("#t-c1-text").width("600px");
	$("#t-c2-text").empty();
	$("#t-c2-text").width("600px");
	$("#transcriptFrame").show();
	$("#collationFrame").hide();
	$("#searchVBase").hide();
//	if ($("#transcriptInf").is(":visible")) getTranscriptInf();
//	if ($("#imageInf").is(":visible")) getImageInf();	
	resizeRTable();
	$.get( TCurl+"/uri/urn:det:tc:usask:"+TCcommunity+"/document="+currMS+":folio="+currPage+"?type=transcript&format=xml", function(xml) {
		let text=adjustText(xml, true);  //get rid of superfluous encoding, changle lbs, deal with embedded ed notes
		// do we have columns???
		emptyMargins();
		if (text.indexOf("<cb")>-1) {
			hasMultiColumns=true;
			doTextColumns(text);
			doMargins(1, true);
			doMargins(2);
			adjustMarginSizes();
			$($("#t-c2-linenumbers")[0]).css("width", "25px");
		} else {
			$("#t-c1-text").html("<div>"+text+"</div>");
			hasMultiColumns=false;
			doMargins(1,false);
			adjustMarginSizes();
		}
		if (typeof $("am")[0]!="undefined") {$("#selectAbbrev").show(); $("ex").hide();} else {$("#selectAbbrev").hide()}
		if (typeof $("app")[0]!="undefined")  {$("#selectApp").show()} else { $("#selectApp").hide()}
		$("rdg[type=orig]").hide();
		$("rdg[type=mod]").hide();
		$("rdg[type=lit]").show();
		$("#selectApp option[value='lit']").prop("selected", true);
		doUnderDots();
		doWords();
		checkDivs();
/*		let words=$("#transcript-text w");
		for (let a=0; a<words.length; a++) {
			$(words[a]).addClass("showTip WordColl");
			$(words[a]).hover(setUpCollation, hideCollation);
		} */
		callback(null, []);
	});
}


function filePath(entity) { //returns the file path for this entity. Adjust for encoding over the web??
	let directory=entity.slice(entity.indexOf("=")+1, entity.lastIndexOf(":"))+"/"+entity.slice(entity.lastIndexOf(":")+1);
	return(directory);
}

function initComm () {
	$("#tipDiv").attr("onmousedown", "");
	 $("#tipDiv").attr("onmouseup", "");
	 $("#tipDiv").css('cursor', 'text');
}

function choosePUsp(element) {
	isPopUpOrigSpelling=element.checked;
	selectPUsp(element);
}

function selectPUsp(element) {
	element.checked=isPopUpOrigSpelling;
	if (isPopUpOrigSpelling)  {
		$(element).parents(".popAppFrame").find(".popAppWordCont-reg").hide();
		$(element).parents(".popAppFrame").find(".popAppWordCont-orig").show();
	} else {
		$(element).parents(".popAppFrame").find(".popAppWordCont-reg").show();
		$(element).parents(".popAppFrame").find(".popAppWordCont-orig").hide();
	}
}


//we now just loop through the apps

function hideCollation() {
//	$("w").removeClass("collLemma");
	$("w").removeClass("collLemmaText");
//	$("rdg").removeClass("collLemma");
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


function setupPageLinks(){
	//get the page in current book...
	let thisMS=pageEntitiesMin.filter(witness => witness.witness==currMS)[0];
	let thisPage=thisMS.pages.filter(page=>page.page==currPage)[0];
	let rubric=makeRubric(thisPage);
	$("#pageInf").html(rubric);
	$("#prevPageLink").empty();
	$("#nextPageLink").empty();
	$("#XMLLink").attr("href","../../../xml/transcripts/"+currMS+"/"+currPage+".xml");
	//get previous page..
	if (prevPage!="") {
		$("#prevPageLink").html("<span id='prevLink'><a href='"+prevPage+".html'><img src='/app/data/makeEdition/common/core/images/iconPrev.png' height='24'>&nbsp;"+prevPage+"</a></span>")
	} 
	if (nextPage!="") {
		$("#nextPageLink").html("<span id='nextLink'><a href='"+nextPage+".html'>"+nextPage+"&nbsp;<img src='/app/data/makeEdition/common/core/images/iconNext.png' height='24'></a></span>")
	}

}


function makeRubric(thisPage) {
	//if there is docinf... use it! If not, get from TEI header
	let docInf=witnessInf[currMS].id
	let myInf='<span class="showTip '+currMS+' msInf">'+currMS+'</span>';
	$("#popUps").append("<div id=\""+currMS+"\">"+docInf+"</div>");
	let rubric=myInf+" "+currPage+". ";
	let lastEnt="", thisEntity="";
	rubric+=makeEntitySpan(thisPage);
	return(rubric);
}



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
		let noteplace="";
		if (typeof $(notes[i]).attr("place") != "undefined") {
			noteplace=$(notes[i]).attr("place");
		}
		let lineNum=$($(notes[i])).parent("l").attr("n");
		//we need to put an id on the note so it can be found in the line; pick up when we make transcript and compare views
		let book=$($(notes[i])).parents("div").attr("n");
		let noteId=book+"-"+lineNum;
		$(notes[i]).attr("data-lref", noteId);
		//here are going to 
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
				let muyString="Place attribute '"+noteplace+"' missing or not recognized on note element in ms "+currMS+", page "+currPage;
				alert(muyString); break;  //for some reason console.log breaks here. Why..???? hmm. 
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
			text=startXML+" <span class=\"showTip note"+noteNumber+" noteFlag\"><img src=\"/app/data/makeEdition/common/core/images/noteIcon.png\" height=\"12px\"></span> "+text.slice(endNote+7);
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
		text=startXML+" <span class=\"showTip note"+type+noteNumber+" noteFlag\"><img src=\"/app/data/makeEdition/common/core/images/noteIcon.png\" height=\"12px\"></span> "+text.slice(endNote+7);
		$("#popUps").append("<div id=\"note"+type+noteNumber+"\">"+textNote+"</div>");
		noteNumber++; 
		isNote=text.indexOf("type=\""+type+"\"");
	}
	return(text);
}

function doLineNumbers(column, cbmain) {
	if (column==2 && !hasMultiColumns) {
		cbmain(null, []);
	} else {
		let lines=$("#t-c"+column+"-text").find("l");  //this has to be redone to handle prose and generic structures
		async.mapSeries(lines, function(line, callback){ 
			let LineN=$(line).attr("n");
			let top=line.offsetTop;
			let DivN=$($(line).parents("div[type=G]")[0]).attr("n"); //we should not use div types here. And we should be prepared to go up as many n attribute content elements as we need
			if (typeof DivN=="undefined") {
				DivN=$($(line).parent("div")[0]).attr("n");
			}
			$("#t-c"+column+"-linenumbers").append("<div class='lineN' n='"+DivN+"-"+LineN+"'></div>");
			let numtop=$("div[n='"+DivN+"-"+LineN+"']")[0].offsetTop;
			$($("div[n='"+DivN+"-"+LineN+"']")[0]).css({position:"relative", top:""+(top-numtop+3)+"px"});
			let searchUrl="https://textualcommunities.org/api/getCommentaries?entity="+TCcommunity+"/entity="+DivN+":line="+LineN+"&entityTo=";
			 $.post(searchUrl, function(res) {
				if (res.success) {
					let commentary=selectCommentary(res.commentaries);
					if (!isNaN(LineN) && (parseInt(LineN) % 5==0)) {
						$($("div[n='"+DivN+"-"+LineN+"']")[0]).html(LineN+" <span class='showTip Comm-"+DivN+"-"+LineN+" commRef'>C</span>");
						$("#popUps").append("<div id=\"Comm-"+DivN+"-"+LineN+"\">"+commentary+"</div>");
						callback(null,[]);
					} else {
						$($("div[n='"+DivN+"-"+LineN+"']")[0]).html("<span class='showTip Comm-"+DivN+"-"+LineN+" commRef'>C</span>");
						$("#popUps").append("<div id=\"Comm-"+DivN+"-"+LineN+"\">"+commentary+"</div>");
						callback(null,[]);
					}
				} else {
					if (!isNaN(LineN) && (parseInt(LineN) % 5==0)) {
						$($("div[n='"+DivN+"-"+LineN+"']")[0]).html(LineN);
						callback(null,[]);
					} else {
						callback(null,[]);
					}
				}
			 });	
		}, function (err) {
			cbmain(null, []);
		});
	}
}

function selectCommentary(commentaries) {
	commentaries=commentaries.reverse();
	for (let i=0; i<commentaries.length; i++) {
		if (commentaries[i].status=="APPROVED") {
			return(commentaries[i].text+" ("+commentaries[i].user+", "+formatDate(commentaries[i].date)+")");			
		}
	}
	return (commentaries[0].text+" ("+commentaries[0].user+", "+formatDate(commentaries[0].date)+") NO APPROVED COMMENTARY");
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
	$('#OAstatement').css("height", "auto");
	var imageInfo="<a href='javascript:$(\"#imageInf\").hide();resizeRTable()'><img src='/app/data/makeEdition/common/core/images/close.png'></img></a> Image of folio "+currPage+" in "+witnessInf[currMS].id +" "+ witnessInf[currMS].permission;
	$('#imageInf').html(imageInfo);
//	$('#imageInf').show();
	resizeRTable();
}

function makeTranscriptInf (callback){
	$('#OAstatement').css("height", "auto");
//does Base exist? if not, use currMS
	let baseMS="Base";
	let baseFolio=1;
	if (pageEntitiesMin.filter(witness=>witness.witness=="Base").length==0) {
		baseMS=currMS;
		baseFolio=currPage;
	}
	$.get(TCurl+"/uri/urn:det:tc:usask:"+TCcommunity+"/document="+baseMS+":folio="+baseFolio+"?type=transcriptInf", function(baseInf) {
		//may contain all the information we need...
		var transcriptInfo="<a href='javascript:$(\"#transcriptInf\").hide();resizeRTable()'><img src='/app/data/makeEdition/common/core/images/close.png'></img></a> Transcript of folio "+currPage+" in "+witnessInf[currMS].id+". ";
		let node = document.createElement("div");
		$(node).html(baseInf.teiHeader);
		//$('#XMLBase').html(baseInf.teiHeader);
		
		var genMSInf="";
		if ($(node).find('respStmt[n="General"]').lengtht>0) {
			 genMSInf=$(node).find('respStmt[n="General"]')[0].innerTexr;
		}
		//now get this from the loaded page entity min file: just find the page and read the top level entities on that page
		$.get(TCurl+"/uri/urn:det:tc:usask:"+TCcommunity+"/document="+currMS+":folio="+currPage+"?type=transcriptInf", function(transcriptInf) {
	//		$('#XMLP').html(transcriptInf.teiHeader);
			let node2 = document.createElement("div");
			$(node2).html(transcriptInf.teiHeader);
			//is there a header specific to this ms?
			var specMSInf=$(node2).find('respStmt[n="whole"]')[0]
			if (specMSInf) transcriptInfo+=specMSInf.innerText;
			else transcriptInfo+=genMSInf;
			//get the entities on this page
			//but we know that now! so we don't need to find
			let myMs=pageEntitiesMin.filter(witness=>witness.witness==currMS)[0];
			let myEntities=myMs.pages.filter(page=>page.page==currPage)[0].entities;
			let ents=[];
			for (let i=0; i<myEntities.length; i++) {
				if (!ents.includes(myEntities[i].entity.split(":")[1].split("=")[1])) {
					ents.push(myEntities[i].entity.split(":")[1].split("=")[1]);
				}
			}
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
			$('#transcriptInf').html(transcriptInfo);
//				$('#transcriptInf').show();
			resizeRTable();
			callback(null, [])
		});
	});
}

function doWords() {
	let lines=$("l");
	for (let i=0; i<lines.length; i++) {
		let newArray=[], openElements=[];
		let book=$($(lines[i])).parent("div").attr("n");
		let lineId=$(lines[i]).attr("n");
		let result=doWordsOneLine(newArray, $(lines[i]).html(), book+"-"+lineId, openElements, currMS, "transcript");
		$(lines[i]).html(result);
	}
}


function formatDate(rawdate) {
    var date = new Date(rawdate);
    var options = {
    year: "numeric", month: "short",
    day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false
    };
    return date.toLocaleTimeString("en-us", options);
}

