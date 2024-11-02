var isPopUpOrigSpelling=true;
var isShowPopUps=false;	
var lastEntity="";
const suffixes=["","-mod","-orig"]; //used to handle alternative app readings. Note that it is impportant to have "" among the suffixes
const punctuation=".,:-/&@¶§;·⸫▽?!'"+'"';
var nowEntity=currEntity;
var adjustHeight=29;
var thisMS;

function initCompare () {
	$.get(universalBannerLocation, function (data, status){
		let compareJSON={};
		$("#editorialMenu").html($(data).find("#editorialMenu").html());
		$("#entityMenu").html($(data).find("#entityMenu").html());
		$("#cfWitsFrame").hide();
		resizeRTable();  
		let newCompare=getCookie("compare");
		if (newCompare!="") {
			compareJSON=JSON.parse(newCompare);
			if (compareJSON.place!=currEntity && currEntities.indexOf(compareJSON.place)>-1) {
				$("#entityMenu").html(initializeEntityChoice(compareJSON.place, compareJSON.MS));
				thisMS=$("#MS").val();
				nowEntity=compareJSON.place;
				updateCompareLinks();
			} else {
				$("#entityMenu").html(initializeEntityChoice(currEntities[0], compareJSON.MS));
				thisMS=$("#MS").val();
				nowEntity=currEntities[0];
				updateCompareLinks();
			}
			if (!compareJSON.stacked) {
				$("#setView").prop( "checked", false );
			} else {
				$("#setView").prop( "checked", true );
			}
			if (compareJSON.fromLink) { //initialize showing edition, ms, ms image
				//what number is our ms?
				let which=$($("#cfWitsChoice").find("input[data-wit='"+compareJSON.MS+"']")[0]).attr("data-n");
				$($("input[data-n="+which+"]")[0]).prop('checked', true);
				if (which!="0") {
					$($("input[data-n=0]")[0]).prop('checked', true);
					cfChoose("0");
				}
				cfChoose(which);
				addImage(which);
			}
			for (let i=0; i<compareJSON.activeMSS.length; i++) {
				if (compareJSON.activeMSS[i].text) {
					$("input[data-n="+compareJSON.activeMSS[i].which+"]").prop( "checked", true );
					cfChoose(compareJSON.activeMSS[i].which);
				}
				if (!compareJSON.activeMSS[i].text) addImage(compareJSON.activeMSS[i].which);
			}
			updateImages();
		} else {
			$("#entityMenu").html(initializeEntityChoice(currEntity, currMS));
			thisMS=$("#MS").val();
			nowEntity=currEntity;
			updateCompareLinks();
		}
		//filter out to show ONLY mss with this entity
		filterWits();
		showPopUps(); 
		if (getCookie("isPopUpOrigSpelling")=="true") {
			isPopUpOrigSpelling=true;
		} else {
			isPopUpOrigSpelling=false;
		}
		updateLines();
		if ($( "#cfStackwits").find(".cfStackLines,.cfImage").length==0)$( "#cfStackwits").hide();
		if (JSON.stringify(compareJSON) === "{}" || compareJSON.stacked) $( "#cfWitsShow").hide();
		$( ".cfTextWords").scroll(cfScroll);
		saveStateCookie(currEntities[0], nowEntity)
	});
}

function filterWits() {
	//easy .. just get wits from ms menu
	let mss=[]
	let options=$("#MS").find("option");
	for (let i=0; i<options.length; i++) {
		mss.push($(options[i]).attr("value"));
	}
	if (mss[0]=="Base")	mss[0]="Edition";
	let cfWits=$("#cfWitsChoice").find("input");
	for (let i=0; i<cfWits.length; i++) {
		if (!mss.includes($(cfWits[i]).attr("data-wit"))) {
			$(cfWits[i]).attr('disabled','disabled');
			$(cfWits[i]).parent("span").css("color","grey")
		} else {
			$(cfWits[i]).removeAttr('disabled');
			$(cfWits[i]).parent("span").css("color","black")
		}
	}
}

var currentScroll="";
var currentN="";

function scrollPanels(divs, which, nVal) {
	for (let i=0; i<divs.length; i++) {
		if ($(divs[i]).attr("id")!=which) {
			scrollPanel($(divs[i]).attr("id"), nVal);
		} else {
			let thisLine=$($("#"+which)[0]).find("l[data-entity='"+nVal+"']")[0];  //gets this line in panel
		}
	}
}

