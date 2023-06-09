//generic javascript for handling CTP transcripts

var currView="";
var startEntity=[];
var prevStartEntity=[];
const punctuation=".,:-/&@¶§;·⸫▽?!'"+'"';
const suffixes=["","-mod","-orig"]; //used to handle alternative app readings


function initMyEdition() {
	initializeTranscript();
	resizeRTable();
	$(window).resize(resizeRTable);
	var panelRight = new Clay('#panel-right');
	panelRight.on('resize', function(size) {
		 resizeRTable();
	});
	openImage();
	makeRubric();
	doCommentaries();
	readCommentary();
	setupCollations();
}

function makeRubric() {
	//also select entity as we figure out where we are on this page
	let  thiswit=pageEntities.filter(function (obj){return obj.witness==thisMS})[0];
	let thisPageEntities=thiswit.entities.filter(function (obj){return obj.page==thisPage});
	let rubric="";
	let endEntity=[];
	var i;
	if ($("#nplA").length>0) $("#nplA").append(" <img height='18px' src='../../../common/images/iconNext.png'>");
	if ($("#pplA").length>0) $("#pplA").prepend("<img height='18px' src='../../../common/images/iconPrev.png'> ");
	for (i=0; i<thisPageEntities.length  && !thisPageEntities[i].collateable; i++) {}
	prevStartEntity=startEntity=thisPageEntities[i].match.split('_');
	
	for (i=thisPageEntities.length-1; i>0 && !thisPageEntities[i].collateable; i--) {}
	endEntity=thisPageEntities[i].match.split('_');
	for (i=0; i<startEntity.length; i++) {
		if (startEntity[i]!=endEntity[i]) {
			for (let j=i; j<startEntity.length; j++) {
				if (j>0) rubric+=" ";
				rubric+=startEntity[j];
			} 
			rubric+="-";
			for (let j=i; j<endEntity.length; j++) {
				if (j>0 && i>1) rubric+=" ";
				rubric+=endEntity[j];
				i=startEntity.length;
			} 
		} else {
			if (i>0) rubric+=" ";
			rubric+=startEntity[i];
		}
	}
	$("#title").html(thisMS+" "+thisPage+", "+rubric);
	$("#pageInf").html(thisMS+" "+thisPage+", "+rubric);
	//ok now we know what page we are on .. set up the drop down menu so it all works
	populateMSS();
}

function populateMSS() {
	$("#level1").html("");
	$("#MS").html("");
	if ($.urlParam("entity")) {
		prevStartEntity=startEntity=$.urlParam("entity").split("_");
	}
	for (let i=0; i<mssEntities.length; i++) {
		if (mssEntities[i].entity==startEntity[0]) {
			$("#level1").append("<option  selected='selected' value='"+mssEntities[i].entity+"'>"+mssEntities[i].entity+"</option>");
		} else {
			$("#level1").append("<option value='"+mssEntities[i].entity+"'>"+mssEntities[i].entity+"</option>");
		}
		for (let j=0; j<mssEntities[i].witnesses.length; j++) {
			if ($("#namedMS").html()==mssEntities[i].witnesses[j].name) {
				$("#MS").append("<option selected='selected' value='"+mssEntities[i].witnesses[j].name+"'>"+mssEntities[i].witnesses[j].name+"</option>");
			} else {
				$("#MS").append("<option value='"+mssEntities[i].witnesses[j].name+"'>"+mssEntities[i].witnesses[j].name+"</option>");
			}
		}
		$("#line").val(startEntity[startEntity.length-1]);
	}
}

function changeView() {
	let level1=$("#level1").val();
	let ms=$("#MS").val();
	let line=$("#line").val();
	let matchMe=level1+"_"+line;
	let thiswit=pageEntities.filter(function (obj){return obj.witness==ms})[0];
	let thisMatch=thiswit.entities.filter(function (obj){return obj.match==matchMe})[0];
	if (thisMatch) {
		let newPage=thisMatch.page;	
		location.href="../"+ms+"/"+newPage+".html?entity="+matchMe;
	} else {
		//send an error message
		alert("Cannot find "+matchMe+" in witness "+ ms+". Likely that witness is missing that text.");
		$("#MS").val(thisMS);
		$("#line").val(prevStartEntity[prevStartEntity.length-1]);
		$("#level1").val(prevStartEntity[0]);
	}
}


