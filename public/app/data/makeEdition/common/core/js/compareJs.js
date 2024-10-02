var isPopUpOrigSpelling=false;
var isShowPopUps=false;	

const suffixes=["","-mod","-orig"]; //used to handle alternative app readings. Note that it is impportant to have "" among the suffixes
const punctuation=".,:-/&@¶§;·⸫▽?!'"+'"';
var nowEntity=currEntity;


function initCompare () {
	$.get(universalBannerLocation, function (data, status){
		$("#editorialMenu").html($(data).find("#editorialMenu").html());
		$("#entityMenu").html($(data).find("#entityMenu").html());
		$("#cfWitsFrame").hide();
		let newPage=getCookie("newPage");
		if (newPage!="") {
			$("#entityMenu").html(initializeEntityChoice(newPage, currMS));
		} else {
			$("#entityMenu").html(initializeEntityChoice(currEntity, currMS));
		} 
		resizeRTable();  
		showPopUps();
		if (getCookie("isPopUpOrigSpelling")=="true") {
			isPopUpOrigSpelling=true;
		} else {
			isPopUpOrigSpelling=false;
		}
	});
}

function cfChoose(which) {
	if ($("input[data-n="+which+"]")[0].checked) {
		var myEl=$("#cfText"+which).detach();
		$("#cfWitsShow").append(myEl);
		if (!$("#cfImage"+which).is(":visible")) {
			$("#cfTextAdd"+which).show();
		}
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
	updateCollation();
}

function cfMoveNextLine(){
	let index=currEntities.indexOf(nowEntity);
	if ($("#cfPrevLine").html()=="") {
		$("#cfPrevLine").html("<a href='javascript:cfMovePrevLine()'>&lt;</a>");
	} else {
		if ($("#cfPrevLine").is(":hidden")) $("#cfPrevLine").show();
	}
	nowEntity=currEntities[index+1];
	if (index+2==currEntities.length) {
		$("#cfNextLine").hide();
	}
	$("#entityMenu").html(initializeEntityChoice(nowEntity, currMS));
	updateCollation();
	updateImages();
}

function updateImages() {
	//look at all the divs...
	$("l").removeClass("cfMatchLine");
	$("#cfWitsShow").find("div.cfText l[data-entity='"+nowEntity+"']").addClass("cfMatchLine");
	let divs=$("#cfWitsShow").find(".cfImage");
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

function cfMovePrevLine(){
	let index=currEntities.indexOf(nowEntity);
	if ($("#cfNextLine").is(":hidden")) $("#cfNextLine").show();
	nowEntity=currEntities[index-1];
	if (index==1) {
		$("#cfPrevLine").hide();
	}
	$("#entityMenu").html(initializeEntityChoice(nowEntity, currMS));
	updateCollation();
	updateImages();
}


function updateCollation() {
	//remove all style attributes on words
	$("w").css("color", ""); //side effects .. remove showTip attributes.. uh
	$("l").removeClass("cfMatchLine");
	$("#cfWitsShow").find("div.cfText l[data-entity='"+nowEntity+"']").addClass("cfMatchLine");
	let cfTexts=$("#cfWitsShow").find(".cfText");
	if (cfTexts.length<2) {
		return;
	} else {
		let variants=[];
		for (let a=0; a<currEntities.length; a++) {
			let entity=currEntities[a];
			let collation=collations.filter(collation=>collation.entity==entity)[0].collation;
			let structure=JSON.parse(collation).structure;
			for (let i=0; i<structure.apparatus.length; i++) {
				for (let j=0; j<structure.apparatus[i].readings.length; j++) {
					if (structure.apparatus[i].readings[j].type=="lac") {
						continue;
					} else {
						for (let k=0; k<cfTexts.length; k++) {
							let sigil=$($(cfTexts[k]).find(".cfSigil")[0]).html();
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
		colors=palette('mpn65', 8);
		cIndex=-1;
		for (let i=0; i<variants.length; i++) {
			if (variants[i].readings.length>1) { //variants alert!
				cIndex++;
				if (cIndex==8) cIndex=0;
				for (let j=0; j<variants[i].readings.length; j++) {
					for (let k=0; k<variants[i].readings[j].mss.length; k++) {
						let myLine=$("[id='CfText-"+variants[i].readings[j].mss[k].entity+"-"+variants[i].readings[j].mss[k].ms+"']");
						let words=$(myLine[0]).find("w");
						for (let m=0; m<variants[i].readings[j].mss[k].msIndices.length; m++)  {
							for (let n=0; n<words.length; n++) {
								if ($(words[n]).attr("n")==variants[i].readings[j].mss[k].msIndices[m]) {
									$(words[n]).attr("style", "color: #"+ colors[cIndex]);
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
	var myEl=$("#cfText"+which).detach();
	$("#cfWitsFrame").append(myEl);
	$("input[data-n="+which+"]").prop( "checked", false );
	if ($("#cfImage"+which).is(":visible")) {
		$("#cfImageAdd"+which).show();
	}
	updateCollation();
}

function closeCfImage(which) {
	var myEl=$("#cfImage"+which).detach();
	$("#cfWitsFrame").append(myEl);
	$("input[data-n="+which+"]").prop( "checked", false );
	if ($("#cfText"+which).is(":visible")) {
		$("#cfTextAdd"+which).show();
	}
}

function addText(which) {
	var myEl=$("#cfText"+which).detach();
	$("#cfImage"+which).before(myEl);
	//remove add images etc links
	$("#cfTextAdd"+which).hide();
	$("#cfImageAdd"+which).hide();
	updateCollation();
}

function addImage(which) {
	let entity=getEntityFromMenu();
	let ms=$("#cfTextSigil"+which).html();
	let myLine=$("[id='CfText-"+entity+"-"+ms+"']");
	let myURL=$(myLine).attr("data-iiifurl");
	$("#cfImageWords"+which).html("");
	if (typeof myURL=="string") {
		let myPage=$(myLine).attr("data-page");
		let thisMS=pageEntitiesMin.filter(witness => witness.witness==ms)[0];
		let thisPage=thisMS.pages.filter(page=>page.page==myPage)[0];
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
	$("#cfText"+which).after(myEl);
	//remove add images etc links
	$("#cfTextAdd"+which).hide();
	$("#cfImageAdd"+which).hide();
}


function initComm () {
	$("#tipDiv").attr("onmousedown", "");
	 $("#tipDiv").attr("onmouseup", "");
	 $("#tipDiv").css('cursor', 'text');
}

function showPopUps () {
	if ($("#showPops").is(":checked")) {//turn on showTip
		$(".showTip").removeClass("dummy");
		$("w.showTip").hover(showCollation, hideCollation);
		$(".commRef").hover(initComm);
		$(".msInf").hover(initComm);
		isShowPopUps=true;
		setCookie("isShowPopUps", "true", 365)
	} else { //turn it off
		$(".showTip").addClass(function () {
			let existingClasses=$(this).attr("class");
			existingClasses="dummy "+existingClasses;
			$(this).attr("class", existingClasses);
			$("w.showTip").unbind('mouseenter mouseleave');;
			$(".commRef").unbind('mouseenter mouseleave');;
			$(".msInf").unbind('mouseenter mouseleave');;
			isShowPopUps=false;
			setCookie("isShowPopUps", "false", 365);
		});
	}
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
