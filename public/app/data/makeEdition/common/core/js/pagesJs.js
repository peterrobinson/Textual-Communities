var isPopUpOrigSpelling=false;
const punctuation=".,:-/&@¶§;·⸫▽?!'"+'"';


function initTranscript () {
	$("#page-head").load(universalBannerLocation, function (){
		if (ssSearch) {
			$("#staticSearch").html("<script xmlns='http://www.w3.org/1999/xhtml' src='../../../staticSearch/ssSearch.js'></script>\n<script xmlns='http://www.w3.org/1999/xhtml' src='../../../staticSearch/ssInitialize.js'>\n</script><script xmlns='http://www.w3.org/1999/xhtml' src='../../../staticSearch/ssHighlight.js'></script>\n<form xmlns='http://www.w3.org/1999/xhtml' accept-charset='UTF-8' id='ssForm'  data-allowphrasal='yes' data-allowwildcards='yes' data-minwordlength='2'  data-scrolltotextfragment='no' data-maxkwicstoshow='5' data-resultsperpage='5'  onsubmit='return false;' data-versionstring='' data-ssfolder='../../../staticSearch' data-kwictruncatestring='...' data-resultslimit='2000'><span class='ssQueryAndButton'><input type='text' id='ssQuery' style='height: 21px' aria-label='Search'/><button id='ssDoSearch' style='background-image: url(\"../../../common/core/images/searchicon.png\")');>Search</button></span></form>\n<div xmlns='http://www.w3.org/1999/xhtml' id='ssSearching'></div>")
		}
		$("w.showTip").hover(showCollation, hideCollation);
		$("#MS").val(currMS);
		let newPage=getCookie("newPage");
		if (newPage!="") {
			$("#entityMenu").html(initializeEntityChoice(newPage, currMS));
		} else {
			$("#entityMenu").html(initializeEntityChoice(currEntity, currMS));
		} 
		if (iiifURL) {
			openImage();
			initializeSplitView();
		} else {
			$("#panel-left").hide();
		}
		resizeRTable();  
		if (getCookie("isShowPopUps")=="false") {
			isShowPopUps=false;
		} else {
			isShowPopUps=true;
		}
		$("#showPops").prop( "checked", isShowPopUps );	
		showPopUps();
		if (getCookie("isPopUpOrigSpelling")=="true") {
			isPopUpOrigSpelling=true;
		} else {
			isPopUpOrigSpelling=false;
		}
	});
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

function showCollation (event) {
	//the event could actually be on an embedded element within the word
		let idColl=$(event.currentTarget).attr("class").split(" ")[1];
		 setUpDrag(idColl);
		 $("."+idColl).addClass("collLemmaText");
		 adjustPopUpPosition(idColl, event);
		 setTimeout(() => {selectPUsp($("#tipDiv").find(".puCB")[0])});
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

function hideCollation() {
//	$("w").removeClass("collLemma");
	$("w").removeClass("collLemmaText");
//	$("rdg").removeClass("collLemma");
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