function openTranscript() {
	return;
}

// we do this here so that downstream implementers can style the commentary as they like
function readCommentary () {
	let commentaryHTML="";
	if (commentary.length>0) {
		for (let i=0; i<commentary.length; i++ ) {
			commentaryHTML+="<div>\r<h4>"+commentary[i].entity+"</h4>\r";
			for (let j=0; j<commentary[i].json.length; j++){
				for (let k=0; k<commentary[i].json[j].result.length; k++) {
					commentaryHTML+="\r<p>"+formatFromTo(commentary[i].json[j].result[k].entity, commentary[i].json[j].result[k].entityto);
					commentaryHTML+= " "+commentary[i].json[j].result[k].text+" ("+commentary[i].json[j].result[k].approver+", ";
					commentaryHTML+= formatDate(commentary[i].json[j].result[k].date)+")</p>";
				}
			}
			commentaryHTML+="\r</div>"
		}
		$("#editorial").html(commentaryHTML);
	
		//create the menu
		let menuHTML="<li><label for='drop-2' class='toggle'>Editorial Material</label>\r";
		menuHTML+="<a href='#' style='height: 16px; position: relative; top:-4px; padding-left:5px; padding-right:5px'>Editorial Material <img src='../../../common/images/down-arrow-brown.png' height='8px'></img></a>\r";
		menuHTML+="<input type='checkbox' id='drop-2'/>\r";
		menuHTML+="<ul class='box'>\r"
		menuHTML+="<li role='none' id='edCommStart'><a role='menuitem' href='Editorial Matter.pdf' target='_blank' tabindex='-1' style='text-align: center'>— Editorial Commentary —</a></li>\r";
		let dropN=7;
		for (let i=0; i<commentary.length; i++ ) {
			menuHTML+="<li>\r<label for='drop-"+(dropN+i)+"' class='toggle'><span class='ssm'><span>"+commentary[i].entity+"</span>";
			menuHTML+="<img src='../../../common/images/down-arrow-brown.png'></img></span></label>\r";
			menuHTML+="<a href='#'><span class='ssm'><span>"+commentary[i].entity+"</span> <img src='../../../common/images/right-arrow-brown.png'></img></span></a>\r";
			menuHTML+="<input type='checkbox' id='drop-"+(dropN+i)+"'/>\r";
			menuHTML+="<ul>\r";
			for (let j=0; j<commentary[i].json.length; j++){
				for (let k=0; k<commentary[i].json[j].result.length; k++) {
					let fromto=formatFromTo(commentary[i].json[j].result[k].entity, commentary[i].json[j].result[k].entityto);
					let role="";
					if (k==0&&j==0) {
						role="btop";
					} else if (k==commentary[i].json[j].result.length-1 && j==commentary[i].json.length-1) {
						role="bbottom";
					} else {
						role="bmid";
					}
					menuHTML+="<li role='"+role+"'><a role='menuitem' href='javascript:openCommentary(\""+fromto+"\")' tabindex='-1'>"+fromto+"</a></li>\r";
				}	 
		   }
		   menuHTML+="</ul>\r</li>\r";
		}
		menuHTML+"</ul>\r</li>";
		$("#addMatMenu").append(menuHTML);
	}
}


function doCommentary (extraStuff, callback) {
    return function(data, textStatus, jqXHR) {
        // do something with extraStuff
        let commentary="";
        for (let i=0; i<data.result.length; i++) {
			commentary+=formatFromTo(data.result[i].entity, data.result[i].entityto)+". "+data.result[i].text+" ("+data.result[i].approver+", "+formatDate(data.result[i].date)+")<br>"
        }
        if  ($("[data-tce='"+extraStuff.match+"']").html()=="") {
       		 $("[data-tce='"+extraStuff.match+"']").append("<span class='showTip Comm-"+extraStuff.match+" commRef'>C</span>");
       	} else {
        	 $("[data-tce='"+extraStuff.match+"']").prepend("<span class='showTip Comm-"+extraStuff.match+" commRef'>C </span>");
       	}
       	$("#popUps").append("<div id='Comm-"+extraStuff.match+"'><p class='commPopUp'>"+commentary+"</p></div>")
        callback();
    };
}