function openCompare(entity) { //generic open compare ...
	thisMS=$("#MS").val();
	if (currEntities.indexOf(entity)>-1) {
		//in current range
		if (currEntities.indexOf(entity)>0) {
			nowEntity=currEntities[currEntities.indexOf(entity)-1];
			cfMoveNextLine();
		} else {
			nowEntity=currEntities[1];
			cfMovePrevLine();
		}
	} else if (compareIndex.filter(myEntity=>myEntity.entity==entity).length) {
		//find out where it is and go there
		let place=compareIndex.findIndex(x => x.entity === entity);
		let newRange=compareIndex[place].index;
		moveCompare(newRange, compareIndex[place].entity);
	} else {
		//can't find it
		let foo=1;
		console.log("this can't happen")
	}	
	updateCompareLinks();
}

function scrollPanel(which, nVal){
	let thisLine=$($("#"+which)[0]).find("l[data-entity='"+nVal+"']")[0];  //gets this line in panel
	//have to adapt in case where we are towards the end of the panel...do not try to scroll past where container is not filled with text
	//three possibilities. Line is currently visible. do nothing.
	if (!isVisible(thisLine, $("#"+which)[0])) {
		$("#"+which).off("scroll", cfScroll);
		$("#"+which)[0].addEventListener("scrollend", (event) => {
			$("#"+which).on("scroll", cfScroll);			
		}); 
		if (thisLine.offsetTop>$("#"+which).position().top+$("#"+which).outerHeight()) {
				$($("#"+which)[0]).scrollTop($("#"+which)[0].scrollHeight-$("#"+which).outerHeight()+5);
			} else {
				$("#"+which).scrollTop(thisLine.offsetTop - $("#"+which).position().top);
			}
//		$($("#"+which)[0]).scrollTop(thisLine.offsetTop-$("#"+which).position().top);
	}
//	thisLine.scrollIntoView(); //scrolls to that line .. but this has sideeffects which scroll to top does not
}

function cfScroll () {
	//which is the top-most visible element..
	let myLines=$(this).find("l");
	let topDiv=$(this).position().top;
	let which=$(this).attr("id");
	let divs=$("#cfWitsShow").find("div.cfTextWords");
//if the line is visible .. do nothing
	let thisLine=$(this).find("l[data-entity='"+nowEntity+"']")[0];  //gets this line in panel
	if (isVisible(thisLine, $(this)[0])) return;
	for (let i=0; i<myLines.length; i++) {
		if ($(myLines[i]).position().top>topDiv-5) {
			//find the other witnesses and scroll the first line into view
			let myEntity=$(myLines[i]).attr("data-entity");
			if (currentScroll==which && currentN==myEntity) {
				return;  //else we can get stuck in a perpetual loop
			} else {
				currentScroll=which;
				currentN=myEntity;
				nowEntity=myEntity;
				updateLines();
				$("#entityMenu").html(initializeEntityChoice(myEntity, thisMS));
				thisMS=$("#MS").val();
				updateCompareLinks();
				scrollPanels(divs, which, myEntity);
			}
			break;
		}
	}
}


function cfChoose(which) {
	if ($("#setView").is(':checked')) { //set up header
		if (!$("input[data-n="+which+"]")[0].checked) { 
			if ($("#cfStack").children().length>2) { //just remove this one
				closeCfText(which);  //remove it and uncheck box
			} else { //if only two children: first is header so remove that too
				closeCfText(which);
				$(".cfStackHeader").remove();
			}
		} else {
			$("#cfWitsShow").hide();
			if ($("#cfStack").children().length==0) {
				$("#cfStack").html("<div class=\"cfStackHeader\"><div class=\"cfMoveLine\"><a id=\"cfMovePrevLine\" href=\"javascript:cfMovePrevLine()\">&lt;</a></div><div id=\"cfStackLabel\">"+formatEntityLabel(nowEntity)+"</div><div class=\"cfMoveLine\"><a id=\"cfMoveNextLine\" href=\"javascript:cfMoveNextLine()\">&gt;</a></div></div>");			
				$("#cfStackwits").css("display", "flex");
				$("#cfStack").height($("#panel-right").height()-$("#cfLinks").height()-$("#cfHeader").height()-adjustHeight);
				$("#cfStackwits").show();
				$("#cfStack").show();
			}
			//add this line in this ms
			updateStackLine(which);
			updateLines();
		}
	} else {
		$("#cfWitsShow").show();
		$("#cfStackwits").hide();
		if ($("input[data-n="+which+"]")[0].checked) {
			var myEl=$("#cfText"+which).detach();
			$("#cfWitsShow").append(myEl);
			if (!$("#cfImage"+which).is(":visible")) {
				$("#cfTextAdd"+which).show();
			}
			let newHeight=$("#rTable").height()-$("#cfLinks").height()-$("#cfHeader").height()-adjustHeight;
			$("#cfText"+which).height(""+newHeight+"px");
		} else {
			if ($("#cfText"+which).is(":visible")) {
				var myEl=$("#cfText"+which).detach();
				$("#cfWitsFrame").append(myEl);
			}
			if ($("#cfImage"+which).is(":visible")) {
				var myEl=$("#cfImage"+which).detach();
				$("#cfWitsFrame").append(myEl);
			}
		}
		updateLines();
	}
	saveStateCookie(currEntities[0], nowEntity);
	updateCollation();
}