//make this generic, using master list of collations for this page
//ideally only return previous and next IFF the elements are both prev/next in the master collation list AND prev/next in the ms
//but we settle for just the one before or after
function getPopLinks (myColl) {
	//what precedes and follows in page
	let myColls=pageEntities.filter(ms=>ms.witness==thisMS)[0].entities.filter(page=>page.page==thisPage&&page.hasCollation);
	var links={};
	//get position of current line in pageEntities.. later might use master list for this?
	for (let i=0; i<myColls.length; i++) {
		if (myColls[i].entity==myColl.entity) {
			if (i>0) links.prev=myColls[i-1];
			
			if (i < myColls.length-1) links.next=myColls[i+1]
			return(links);
		}
	}
}

function adjustPopUp(liveWords, lastMSWord, divID, match) {
	if (lastMSWord>liveWords[liveWords.length-1]) {
		$("#"+divID).find("#nextPopAppWord").html('<a href="javascript:showPopUpCollation(\''+match+'\',\''+(liveWords[liveWords.length-1]+2)+'\')">\
			&nbsp;&nbsp;<img src="../../../common/images/iconNext.png" height="16px"/></a>');
	} else {
		$("#"+divID).find("#nextPopAppWord").html("&nbsp;");
	}
	if (liveWords[0]>2) {
		$("#"+divID).find("#prevPopAppWord").html('<a href="javascript:showPopUpCollation(\''+match+'\',\''+(liveWords[0]-2)+'\')">\
			<img src="../../../common/images/iconPrev.png" height="16px"/>&nbsp;&nbsp;</a>');
	} else {
		$("#"+divID).find("#prevPopAppWord").html("&nbsp;");
	}
	let readings=$("#"+divID).find(".popAppWordRdg");
	let width=0;
	for (let i=0; i<readings.length; i++) {
		let thisWidth=getTextSize($(readings[i]).html(), 12);
		if (thisWidth>width) width=thisWidth;
	}
	$(readings).css("flex-basis", (width)+"px");
	let popHeight=$("#tipDiv").height();
	let allHeight=$("#whole").height();
	let topPop=$("#tipDiv").position().top;
	let lineTop=$("[data-collateable="+match+"]").position().top;
	if (topPop+popHeight>allHeight) {
		$("#tipDiv").css({top:(lineTop-popHeight+50)+"px"})
	} 
	//figure out where the top of the tipdiv is; figure out it's height; move accordingly to keep 
}

//moves to next or previous words..
function showPopUpCollation(match, wordnumber){
	unHoverPopUp();
	let myAppFrom=parseInt($("[data-collateable='"+match+"']").find("w[n='"+wordnumber+"']").attr("data-from"));
	let myAppTo=parseInt($("[data-collateable='"+match+"']").find("w[n='"+wordnumber+"']").attr("data-to"));
	$("#tipDiv").html($("#Coll-"+match+"-"+myAppFrom).html());
	for (let i=myAppFrom; i<myAppTo+1; i+=2) {
		$("[data-collateable='"+match+"']").find(("w[n='"+i+"']")).addClass("collLemmaText");
	}
}