function updateStackLine(which) {
	let thisLine=$($($("#cfText"+which)[0]).find("l[data-entity='"+nowEntity+"']")[0]).html();
	let myWit=$("#cfTextSigil"+which).html();
	let myWitName=myWit, imageLink="";
	//image could already be open! so alter image link accordingly
	if ($("#cfImage"+which).is(":visible")) {
		imageLink="<a class=\"cfTextAddLink\" id=\"cfSImageLink"+which+"\" href=\"javascript:closeCfImage('"+which+"')\"><img class=\"menuimg\" height=\"12\" src=\"../../../common/core/images/camera-black.png\" width=\"15\"/></a>";
	} else {
		imageLink="<a class=\"cfTextAddLink\" id=\"cfSImageLink"+which+"\" href=\"javascript:addImage('"+which+"')\"><img class=\"menuimg\" height=\"12\" src=\"../../../common/core/images/camera-black.png\" width=\"15\"/></a>";
	}
	if (myWitName=="Edition") {
		myWitName="Base";
		 imageLink="";
	}
	let wit="<a href=\"javascript:getMSLine('"+nowEntity+"','"+myWitName+"')\">"+myWit+"</a>";
	if (thisLine.indexOf(": OUT")>-1) { //line out!
		wit=myWit;
		imageLink="";
	}
	let CSLid="CSText-"+nowEntity+"-"+myWitName;
	$("#cfStack").append("<div class=\"cfStackLine\" data-sigil=\""+myWitName+"\" data-n=\""+which+"\"><div class=\"clSLinf\"><span><img class=\"cfsCloseLine\" onclick=\"closeCfText("+which+")\" src=\"../../../common/core/images/close.png\" /> "+wit+"</span><span>"+imageLink+"</span></div><div id=\""+CSLid+"\">"+thisLine+"</div></div>");
	if (which==0) $("#cfStack w").hover(showCollation, hideCollation); 
}

const isVisible = function (ele, container) {
    const eleTop = $(ele).position().top;
    const eleBottom = eleTop + $(ele).height();

    const containerTop = container.offsetTop;
    const containerBottom = containerTop + $(container).height()+10;

    // The element is fully visible in the container
    return (
        (eleTop >= containerTop && eleBottom <= containerBottom)
     );
};

function cfMoveNextLine(){
	let index=currEntities.indexOf(nowEntity);
	if (index==currEntities.length-1) {//must move to next entities file
		let place=compareIndex.findIndex(x => x.entity === nowEntity);
		let newRange=compareIndex[place+1].index;
		moveCompare(newRange, compareIndex[place+1].entity); //reload window anyway
	} else {
		nowEntity=currEntities[index+1];
		thisMS=$("#MS").val();
		$("#entityMenu").html(initializeEntityChoice(nowEntity, thisMS));
		updateCompareLinks();
	//is it visible? scroll if not...
		if ($("#setView").is(':checked')) {
			let divs=$("#cfStack").find("div.cfStackLine");
			$("#cfStackLabel").html(formatEntityLabel(nowEntity));
			for (let i=0; i<divs.length; i++) {
				$(divs[i]).remove();
				updateStackLine($(divs[i]).attr("data-n"));
			}
			updateCollation();
		} else {
			let divs=$("#cfWitsShow").find("div.cfTextWords");
			for (let i=0; i<divs.length; i++) {
				let myLine=$(divs[i]).find("l[data-entity='"+nowEntity+"']")[0];
				if (!isVisible(myLine, divs[i])) {
					suspendCfScroll(divs[i]);
					if (myLine.offsetTop>$(divs[i]).position().top-$(divs[i]).outerHeight()) {
						$($(divs[i])[0]).scrollTop($(divs[i])[0].scrollHeight-$(divs[i]).outerHeight());
					} else {
						$(divs[i]).scrollTop(myLine.offsetTop - $(divs[i]).position().top);
					}
				}
			}
		}
		filterWits();
		updateLines();
		updateImages();
		saveStateCookie(currEntities[0], nowEntity);
	}
}