function getPopUpCollation(myColl, wordNumber, appNumber, apparatusJS) {
//	let line=$("div[n="+taleName+"]").find("l[n="+lineNumber+"]");
	let links=getPopLinks(myColl);
	let popApp='';
//	currLine=lineNumber;  //leave as string
//	currTale=taleName;
	hideCollation(null);
	popApp+='<div id="popAppFrame">'
	popApp+='<span id="popAppTitle">';
	if (!links.prev) { popApp+="<span>&nbsp;</span>"} else {
		popApp+='<a href="javascript:showCollation(\''+links.prev.entity+'\',\''+links.prev.match+'\')">';
		popApp+='<img src="../../../common/images/iconPrev.png" height="16px"/></a>'
	}
	popApp+="<span>"+formatFromTo(myColl.entity,"")+"</span>";
	if (!links.next) { popApp+="<span>&nbsp;</span>"} else {
		popApp+='<a href="javascript:showCollation(\''+links.next.entity+'\',\''+links.next.match+'\')">';
		popApp+='<img src="../../../common/images/iconNext.png" height="16px"/></a>'
	}
	popApp+="</span>";
	let apparatus=apparatusJS.structure.apparatus;
	popApp+='<div id="popApp"><span id="prevPopAppWord"></span>';
	popApp+='<div id="rdgApp">';
	for (let i=0; i<apparatus.length; i++) {
		let readings=apparatus[i].readings;
		if (readings.length>1) {
			popApp+='<span class="rdgGroup">';
		}
		let overlapWritten=false;
		for (let j=0; j<readings.length; j++) {
			let reading="";
			if (typeof readings[j].overlap_status!="undefined" && readings[j].overlap_status=="duplicate") {
				if (!overlapWritten) {
					reading="[overlap]";
					overlapWritten=true;
				} else break;
			} else if (readings[j].text.length==0) {
				if (readings[j].type=="om") {
					reading='<hi rend="ital">Om.</hi>';
				} 
			} else {
				for (let k=0; k<readings[j].text.length; k++) {
					reading+=readings[j].text[k].interface;
					if (k<readings[j].text.length-1) reading+=" ";
				}
			}
			if (readings.length>1) {
				if (currMSinWits(readings[j].witnesses, thisMS)) {
					popApp+='<span class="app msRdg">'+reading+'</span>';
				} else {
					popApp+='<span class="app">'+reading+'</span>';
				}
			} else {
				popApp+='<span class="app">'+reading+'</span>';
			}
		}
		if (readings.length>1) {
			popApp+='</span>';
		}
	}
	popApp+="</div>";  //end rdg app
	// which is the last word in our ms?
//	let lastMsWord=parseInt($("div[n="+taleName+"] l[n="+lineNumber+"]").find("w").last().attr("n"));
	let currApp=0;
	popApp+='<span id="nextPopAppWord"></span>';
	popApp+="</div>";  //end pop app
	popApp+='<div id="popAppWordCont"><hr/>';	
	let isThisApp=false;
	let liveWords=[];
		//detect that we are showing an omission...or just moving to the previous app, and don't need the word number
	if (wordNumber==-1) {
		isThisApp=true;
		currApp=parseInt(appNumber);
		//calculate the words in the mss...
		for (let j=0; j<apparatus[currApp].readings.length; j++) {
			for (let a=0; a<suffixes.length; a++) {
				if (typeof apparatus[currApp].readings[j].SR_text!="undefined" && typeof apparatus[currApp].readings[j].SR_text[thisMS+suffixes[a]]!="undefined") {
					for (let k=0; k<apparatus[currApp].readings[j].SR_text[thisMS+suffixes[a]].text.length; k++) {
						liveWords.push(parseInt(apparatus[currApp].readings[j].SR_text[thisMS+suffixes[a]].text[k][thisMS+suffixes[a]].index))
					}
				}
				for (let k=0; k< apparatus[currApp].readings[j].text.length; k++) {
					if (typeof apparatus[currApp].readings[j].text[k][thisMS+suffixes[a]]!="undefined") {
						liveWords.push(parseInt(apparatus[currApp].readings[j].text[k][thisMS+suffixes[a]].index));
					}
				}
			}
		}
	}
	for (let i=0; i < apparatus.length  && !isThisApp; i++) {  //this section needed to find which app has highlighted words
		for (let j=0; j<apparatus[i].readings.length && !isThisApp; j++) {
			//could be SR_text reading...
			for (let a=0; a<suffixes.length && !isThisApp; a++) {
				if (typeof apparatus[i].readings[j].SR_text!="undefined" && typeof apparatus[i].readings[j].SR_text[thisMS+suffixes[a]]!="undefined") {
					for (let k=0; k<apparatus[i].readings[j].SR_text[thisMS+suffixes[a]].text.length && !isThisApp; k++) {
						if (parseInt(apparatus[i].readings[j].SR_text[thisMS+suffixes[a]].text[k][thisMS+suffixes[a]].index) == wordNumber) {
							isThisApp=true;
							currApp=i;
							while (k<apparatus[i].readings[j].SR_text[thisMS+suffixes[a]].text.length) {liveWords.push(parseInt(apparatus[i].readings[j].SR_text[thisMS+suffixes[a]].text[k++][thisMS+suffixes[a]].index))}
						}
					}
				}
			}
			//not SR_text reading..
			if (!isThisApp) {
				for (let a=0; a<suffixes.length && !isThisApp; a++) {
					for (let k=0; k< apparatus[i].readings[j].text.length && !isThisApp; k++) {
						if (typeof apparatus[i].readings[j].text[k][thisMS+suffixes[a]]!="undefined" && parseInt(apparatus[i].readings[j].text[k][thisMS+suffixes[a]].index)==wordNumber) {
							isThisApp=true; 
							currApp=i;
							while (k<apparatus[i].readings[j].text.length) {liveWords.push(parseInt(apparatus[i].readings[j].text[k++][thisMS+suffixes[a]].index))}
						}
					}
				}
			}
		}
	}
	if (isThisApp) {
		for (let m=0; m<apparatus[currApp].readings.length; m++) {
			if (apparatus[currApp].readings[m].text.length==0 && apparatus[currApp].readings[m].type=="lac")	{
				break;
			}
			//if it is an overlap .. treat specially
			if (typeof apparatus[currApp].readings[m].overlap_status!="undefined" && apparatus[currApp].readings[m].overlap_status=="duplicate") {
				//overlap .. gp get it and write it. First, get the lemma, in the first reading
				for (let b=0; b<structure.apparatus2.length; b++) {
					if (structure.apparatus2[b].start<=apparatus[currApp].start || apparatus[currApp].start<=structure.apparatus2[b].end) {
						let lemma="";  //first reading is the lemma
						for (let c=0; c<structure.apparatus2[b].readings[0].text.length; c++) {
							lemma+=structure.apparatus2[b].readings[0].text[c].interface+" ";
						}
						lemma+="[overlap]"; //other readings are overlapped
						for (let c=1; c<structure.apparatus2[b].readings.length;c++) {
							popApp+='<div class="popAppWordRow">'
							if (currMSinWits(structure.apparatus2[b].readings[c].witnesses, thisMS)) {
								popApp+='<span class="popAppWordRdg msRdg">'+lemma+":<br>";
							} else {
								popApp+='<span class="popAppWordRdg">'+lemma+":<br>";
							}
							for (let d=0; d<structure.apparatus2[b].readings[c].text.length; d++) {
								popApp+=structure.apparatus2[b].readings[c].text[d].interface+" ";
							}
							popApp+="</span>";
							popApp+='<span class="popAppWordNwits">'+structure.apparatus2[b].readings[c].witnesses.length+'</span>';
							popApp+='<span class="popAppWordWitsCont">';
							for (let p=0; p<structure.apparatus2[b].readings[c].witnesses.length; p++) {
								let isCurrMs=false;
								for (let a=0; a<suffixes.length && !isCurrMs; a++) {
									if (structure.apparatus2[b].readings[c].witnesses[p]==thisMS+suffixes[a]) isCurrMs=true;
								}
								if (isCurrMs) {
									popApp+='<span class="popAppWordWitsAny msRdg">'+structure.apparatus2[b].readings[c].witnesses[p]+' </span>';
								} else {
									popApp+='<span class="popAppWordWitsAny">'+structure.apparatus2[b].readings[c].witnesses[p]+' </span>';
								}
							}
							popApp+='</span>';
							popApp+="</div>";
						}
					}
				}
				break;
			}
			popApp+='<div class="popAppWordRow">';
			if (currMSinWits(apparatus[currApp].readings[m].witnesses, thisMS)) {
				popApp+='<span class="popAppWordRdg msRdg">';
			} else {
				popApp+='<span class="popAppWordRdg">';
			}
			//could be an omission!
			if (apparatus[currApp].readings[m].text.length==0 && apparatus[currApp].readings[m].type=="om" ) {
				popApp+='<hi rend="ital">Om.</hi></span>'
			} else {
				for (let n=0; n<apparatus[currApp].readings[m].text.length; n++) { 
					popApp+=apparatus[currApp].readings[m].text[n].interface;
					if (n<apparatus[currApp].readings[m].text.length-1) {
						popApp+=" ";
					} else {
						popApp+="</span>";
					}
				}
			}
			popApp+='<span class="popAppWordNwits">'+apparatus[currApp].readings[m].witnesses.length+'</span>';
			popApp+='<span class="popAppWordWitsCont">';
			for (let p=0; p<apparatus[currApp].readings[m].witnesses.length; p++) {
				let isCurrMs=false;
				for (let a=0; a<suffixes.length && !isCurrMs; a++) {
					if (apparatus[currApp].readings[m].witnesses[p]==thisMS+suffixes[a]) isCurrMs=true;
				}
				if (isCurrMs) {
					popApp+='<span class="popAppWordWitsAny msRdg">'+apparatus[currApp].readings[m].witnesses[p]+' </span>';
				} else {
					popApp+='<span class="popAppWordWitsAny">'+apparatus[currApp].readings[m].witnesses[p]+' </span>';
				}
			}
			popApp+='</span>';
			popApp+='</div>'; // end popAppWordRow	
		} //now exjt all loops
	}
	popApp+='</div>'; // end popAppWordCont
	popApp+="</div>"; //end pop app frame
	return ({popApp:popApp, liveWords: liveWords, currApp: currApp});
}