function suspendCfScroll(div) {
	//find cfWords in div; suspend cfScroll on it while we carry out scrolltop; reactivate on scroll
	$(div).off("scroll",cfScroll);
	div.addEventListener("scrollend", (event) => {
		$(div).on("scroll", cfScroll);			
	}); 
}

function updateLines(){
	$("l").removeClass("cfMatchLine");
	$("#cfWitsShow").find("div.cfText l[data-entity='"+nowEntity+"']").addClass("cfMatchLine");
	//let's scroll to get the line into view
	let divs=$("#cfWitsShow").find("div.cfTextWords");
	if (divs.length>0) {  //we don't do this when stacking
		scrollPanels(divs, "", nowEntity);
	}
	if (nowEntity==compareIndex[0].entity) {
		$("#cfPrevLine").hide();
		if ($("#setView").is(':checked')) {
			$("#cfMovePrevLine").hide();
		}
	} else {
		$("#cfPrevLine").show();
		if ($("#setView").is(':checked')) {
			$("#cfMovePrevLine").show();
		}
	}
	if (nowEntity!=compareIndex[compareIndex.length-1].entity) {
		$("#cfNextLine").show();
		if ($("#setView").is(':checked')) {
			$("#cfMoveNextLine").show();
		}
	} else {
		$("#cfNextLine").hide();
		if ($("#setView").is(':checked')) {
			$("#cfMoveNextLine").hide();
		}
	}
}

function updateImages() {
	//look at all the divs...
	let divs=$("#cfWitsShow, #cfStackwits").find(".cfImage");
	for (let i=0; i<divs.length; i++) {
		let thisDiv=divs[i];
		let which=Number($(thisDiv).attr("id").slice(7));
		let ms=$("#cfTextSigil"+which).html();
		//does this line even exist in this witness? CfText-L2:line=IRE-Ad1
		let thisid="CfText-"+nowEntity+"-"+ms;
		let thisline=$("[id='"+thisid+"']");
		if ($(thisline).hasClass("lineCfTextOut")) {
			$("#cfImageSigilSpan"+which).html("");
			$("#cfImageWords"+which).html("<span style='display: block; text-align: center'>"+formatEntityLabel(nowEntity)+" not present in "+ms+"</span>");
			$("#cfImage"+which).removeAttr("data-currIIIF");
		} else {
			let currIIIFurl=$("#cfImage"+which).attr("data-currIIIF");
			if (typeof currIIIFurl=="undefined") {
				addImage(which);
			} else {
				//is it already open? but we might need to update...
				if ($(thisline).attr("data-iiifurl")!=currIIIFurl) {
					addImage(which);
				}
			}
		}
	}
}

function updateCompareLinks() { //after a reset of the entity menu...
	thisMS=$("#MS").val();  //which page in this ms?
	let page=getMSPage(nowEntity, thisMS);
	$("#cfTranscriptLink").attr("href", "javascript:getTranscriptFromCollation(\""+thisMS+"\", \""+page+"\",\""+nowEntity+"\")");
	let folder=nowEntity.slice(0, nowEntity.lastIndexOf(":"));
	let file=nowEntity.slice(nowEntity.lastIndexOf(":")+1);
	$("#cfCollationLink").attr("href","../../collationreg/"+folder+"/"+file+".html");
}

function moveCompare(entity, place) {
	saveStateCookie(entity, place);
	window.location.href="../"+entity.slice(0, entity.lastIndexOf(":"))+"/"+entity.slice(entity.lastIndexOf(":")+1)+".html";
}

function saveStateCookie(entity, place) {
	let activeMSS=[];
	if (typeof place=="undefined") place=entity;
	if ($("input[id='setView']").is(":checked")) {
		let csWits=$("#cfStack").find("div.cfStackLine");
		let imageWits=$("#cfStackwits").find("div.cfImage");
		for (let i=0; i<csWits.length; i++) {
			activeMSS.push({which: $(csWits[i]).attr("data-n"), text: true});
		}
		for (let i=0; i<imageWits.length; i++) {
			activeMSS.push({which: $(imageWits[i]).attr("id").slice(7), text: false});
		}
	} else {
		let cfWits=$("#cfWitsShow").find("div.cfText,div.cfImage")
		for (let i=0; i<cfWits.length; i++) {
			if ($(cfWits[i]).hasClass("cfText")) {
				let which=$(cfWits[i]).attr("id").slice(6)
				activeMSS.push({which: which, text: true})
			} else {
				let which=$(cfWits[i]).attr("id").slice(7);
				activeMSS.push({which: which, text: false})
			}
		}
	}
	let moveJSON={stacked: $("input[id='setView']").is(":checked"), activeMSS: activeMSS, place: place, MS:$("#MS").val(), fromLink: false};
	setCookie("compare", JSON.stringify(moveJSON), 1);  //set for a whole day but keep updating
}

function cfMovePrevLine(){
	let index=currEntities.indexOf(nowEntity);
	if (index==0) {//must move to previous entities file
		let place=compareIndex.findIndex(x => x.entity === nowEntity);
		let newRange=compareIndex[place-1].index;
		moveCompare(newRange, compareIndex[place-1].entity); //reload window anyway
	} else {
		nowEntity=currEntities[index-1];
		thisMS=$("#MS").val();
		$("#entityMenu").html(initializeEntityChoice(nowEntity, thisMS));
		updateCompareLinks();
		if ($("#setView").is(':checked')) {
			let divs=$("#cfStack").find("div.cfStackLine");
			$("#cfStackLabel").html(formatEntityLabel(nowEntity));
			for (let i=0; i<divs.length; i++) {
				$(divs[i]).remove();
				updateStackLine($(divs[i]).attr("data-n"));
			}
			updateCollation();
		} else {
			let divs=$("#cfWitsShow").find("div.cfTextWords");
			for (let i=0; i<divs.length; i++) {
				let myLine=$(divs[i]).find("l[data-entity='"+nowEntity+"']")[0];
				if (!isVisible(myLine, divs[i])) {
					suspendCfScroll(divs[i]);
					$(divs[i]).scrollTop(myLine.offsetTop - $(divs[i]).position().top);
				}
			}
		}
		filterWits();
		updateLines();
		updateImages();
		saveStateCookie(currEntities[0], nowEntity);
	}
}


function updateCollation() {
	//remove all style attributes on words
	let cfTexts=[], myEntities=[];
	$("w").css("color", ""); //side effects .. remove showTip attributes.. uh
	$("l").removeClass("cfMatchLine");
	//are we stacking the variants...?
	if ($("#setView").is(':checked')) {
		cfTexts=$("#cfStack").find(".cfStackLine");
		myEntities.push(nowEntity);
	} else {
		$("#cfWitsShow").find("div.cfText l[data-entity='"+nowEntity+"']").addClass("cfMatchLine");
		cfTexts=$("#cfWitsShow").find(".cfText");
		myEntities=currEntities;
	}
	if (cfTexts.length<2) {
		return;
	} else {
		let variants=[];
		for (let a=0; a<myEntities.length; a++) {
			let entity=myEntities[a];
			let collation=collations.filter(collation=>collation.entity==entity)[0].collation;
			let structure=JSON.parse(collation).structure;
			for (let i=0; i<structure.apparatus.length; i++) {
				for (let j=0; j<structure.apparatus[i].readings.length; j++) {
					if (structure.apparatus[i].readings[j].type=="lac") {
						continue;
					} else {
						for (let k=0; k<cfTexts.length; k++) {
							let sigil="";
							if ($("#setView").is(':checked')) {
								sigil=$(cfTexts[k]).attr("data-sigil");
							} else {
								sigil=$($(cfTexts[k]).find(".cfSigil")[0]).html();
							}
							if (community=="CTP2" && sigil=="Edition") sigil="Base";
							if (currMSinWitsME(structure.apparatus[i].readings[j].witnesses, sigil)) {
								let apparatus=entity+"-App-"+i;
								if (variants.filter(app=>app.app==apparatus).length==0) {
									variants.push({app:apparatus, readings:[]});
								}
								let reading="Rdg-"+j;
								if (variants.filter(app=>app.app==apparatus)[0].readings.filter(rdg=>rdg.reading==reading).length==0) {
									variants.filter(app=>app.app==apparatus)[0].readings.push({reading:reading, mss:[]})
								}
								let msIndices=getMsIndices(structure.apparatus[i].readings[j], sigil, entity);
//								if (community=="CTP" && sigil=="Base") sigil="Edition";
								variants.filter(app=>app.app==apparatus)[0].readings.filter(rdg=>rdg.reading==reading)[0].mss.push({ms: sigil, entity:entity, msIndices: msIndices })
							}
						}
					}
				}
			}
		}
		colors=palette('mpn65', 8); //disabled. We are now going to make them all red and that's it
		cIndex=-1;
		for (let i=0; i<variants.length; i++) {
			if (variants[i].readings.length>1) { //variants alert!
				cIndex++;
				if (cIndex==8) cIndex=0;
				for (let j=0; j<variants[i].readings.length; j++) {
					for (let k=0; k<variants[i].readings[j].mss.length; k++) {
						let myLine=null;
						if ($("#setView").is(':checked')) {
							myLine=$("[id='CSText-"+variants[i].readings[j].mss[k].entity+"-"+variants[i].readings[j].mss[k].ms+"']");
						} else {
							myLine=$("[id='CfText-"+variants[i].readings[j].mss[k].entity+"-"+variants[i].readings[j].mss[k].ms+"']");
						}
						let words=$(myLine[0]).find("w");
						for (let m=0; m<variants[i].readings[j].mss[k].msIndices.length; m++)  {
							for (let n=0; n<words.length; n++) {
								if ($(words[n]).attr("n")==variants[i].readings[j].mss[k].msIndices[m]) {
									$(words[n]).attr("style", "color: #"+ colors[cIndex]); //put back if we change our mind
//									$(words[n]).attr("style", "color:red");
								}
							}
						}
					}
				}
			}
		}
	}
}