function hideCollation(event) {
//	$("w").removeClass("collLemma");
	$("w").removeClass("collLemmaText");
//	$("rdg").removeClass("collLemma");
}

function currMSinWits(witnesses, myMS) {
	for (let a=0; a<suffixes.length; a++) {
		if (witnesses.includes(myMS+suffixes[a])) {
			return true;
		}
	}
	return false;
}

function setUpCollation (myColl, collateables, callback) {
    return function(data, textStatus, jqXHR) {
        // do something with extraStuff
		let apparatusJS=JSON.parse(data);
		//could be multiple collateables on this page...
		for (let i=0; i<collateables.length; i++) {
			//add identifier to collateable to retrieve later
			$(collateables[i]).attr("data-collateable", myColl.match);
			let words = $(collateables[i]).find("w");
			for (let j=0; j<words.length; j++) {
				let wordn=+$(words[j]).attr("n");
				$(words[j]).addClass("showTip Coll-"+myColl.match+"-"+wordn);
				let popUpCollation=getPopUpCollation(myColl, wordn, 0,apparatusJS);
				$(words[j]).attr("data-from", popUpCollation.liveWords[0]);
				$("#popUps").append("<div id='Coll-"+myColl.match+"-"+wordn+"'><p class='commPopUp'>"+popUpCollation.popApp+"</p></div>")
				if (popUpCollation.liveWords.length==1) {
					$(words[j]).attr("data-to",popUpCollation.liveWords[0]);
					$(words[j]).mouseover(hoverPopUp);
					$(words[j]).mouseout(unHoverPopUp);
				} else { //next few words have same apparatus .. just copy that apparatus to those words
					$(words[j]).attr("data-to",popUpCollation.liveWords[popUpCollation.liveWords.length-1]);
					for (let k=1; k<popUpCollation.liveWords.length; k++) {
						$(words[++j]).addClass("showTip Coll-"+myColl.match+"-"+wordn); //just use the same div 
						$(words[j]).attr("data-from", popUpCollation.liveWords[0]);
						$(words[j]).attr("data-to",popUpCollation.liveWords[popUpCollation.liveWords.length-1]);
						$(words[j]).mouseover(hoverPopUp);
//						$(words[j]).mouseout(unHoverPopUp);
					}
				}
				adjustPopUp(popUpCollation.liveWords, parseInt($(words[words.length-1]).attr("n")), "Coll-"+myColl.match+"-"+wordn, myColl.match);
			}
		}
        callback();
    };
}