function getMsIndices(reading, sigil, entity) {
	let words=[]; 
	if (typeof reading.type!="undefined" && reading.type=="om") {
		//does NOT deal with cases where there is an earlier omission...
		words.push("Omit0");
	} else if (typeof reading.SR_text!="undefined"){
		let SRtext=reading.SR_text[sigil];
		if (typeof SRtext=="undefined") {
			 let sigilmod=sigil+"-mod";
			 SRtext=reading.SR_text[sigilmod];
		}
		if (typeof SRtext=="undefined") {
			let sigilorig=sigil+"-orig";
			SRtext=reading.SR_text[sigilorig];
		}
		if (typeof SRtext !="undefined") {
			for (let i=0; i<SRtext.text.length; i++) {
				let sigStrI=SRtext.text[i][sigil];
				if (typeof sigStrI=="undefined") {
					let srSig=sigil+"-mod";
					sigStrI=SRtext.text[i][srSig];
				}
				if (typeof sigStrI=="undefined") {
					let srSig=sigil+"-orig";
					sigStrI=SRtext.text[i][srSig];
				}
				if (typeof sigStrI!="undefined") {
					words.push(sigStrI.index);
				} 
			}
		} else {
			if (typeof reading.text!="undefined") {
				for (let i=0; i<reading.text.length; i++) {
					if (typeof reading.text[i][sigil]!="undefined") {
						words.push(reading.text[i][sigil].index);
					} else { //check for mod, orig
						checkModOrig(words, reading.text[i], sigil, entity);
					}
				}				
			} else {
				console.log("Reading SR_text: can't find index of "+sigil+" in "+entity);
			}
		}
	} else {
		for (let i=0; i<reading.text.length; i++) {
			if (typeof reading.text[i][sigil]!="undefined") {
				words.push(reading.text[i][sigil].index);
			} else { //check for mod, orig
				checkModOrig(words, reading.text[i], sigil, entity);
			}
		}
	}
	return(words);
}

function checkModOrig(words, readingtxt, sigil, entity){
	let sigilorig=sigil+"-orig";
	if (typeof readingtxt[sigilorig]!="undefined") {
		words.push(readingtxt[sigilorig].index);
	} else {
		let sigilmod=sigil+"-mod";
		if (typeof readingtxt[sigilmod]!="undefined") {
			words.push(readingtxt[sigilmod].index);
		} else {
			console.log("can't find index of "+sigil+" in "+entity);
		}
	}
}

function closeCfText(which) {
	if ($("#setView").is(':checked')) { 
		$("div[data-n='"+which+"']").remove();
		if ($(".cfStackLine").length==0) {
			$(".cfStackHeader").remove();
			$("#cfStack").hide();
//			$("#cfStackwits").hide();
		}
	} else {
		var myEl=$("#cfText"+which).detach();
		$("#cfWitsFrame").append(myEl);
		if ($("#cfImage"+which).is(":visible")) {
			$("#cfImageAdd"+which).show();
		}
	}
	$("input[data-n="+which+"]").prop( "checked", false );
	saveStateCookie(currEntities[0], nowEntity)
	updateCollation();
}