function unHoverPopUp() {
	$("w").removeClass("collLemmaText");
}

function hoverPopUp () {
	hideCollation(null);
	let from=parseInt($(this).attr("data-from"));
	let to=parseInt($(this).attr("data-to"));
	for (let i=from; i<=to+1; i+=2 ) {
		$(this).parent().find("w[n="+i+"]").addClass("collLemmaText")
	}
}

function formatFromTo(from, to) {
	let start=from.split(":");
	for (let i=0; i<start.length; i++) {
		start[i]=start[i].slice(start[i].indexOf("=")+1);
	}
	let startStr="";
	for (let j=0; j<start.length; j++) {
		startStr+=start[j];
		if (j<start.length-1) startStr+=" ";
	}
	if (to=="") {
		return (startStr);
	} else {
		let end=to.split(":")
		for (let i=0; i<end.length; i++) {
				end[i]=end[i].slice(end[i].indexOf("=")+1)
		}
		for (let i=0; i<start.length; i++) {
			if (start[i]==end[i]) {
				continue;
			} else {
				let endStr="";
				for (let j=i; j<start.length; j++) {
					endStr+=end[j];
					if (j<end.length-1) endStr+=" ";
				}
				return(startStr+"-"+endStr)
			}
		}
	}
}

function getImageInf() {
	$('#OAstatement').css("height", "auto");
	var imageInfo="<a href='javascript:$(\"#imageInf\").hide();resizeRTable()'><img src='../../../common/images/close.png'></img></a> Image of folio "+thisPage+" in "+manuscripts[thisMS].id +" "+ manuscripts[thisMS].permission;
	$('#imageInf').html(imageInfo);
	$('#imageInf').show();
	resizeRTable();
}

function getTranscriptInf() {
	$('#OAstatement').css("height", "auto");
	$('#transcriptInf').show();
	resizeRTable();
}


function formatDate(rawdate) {
    var date = new Date(rawdate);
    var options = {
    year: "numeric", month: "short",
    day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false
    };
    return date.toLocaleTimeString("en-us", options);
}

function openCommentary(which) {
	if ($("#OAstatement").is(':visible') && $("#rTable").is(':visible')) {
		$("#rTable").hide();
		$("#OAstatement").hide();
		currView="Transcript";
	}
	$("#ancillaries").show();
	$("#editorial").show();	
}

function closeAncillary() {
	$("#ancillaries").hide();
	$("#editorial").hide();	
	if (currView=="Transcript") {
		$("#rTable").show();
		$("#OAstatement").show();
		currView="";
	}
}

function doCommentaries() {
	let myComms=pageEntities.filter(ms=>ms.witness==thisMS)[0].entities.filter(page=>page.page==thisPage&&page.hasCommentary)
	if (myComms.length>0) {
		async.mapSeries(myComms, function (myComm, callback) {
			var topMatch=myComm.match.split("_")[0];
			$.get("../../commentary/"+topMatch+"/"+myComm.match+".js", doCommentary(myComm, callback),"json")
		});
	}
}



function setupCollations(){
	let myColls=pageEntities.filter(ms=>ms.witness==thisMS)[0].entities.filter(page=>page.page==thisPage&&page.hasCollation);
	async.mapSeries(myColls, function (myColl, callback){
		let collEnts=myColl.match.split("_");
		let fileLabel="";
		let searchStr="";
		for (let j=0; j<collEnts.length;j++) {
			searchStr+="[n='"+collEnts[j]+"']";
			fileLabel+=collEnts[j];
			if (j<collEnts.length-1) {
				searchStr+=" ";
				fileLabel+="_";
			}
		}
		let collateables=$(searchStr);
		//remove  collateables which are w elements! 
		for (let i=0; i<collateables.length; i++) {
			if ($(collateables[i]).prop('nodeName')=="W") {
				collateables.splice(i,1);
				i--;
			}
		}
		$.get("../../../html/collation/"+collEnts[0]+"/"+fileLabel+".js",setUpCollation(myColl, collateables, callback),"json")
	});
}

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