function closeCfImage(which) {
	var myEl=$("#cfImage"+which).detach();
	$("#cfWitsFrame").append(myEl);
//	$("input[data-n="+which+"]").prop( "checked", false );
	if ($("#cfText"+which).is(":visible")) {
		$("#cfTextAdd"+which).show();
	}
	//if we are stacking and text is visible, set href to open this image
	if (typeof $("#cfSImageLink"+which)!="undefined" && $("#cfSImageLink"+which).is(":visible")) {
		$("#cfSImageLink"+which).attr("href", "javascript:addImage("+which+")")
	}
	saveStateCookie(currEntities[0], nowEntity)
}

function addText(which) {
	var myEl=$("#cfText"+which).detach();
	$("#cfImage"+which).before(myEl);
	//remove add images etc links
	$("#cfTextAdd"+which).hide();
	$("#cfImageAdd"+which).hide();
	updateCollation();
	saveStateCookie(currEntities[0], nowEntity)
}

function addImage(which) {
	let entity=getEntityFromMenu();
	nowEntity=entity;
	let ms=$("#cfTextSigil"+which).html();
	let myLine=$("[id='CfText-"+entity+"-"+ms+"']");
	let myURL=$(myLine).attr("data-iiifurl");
	$("#cfImageWords"+which).html("");
	if (typeof myURL=="string") {
		let myPage=$(myLine).attr("data-page");
		let myMS=pageEntitiesMin.filter(witness => witness.witness==ms)[0];
		let thisPage=myMS.pages.filter(page=>page.page==myPage)[0];
		let label=makeEntitySpan(thisPage);
		$("#cfImageSigilSpan"+which).html("<span>"+label+"</span>");
		let viewer = OpenSeadragon({
			id: "cfImageWords"+which,
			maxZoomPixelRatio: 3,  //0.5 for stemmata
			minZoomImageRatio: 0.7,
			homeFillsViewer: true,
			prefixUrl: "https://openseadragon.github.io/openseadragon/images/"
		});	
		$.get(myURL, function(source) {
			if (viewer) viewer.open([source]);
		});
		$("#cfImageSigil"+which).html(ms+": "+myPage);
		$("#cfImage"+which).attr("data-currIIIF", myURL);
	} else { //there is no image..
		//do what?? say something?
		$("#cfImage"+which).removeAttr("data-currIIIF");
		$("#cfImageSigilSpan"+which).html("");
		$("#cfImageWords"+which).html("<span style='display: block; text-align: center'>"+formatEntityLabel(nowEntity)+" not present in "+ms+"</span>");
	}
	var myEl=$("#cfImage"+which).detach();
	if ($("#setView").is(':checked')) {
		$("#cfStackwits").append(myEl);
		$("#cfImageAdd"+which).hide();
		$("#cfSImageLink"+which).attr("href", "javascript:closeCfImage("+which+")");
	} else {
		if ($("#cfText"+which).is(":visible")) {
			$("#cfText"+which).after(myEl);
		} else {  //if text is not visible then must be adding it when moving the image viewer
			$("#cfWitsShow").append(myEl);
		}
		//remove add images etc links
		$("#cfTextAdd"+which).hide();
		if ($("#cfText"+which).is(":visible")) $("#cfImageAdd"+which).hide();
	}
	$(".cfImage").height(($("#panel-right").height()-$("#cfLinks").height()-$("#cfHeader").height()-adjustHeight));
	saveStateCookie(currEntities[0], nowEntity)
}


function initComm () {
	$("#tipDiv").attr("onmousedown", "");
	 $("#tipDiv").attr("onmouseup", "");
	 $("#tipDiv").css('cursor', 'text');
}

function showPopUps () {
		$(".showTip").removeClass("dummy");
		$("w.showTip").hover(showCollation, hideCollation);
//		$(".commRef").hover(initComm);
//		$(".msInf").hover(initComm);
		isShowPopUps=true;
} 



function transcriptToCollation (){
	let entity="";
	for (let i=0; $("#menu"+i).length>0; i++) {
		entity+=$("#menu"+i).val()+":";
	}
	entity+=$("#line").attr("data-key");
	let folder=entity.slice(0, entity.lastIndexOf(":"))
	let fileN=entity.slice(entity.lastIndexOf(":")+1)
	window.location.href="../../../html/collationreg/"+folder+"/"+fileN+".html";
}


function setUpDrag(idColl) {
//	if  ($("#pATitle-"+idColl).length)
	 $("#pATitle-"+idColl).attr("onmousedown", "mydragg.startMoving(document.getElementById('tipDiv'),'whole',event)");
	 $("#pATitle-"+idColl).attr("onmouseup", "mydragg.stopMoving('whole')");
	 $("#pATitle-"+idColl).hover(highLightWords);
	 $("#pATitle-"+idColl).css('cursor', 'move');
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


function highLightWords() {
	let thisID=$("#tipDiv").find(".popAppFrame").attr("data-id");
	$("."+thisID).addClass("collLemmaText");
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

function selectPUsp(element) {
	element.checked=isPopUpOrigSpelling;
	if (isPopUpOrigSpelling)  {
		$(element).parents(".popAppFrame").find(".popAppWordCont-reg").hide();
		$(element).parents(".popAppFrame").find(".popAppWordCont-orig").show();
		setCookie("isPopUpOrigSpelling", "true", 365);
	} else {
		$(element).parents(".popAppFrame").find(".popAppWordCont-reg").show();
		$(element).parents(".popAppFrame").find(".popAppWordCont-orig").hide();
		setCookie("isPopUpOrigSpelling", "false", 365);
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

function getImageInf() {
	$('#OAstatement').css("height", "auto");
	$('#imageInf').show();
	resizeRTable();
}

function getTranscriptInf (){
	$('#OAstatement').css("height", "auto");
	$('#transcriptInf').show();
	resizeRTable();
};

function choosePUsp(element) {
	isPopUpOrigSpelling=element.checked;
	selectPUsp(element);
}


function changeCfView() {
	let activeMSS=[]
	if ($("#setView").is(':checked')) {
		let cfWits=$("#cfWitsShow").find("div.cfText,div.cfImage");
		$("#cfStackwits").css("display", "flex");
		for (let i=0; i<cfWits.length; i++) {
			if ($(cfWits[i]).hasClass("cfText")) {
				let which=$(cfWits[i]).attr("id").slice(6)
				activeMSS.push({which: which, text: true})
				var myEl=$("#cfText"+which).detach();
				$("#cfWitsFrame").append(myEl);
			} else {
				let which=$(cfWits[i]).attr("id").slice(7);
				activeMSS.push({which: which, text: false})
				var myEl=$("#cfImage"+which).detach();
				$("#cfWitsFrame").append(myEl);
			}
		}
		//return wits from witshow back to cfWitsFrame...
		if (activeMSS.length==0) $("#cfStackwits").css("display", "none");
	} else {
		let csWits=$("#cfStack").find("div.cfStackLine");
		let imageWits=$("#cfStackwits").find("div.cfImage");
		$("#cfStackwits").css("display", "none");
		for (let i=0; i<csWits.length; i++) {
			activeMSS.push({which: $(csWits[i]).attr("data-n"), text: true});
		}
		for (let i=0; i<imageWits.length; i++) {
			let which=$(imageWits[i]).attr("id").slice(7)
			activeMSS.push({which: which, text: false});
			var myEl=$("#cfImage"+which).detach();
			$("#cfWitsFrame").append(myEl);
		}
		$(csWits).remove();
	}
	for (let i=0; i<activeMSS.length; i++) {
		if (activeMSS[i].text) {
			$("input[data-n="+activeMSS[i].which+"]").prop( "checked", true );
			cfChoose(activeMSS[i].which);
		}
		if (!activeMSS[i].text) addImage(activeMSS[i].which);
	}
	updateImages();
	updateLines();
	saveStateCookie(currEntities[0], nowEntity);
}

function resetCompare() {
	if (!$("#setView").is(':checked')) {
		let cfWits=$("#cfWitsShow").find("div.cfText,div.cfImage");
		for (let i=0; i<cfWits.length; i++) {
			if ($(cfWits[i]).hasClass("cfText")) {
				let which=$(cfWits[i]).attr("id").slice(6)
				var myEl=$("#cfText"+which).detach();
				$("#cfWitsFrame").append(myEl);
				$("input[data-n="+which+"]").prop( "checked", false );
			} else {
				let which=$(cfWits[i]).attr("id").slice(7);
				var myEl=$("#cfImage"+which).detach();
				$("#cfWitsFrame").append(myEl);
			}
		}
	} else {
		let csWits=$("#cfStack").find("div.cfStackLine");
		for (let i=0; i<csWits.length; i++) {
			let which=$(csWits[i]).attr("data-n");
			$("input[data-n="+which+"]").prop( "checked", false );
		}
		let imageWits=$("#cfStackwits").find("div.cfImage");
		$("#cfStackwits").css("display", "none");
		for (let i=0; i<imageWits.length; i++) {
			let which=$(imageWits[i]).attr("id").slice(7)
			var myEl=$("#cfImage"+which).detach();
			$("#cfWitsFrame").append(myEl);
		}
		$(csWits).remove();
	}
	$("#cfResetBox").prop( "checked", false );
	saveStateCookie(nowEntity, nowEntity);
}