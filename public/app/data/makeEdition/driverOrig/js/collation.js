var structure={};  //we can't pass this as a parameter from javascript calls within the interface

function setUpCollation (event) {
	//find the ancestor which has data-tce attribute
//	let entity=$(this).parents("[data-tce]")[]
	let entity =$($($(this)).parents(["data-tce"])[0]).attr("data-tce")
	let wordNumber=parseInt($(this).attr("n"));
	if (typeof entity!="undefined") {
		$("#tipDiv").show();
		showMECollation(entity, wordNumber);
	} else {
		$("#tipDiv").hide();
	}
/*	let lineNum=$(this).parents("l").attr("n");
	let taleSpec=$(this).parents("div").attr("n");
	let tSpec=taleSpec;
	if (!isNaN(taleSpec[0])) tSpec="_"+taleSpec;
	let wordNumber=parseInt($(this).attr("n"));
	if (typeof MakeEdition!="undefined") {
		showCollation(lineNum, taleSpec, wordNumber);
	} else {
		if (currEntities.filter(entity=>entity.val==tSpec).length==0) {
			setTimeout(function () {
				$("div#tipDiv").html("No collation available for "+allEntities.filter(entity=>entity.val==tSpec)[0].name + " in this publication");
			}, 25);
			return;
		} else {
			$("#tale").val(tSpec);
			$("#line").val(lineNum);	
			showCollation(lineNum, taleSpec, wordNumber);
		}
	} */
}

function getPopMELinks (element) {
	var links={};
	links.prevLine=$(element).prevAll("[data-tce]").first().attr("data-tce");
	links.nextLine=$(element).nextAll("[data-tce]").first().attr("data-tce");
//	links.prevTale=links.nextTale=$(element).parents("div").attr("n");
	links.word=$(element).attr("n");
	return links;
}

function getPopLinks (element) {
	var links={};
	links.prevLine=$(element).prevAll("l").first().attr("n");
	links.nextLine=$(element).nextAll("l").first().attr("n");
	links.prevTale=links.nextTale=$(element).parents("div").attr("n");
	links.word=$(element).attr("n");
	if (!links.prevLine) {
		links.prevTale=$(element).parents("div").prev("div").attr("n");
		if (!links.prevTale) {} else {
			links.prevLine=$(element).parents("div").prev("div").children("l").last().attr("n");
		}
	}
	if (!links.nextLine) {
		links.nextTale=$(element).parents("div").next("div").attr("n");
		if (!links.nextTale) { } else {
			links.nextLine=$(element).parents("div").next("div").children("l").first().attr("n");
		}
	}
	return links;
}


function getPopUpCollation(lineNumber, taleName, wordNumber, appNumber) {
	let line=$("div[n="+taleName+"]").find("l[n="+lineNumber+"]");
	let links=getPopLinks(line);
	let popApp='';
	currLine=lineNumber;  //leave as string
	currTale=taleName;
	hideCollation(null);
	popApp+='<div id="popAppFrame">'
	popApp+='<span id="popAppTitle">';
	if (!links.prevLine) { popApp+="<span>&nbsp;</span>"} else {
		popApp+='<a href="javascript:showCollation(\''+links.prevLine+'\',\''+links.prevTale+'\',\'2\')">';
		popApp+='<img src="http://www.inklesseditions.com/TCR/images/iconPrev.png" height="16px"/></a>'
	}
	popApp+="<span>"+taleName+", "+lineNumber+"</span>";
	if (!links.nextLine) { popApp+="<span>&nbsp;</span>"} else {
		popApp+='<a href="javascript:showCollation(\''+links.nextLine+'\',\''+links.nextTale+'\',\'2\')">';
		popApp+='<img src="http://www.inklesseditions.com/TCR/images/iconNext.png" height="16px"/></a>'
	}
	popApp+="</span>";
	let apparatus=structure.apparatus;
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
				if (currMSinWits(readings[j].witnesses, currMS)) {
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
	let lastMsWord=parseInt($("div[n="+taleName+"] l[n="+lineNumber+"]").find("w").last().attr("n"));
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
				if (typeof apparatus[currApp].readings[j].SR_text!="undefined" && typeof apparatus[currApp].readings[j].SR_text[currMS+suffixes[a]]!="undefined") {
					for (let k=0; k<apparatus[currApp].readings[j].SR_text[currMS+suffixes[a]].text.length; k++) {
						liveWords.push(parseInt(apparatus[currApp].readings[j].SR_text[currMS+suffixes[a]].text[k][currMS+suffixes[a]].index))
					}
				}
				for (let k=0; k< apparatus[currApp].readings[j].text.length; k++) {
					if (typeof apparatus[currApp].readings[j].text[k][currMS+suffixes[a]]!="undefined") {
						liveWords.push(parseInt(apparatus[currApp].readings[j].text[k][currMS+suffixes[a]].index));
					}
				}
			}
		}
	}
	for (let i=0; i < apparatus.length  && !isThisApp; i++) {  //this section needed to find which app has highlighted words
		for (let j=0; j<apparatus[i].readings.length && !isThisApp; j++) {
			//could be SR_text reading...
			for (let a=0; a<suffixes.length && !isThisApp; a++) {
				if (typeof apparatus[i].readings[j].SR_text!="undefined" && typeof apparatus[i].readings[j].SR_text[currMS+suffixes[a]]!="undefined") {
					for (let k=0; k<apparatus[i].readings[j].SR_text[currMS+suffixes[a]].text.length && !isThisApp; k++) {
						if (parseInt(apparatus[i].readings[j].SR_text[currMS+suffixes[a]].text[k][currMS+suffixes[a]].index) == wordNumber) {
							isThisApp=true;
							currApp=i;
							while (k<apparatus[i].readings[j].SR_text[currMS+suffixes[a]].text.length) {liveWords.push(parseInt(apparatus[i].readings[j].SR_text[currMS+suffixes[a]].text[k++][currMS+suffixes[a]].index))}
						}
					}
				}
			}
			//not SR_text reading..
			if (!isThisApp) {
				for (let a=0; a<suffixes.length && !isThisApp; a++) {
					for (let k=0; k< apparatus[i].readings[j].text.length && !isThisApp; k++) {
						if (typeof apparatus[i].readings[j].text[k][currMS+suffixes[a]]!="undefined" && parseInt(apparatus[i].readings[j].text[k][currMS+suffixes[a]].index)==wordNumber) {
							isThisApp=true; 
							currApp=i;
							while (k<apparatus[i].readings[j].text.length) {liveWords.push(parseInt(apparatus[i].readings[j].text[k++][currMS+suffixes[a]].index))}
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
							if (currMSinWits(structure.apparatus2[b].readings[c].witnesses, currMS)) {
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
									if (structure.apparatus2[b].readings[c].witnesses[p]==currMS+suffixes[a]) isCurrMs=true;
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
			if (currMSinWits(apparatus[currApp].readings[m].witnesses, currMS)) {
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
					if (apparatus[currApp].readings[m].witnesses[p]==currMS+suffixes[a]) isCurrMs=true;
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
	return ({popApp:popApp, liveWords: liveWords, lastMsWord: lastMsWord, currApp: currApp});
}

//from within dialog box
function showPopUpCollation (lineNumber, taleName, wordNumber, appNumber) {
	let apparatus=getPopUpCollation(lineNumber, taleName, parseInt(wordNumber), appNumber);
	$("div#tipDiv").html(apparatus.popApp);  //write direct to initialized popup holder
	adjustPopUp(apparatus.liveWords, apparatus.lastMsWord, apparatus.currApp);
}

function showMECollation (myEntity, wordNumber) {
	let element=popCollations.filter(entity=>entity.entity==myEntity)[0];
	structure=element.collation.structure;
	showPopUpMECollation (myEntity, parseInt(wordNumber), 0);
}

function showPopUpMECollation (myEntity, wordNumber, appNumber) {
	let apparatus=getPopUpMECollation(myEntity, parseInt(wordNumber), appNumber);
	$("#tipDiv").is(':visible');
	setTimeout(function(){
		$("div#tipDiv").html(apparatus.popApp);  //write direct to initialized popup holder
		adjustMEPopUp(apparatus.liveWords, apparatus.lastMsWord, apparatus.currApp, myEntity);
	}, 20);
}

function getPopUpMECollation(myEntity, wordNumber, appNumber) {
	let line=$("[data-tce='"+myEntity+"']");
	let links=getPopMELinks(line);
	let popApp='';
	hideCollation(null);
	popApp+='<div id="popAppFrame">'
	popApp+='<span id="popAppTitle">';
	if (!links.prevLine) { popApp+="<span>&nbsp;</span>"} else {
		popApp+='<a href="javascript:showMECollation(\''+links.prevLine+'\',\'2\')">';
		popApp+='<img src="http://www.inklesseditions.com/TCR/images/iconPrev.png" height="16px"/></a>'
	}
	popApp+="<span>"+myEntity+"</span>";
	if (!links.nextLine) { popApp+="<span>&nbsp;</span>"} else {
		popApp+='<a href="javascript:showMECollation(\''+links.nextLine+'\',\'2\')">';
		popApp+='<img src="http://www.inklesseditions.com/TCR/images/iconNext.png" height="16px"/></a>'
	}
	popApp+="</span>";
	let apparatus=structure.apparatus;
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
				if (currMSinWits(readings[j].witnesses, currMS)) {
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
	let lastMsWord=parseInt($(line).find("w").last().attr("n"));
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
				if (typeof apparatus[currApp].readings[j].SR_text!="undefined" && typeof apparatus[currApp].readings[j].SR_text[currMS+suffixes[a]]!="undefined") {
					for (let k=0; k<apparatus[currApp].readings[j].SR_text[currMS+suffixes[a]].text.length; k++) {
						liveWords.push(parseInt(apparatus[currApp].readings[j].SR_text[currMS+suffixes[a]].text[k][currMS+suffixes[a]].index))
					}
				}
				for (let k=0; k< apparatus[currApp].readings[j].text.length; k++) {
					if (typeof apparatus[currApp].readings[j].text[k][currMS+suffixes[a]]!="undefined") {
						liveWords.push(parseInt(apparatus[currApp].readings[j].text[k][currMS+suffixes[a]].index));
					}
				}
			}
		}
	}
	for (let i=0; i < apparatus.length  && !isThisApp; i++) {  //this section needed to find which app has highlighted words
		for (let j=0; j<apparatus[i].readings.length && !isThisApp; j++) {
			//could be SR_text reading...
			for (let a=0; a<suffixes.length && !isThisApp; a++) {
				if (typeof apparatus[i].readings[j].SR_text!="undefined" && typeof apparatus[i].readings[j].SR_text[currMS+suffixes[a]]!="undefined") {
					for (let k=0; k<apparatus[i].readings[j].SR_text[currMS+suffixes[a]].text.length && !isThisApp; k++) {
						if (parseInt(apparatus[i].readings[j].SR_text[currMS+suffixes[a]].text[k][currMS+suffixes[a]].index) == wordNumber) {
							isThisApp=true;
							currApp=i;
							while (k<apparatus[i].readings[j].SR_text[currMS+suffixes[a]].text.length) {liveWords.push(parseInt(apparatus[i].readings[j].SR_text[currMS+suffixes[a]].text[k++][currMS+suffixes[a]].index))}
						}
					}
				}
			}
			//not SR_text reading..
			if (!isThisApp) {
				for (let a=0; a<suffixes.length && !isThisApp; a++) {
					for (let k=0; k< apparatus[i].readings[j].text.length && !isThisApp; k++) {
						if (typeof apparatus[i].readings[j].text[k][currMS+suffixes[a]]!="undefined" && parseInt(apparatus[i].readings[j].text[k][currMS+suffixes[a]].index)==wordNumber) {
							isThisApp=true; 
							currApp=i;
							while (k<apparatus[i].readings[j].text.length) {liveWords.push(parseInt(apparatus[i].readings[j].text[k++][currMS+suffixes[a]].index))}
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
							if (currMSinWits(structure.apparatus2[b].readings[c].witnesses, currMS)) {
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
									if (structure.apparatus2[b].readings[c].witnesses[p]==currMS+suffixes[a]) isCurrMs=true;
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
			if (currMSinWits(apparatus[currApp].readings[m].witnesses, currMS)) {
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
					if (apparatus[currApp].readings[m].witnesses[p]==currMS+suffixes[a]) isCurrMs=true;
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
	return ({popApp:popApp, liveWords: liveWords, lastMsWord: lastMsWord, currApp: currApp});
}

function showCollation ( lineNumber, taleName, wordNumber) {
	//get the collation...
	var type="line";
	if (lineNumber=="Title" && taleName=="129") type="head";
	
/*	$.get( TCurl+"/uri/urn:det:tc:usask:"+community+"/entity="+taleName+":"+type+"="+lineNumber+"?type=apparatus&format=approved")
		.done (function(json) {
		structure=JSON.parse(json).structure;
		showPopUpCollation (lineNumber, taleName, parseInt(wordNumber), 0);
		})
		.fail (function( jqXHR, textStatus, errorThrown ) {
//        console.log(jqXHR);
//        console.log(textStatus);
//        console.log(errorThrown );
    }); */
}

function currMSinWits(witnesses, myMS) {
	for (let a=0; a<suffixes.length; a++) {
		if (witnesses.includes(myMS+suffixes[a])) {
			return true;
		}
	}
	return false;
}

function adjustMEPopUp(liveWords, lastMsWord, currApp, myEntity) {
	for (let i=0; i<liveWords.length; i++) {
	
		$("[data-tce='"+myEntity+"'] w[n="+liveWords[i]+"]").addClass("collLemmaText");
	}
	if (currApp<structure.apparatus.length-1) {
		$("#nextPopAppWord").html('<a href="javascript:showPopUpMECollation(\''+myEntity+'\',\'-1\',\''+(currApp+1)+'\')">\
			&nbsp;&nbsp;<img src="http://www.inklesseditions.com/TCR/images/iconNext.png" height="16px"/></a>');
	} else {
		$("#nextPopAppWord").html("&nbsp;");
	}
	if (currApp>0) {
		$("#prevPopAppWord").html('<a href="javascript:showPopUpMECollation(\''+myEntity+'\',\'-1\',\''+(currApp-1)+'\')">\
			<img src="http://www.inklesseditions.com/TCR/images/iconPrev.png" height="16px"/>&nbsp;&nbsp;</a>');
	} else {
		$("#prevPopAppWord").html("&nbsp;");
	}
	let readings=$(".popAppWordRdg");
	let width=0;
	for (let i=0; i<readings.length; i++) {
		let thisWidth=getTextSize($(readings[i]).html(), 12);
		if (thisWidth>width) width=thisWidth;
	}
	$(readings).css("flex-basis", (width)+"px");
	let popHeight=$("#tipDiv").height();
	let allHeight=$("#whole").height();
	let topPop=$("#tipDiv").position().top;
	let lineTop=$("[data-tce='"+myEntity+"']").position().top;
	if (topPop+popHeight>allHeight) {
		$("#tipDiv").css({top:(lineTop-popHeight+50)+"px"})
	}
	//figure out where the top of the tipdiv is; figure out it's height; move accordingly to keep 
}

function adjustPopUp(liveWords, lastMsWord, currApp) {
	for (let i=0; i<liveWords.length; i++) {
		$("div[n='"+currTale+"'] l[n="+currLine+"] w[n="+liveWords[i]+"]").addClass("collLemmaText");
	}
	if (currApp<structure.apparatus.length-1) {
		$("#nextPopAppWord").html('<a href="javascript:showPopUpCollation(\''+currLine+'\',\''+currTale+'\',\'-1\',\''+(currApp+1)+'\')">\
			&nbsp;&nbsp;<img src="http://www.inklesseditions.com/TCR/images/iconNext.png" height="16px"/></a>');
	} else {
		$("#nextPopAppWord").html("&nbsp;");
	}
	if (currApp>0) {
		$("#prevPopAppWord").html('<a href="javascript:showPopUpCollation(\''+currLine+'\',\''+currTale+'\',\'-1\',\''+(currApp-1)+'\')">\
			<img src="http://www.inklesseditions.com/TCR/images/iconPrev.png" height="16px"/>&nbsp;&nbsp;</a>');
	} else {
		$("#prevPopAppWord").html("&nbsp;");
	}
	let readings=$(".popAppWordRdg");
	let width=0;
	for (let i=0; i<readings.length; i++) {
		let thisWidth=getTextSize($(readings[i]).html(), 12);
		if (thisWidth>width) width=thisWidth;
	}
	$(readings).css("flex-basis", (width)+"px");
	let popHeight=$("#tipDiv").height();
	let allHeight=$("#whole").height();
	let topPop=$("#tipDiv").position().top;
	let lineTop=$("div[n="+currTale+"] l[n='"+currLine+"']").position().top;
	if (topPop+popHeight>allHeight) {
		$("#tipDiv").css({top:(lineTop-popHeight+50)+"px"})
	}
	//figure out where the top of the tipdiv is; figure out it's height; move accordingly to keep 
}

function hideCollation(event) {
//	$("w").removeClass("collLemma");
	$("w").removeClass("collLemmaText");
//	$("rdg").removeClass("collLemma");
}

//here after, what is needed to display the whole collation
function getCollationLine(line, onlyReg, words) {
	//get values for onlyReg, etc, from interface
	currLine=line;
	$("#line").val(currLine);
	getChoice(onlyReg, words, "Collation");
}

//called from other views...
function getCollation(onlyReg, words) {
	//get values for onlyReg, etc, from interface
	setUpVMap();
	getChoice(onlyReg, words, "Collation");
}

function changeCollation() {
	if ($('#spellingBox').is(":checked")) {
		if ($('#wordsBox').is(":checked")) {
			getChoice(false, true, "Collation");
		} else {
			getChoice(false, false, "Collation");
		}
		$("#spellingSpan").show();
	} else {
		getChoice(true, false, "Collation");
		$("#spellingSpan").hide();
	}
}

function getCollationVB(myTale, myLine) {
	$("#tale").val(myTale);
	$("#line").val(myLine);
	getChoice(true, false, "Collation");
}

function getChoice(onlyReg, words, context) {
	currTale=$("#tale").val();
	currMS=$("#MS").val();
	currLine=$("#line").val();
	$.get(TCurl+"/uri/urn:det:tc:usask:CTP2/entity="+currTale+":line="+currLine+"?type=apparatus&format=xml/positive", function (apparatus) {
		$("#searchVBase").hide()
		$("#splash").hide()
		$("#rTable").css("display","flex")
		$('#collationFrame').show();
		$('compareFrame').hide();
		$('#transcriptFrame').hide();
		$('#OAstatement').hide();	
		$('#collationText').empty();  
		$('#collation').css("margin", "20");
		initializeTranscript();
		makeAPP(apparatus, onlyReg, words, false);
	});
}

function resolveDuplicates(collation) { //needed because overlap readings can create a duplicate lemma
	for (var i=0; i<collation.structure.apparatus.length; i++) {
		for (var j=0; j<collation.structure.apparatus[i].readings.length; j++) {
			var origWord="";
			for (var m=0; m<collation.structure.apparatus[i].readings[j].text.length; m++) {
				origWord+=collation.structure.apparatus[i].readings[j].text[m].interface;
				if (m<collation.structure.apparatus[i].readings[j].text.length-1) origWord+=" ";
			}
			for (var k=j+1; k<collation.structure.apparatus[i].readings.length; k++) {
				var rdgWord="";
				for (var m=0; m<collation.structure.apparatus[i].readings[k].text.length; m++)  {
					rdgWord+=collation.structure.apparatus[i].readings[k].text[m].interface;
					if (m<collation.structure.apparatus[i].readings[k].text.length-1) rdgWord+=" ";
				}
				if (rdgWord==origWord) { //same lemma! collapse the two
					for (var n=0; n<collation.structure.apparatus[i].readings[k].witnesses.length; n++) {
						var thisWit=collation.structure.apparatus[i].readings[k].witnesses[n];
						collation.structure.apparatus[i].readings[j].witnesses.push(thisWit);
					}
					collation.structure.apparatus[i].readings[j].witnesses.sort();
					//now deal with each reading in the text structure
					for (var p=0; p<collation.structure.apparatus[i].readings[k].text.length; p++) {
						for (var q=0; q<collation.structure.apparatus[i].readings[k].text[p].reading.length; q++) {
							var thisWit=collation.structure.apparatus[i].readings[k].text[p].reading[q];
							collation.structure.apparatus[i].readings[j].text[p].reading.push(thisWit);
							collation.structure.apparatus[i].readings[j].text[p][thisWit]=collation.structure.apparatus[i].readings[k].text[p][thisWit];
						}
						collation.structure.apparatus[i].readings[j].text[p].reading.sort();
					}
					//delete the duplicate reading
					collation.structure.apparatus[i].readings.splice(k, 1);
					k--;
				}
			}
		}
	}
	return(collation);
}

//one call only to grab all the variants in this place
function setVMapColors(appno, id) {
	if (currTale=="L3") {
		var thisTale="CO"
	} else {
		var thisTale=currTale;
	}
	for (let i=0; i<currEntities.filter(entity=>entity.val==thisTale)[0].vMapWits.length; i++) {
		let thisMs=currEntities.filter(entity=>entity.val==thisTale)[0].vMapWits[i];
		$("#VMap-"+thisMs.name).hide();
	}
	if (UnivOnlyReg || (!UnivOnlyReg && UnivWords)) {
		for (var a=0; a<VMapApp[appno].variants.length; a++) {
			for (var i=0; i<VMapApp[appno].variants[a].wits.length; i++) {
				var thisMs=currEntities.filter(entity=>entity.val==thisTale)[0].vMapWits.filter(function (obj){return obj.name === VMapApp[appno].variants[a].wits[i];})[0];
				if (thisMs) {
					$("#VMap-"+thisMs.name).css({color:'#'+colors[a]});
					$("#VMap-"+thisMs.name).show()
				}
		//		else alert("Ms "+VMapApp[appno].variants[varno].wits[i]+" not found")
			}
		}
	}
	if (!UnivOnlyReg && !UnivWords) {
		var index=0;
		for (var a=0; a<VMapApp[appno].variants.length; a++) { 
			for (var b=0; b<VMapApp[appno].variants[a].spellings.length; b++) {
				for (var c=0; c<VMapApp[appno].variants[a].spellings[b].wits.length; c++) {
					var thisMs=currEntities.filter(entity=>entity.val==thisTale)[0].vMapWits.filter(function (obj){return obj.name === VMapApp[appno].variants[a].spellings[b].wits[c];})[0];
					if (thisMs) {
						$("#VMap-"+thisMs.name).css({color:'#'+colors[index]});
						$("#VMap-"+thisMs.name).show()
					}
				}
				index++;
			}
		}
	}
}

function populateVMapLine() {
		//should test for error
	colors=palette('mpn65', 2);
	if (currTale=="L3") {
		var thisTale="CO"
	} else {
		var thisTale=currTale;
	}
	for (var i=0; i<currWits.length; i++) {
		var thisMs=currEntities.filter(entity=>entity.val==thisTale)[0].vMapWits.filter(function (obj){return obj.name === currWits[i];})[0];
		if (thisMs) {
			$("#VMap-"+thisMs.name).css({color:'#'+colors[0]});
			$("#VMap-"+thisMs.name).show()
		}
//		else alert("Ms "+currWits[i]+" not found")
	}
	for (var i=0; i<outMSS.length; i++) {
		var thisMs=currEntities.filter(entity=>entity.val==thisTale)[0].vMapWits.filter(function (obj){return obj.name === outMSS[i];})[0];
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


function setUpVMap() {
	//open the image here
	if (currTale=="L3") {
		var thisTale="CO";
	} else {
		var thisTale=currTale;
	}
	$.get("/CT/common/images/stemmata/"+thisTale+"/info.json", function(source) {
		source.overlays=[];
		if (typeof currEntities.filter(entity=>entity.val==thisTale)[0].vMapWits=="undefined") {
			$.get(TCurl+"/uri/urn:det:tc:usask:"+community+"/vmap="+thisTale, function (vMap) {
				currEntities.filter(entity=>entity.val==thisTale)[0].vMapWits=JSON.parse(JSON.stringify(vMap.wits));  //probably need to deep copy this fella
				populateVMaps(source);
			});
		} else {
			populateVMaps(source);
		}
	});
}

function populateVMaps(source) {
	let vMapMss=[];
	if (currTale=="L3") {
		var thisTale="CO";
	} else {
		var thisTale=currTale;
	}
	for (let i=0; i<currEntities.filter(entity=>entity.val==thisTale)[0].vMapWits.length; i++) {
		let myMs=currEntities.filter(entity=>entity.val==thisTale)[0].vMapWits[i];
		vMapMss.push("<span class='vMapMs' id='VMap-"+myMs.name+"'>"+myMs.name+"</span>")
		source.overlays.push({id: "VMap-"+myMs.name, px:(myMs.x*4/3), py:(myMs.y*4/3), placement:"CENTER" })
	};
	$("#VMapIDs").html(vMapMss.join());
	if (viewer) viewer.open([source]);
	viewer.viewport.maxZoomPixelRatio=1;
	for (let i=0; i<currEntities.filter(entity=>entity.val==thisTale)[0].vMapWits.length; i++) {
		let thisMs=currEntities.filter(entity=>entity.val==thisTale)[0].vMapWits[i];
		$("#VMap-"+thisMs.name).hide();
	}
}



//in here we also construct an apparatus ready for use in Vmaps...
function makeAPP(apparatus, onlyReg, words, transform) { //if onlyReg false: show original spellings; transform: are we coming from transform
//we could cache the apparatus, as we do pages and images. But hardly worth it for overhead savings
	let thisMap=currTale;
	if (thisMap=="L3") thisMap="CO";
	if (typeof currEntities.filter(entity=>entity.val==thisMap)[0].vMapWits=="undefined") {
		$.get(TCurl+"/uri/urn:det:tc:usask:"+community+"/vmap="+thisMap, function (vMap) {
			currEntities.filter(entity=>entity.val==thisMap)[0].vMapWits=JSON.parse(JSON.stringify(vMap.wits));  //probably need to deep copy this fella
			setUpVMap();  //show the image
			doMakeAPP(apparatus, onlyReg, words, true, transform);
		});
	} else {
		doMakeAPP(apparatus, onlyReg, words, true, transform);
	}
}
	
function doMakeAPP(apparatus, onlyReg, words, hasVMap, transform, callback) { //if onlyReg false: show original spellings
	var inWits=[];
	currWits=[];
	outMSS=[];
	VMapApp=[];
	$("#collSummary").html("<b>"+currEntities.filter(entity=>entity.val==currTale)[0].name+", "+currLine+"</b>	");
//	if (!hasVMap) $("#collation").css("margin", "20px");
//	else $("#collation").css("margin", "0px");
//	$.get(TCurl+"/uri/urn:det:tc:usask:CTP/entity=Miller:div="+entities[currentEntity].name+":line="+currLine+"?type=apparatus&format=approved", function (fullApp) {
	$.get(TCurl+"/uri/urn:det:tc:usask:"+community+"/entity="+currTale+":line="+currLine+"?type=apparatus&format=approved")
		.done (function (fullApp) {
		var collation=JSON.parse(fullApp);
		//there could be duplicate readings, a by-product of overlapping variants. Resolve them.
		//we are loading both the xml and the json app. No need to have both, really
		collation=resolveDuplicates(collation);
		let appText="";
		if (!transform) {
			var cindex=collEnts[currTale].indexOf(currLine);
			var prevLink="";
			if (cindex>0) {
				prevLink="<span id='prevlink'><a class='cla' href='javascript:getCollationLine(\""+collEnts[currTale][cindex-1]+"\","+onlyReg+","+words+")'><img class='cli' src='/TCR/images/iconPrev.png' height='24'> "+collEnts[currTale][cindex-1]+"</a> </span>"
			} else {
				prevLink="<span></span>";
			}
			var nextLink="";
			if (cindex<collEnts[currTale].length-1) {
				nextLink="<span id='nextlink'> <a  class='cla' href='javascript:getCollationLine(\""+collEnts[currTale][cindex+1]+"\","+onlyReg+","+words+")'>"+collEnts[currTale][cindex+1]+' <img class="cli" src="/TCR/images/iconNext.png" height="24"></a> </span>'
			} else {
				nextLink="<span></span>";
			}
			$("#prevColl").html(prevLink);
			$("#nextColl").html(nextLink);
			window.history.replaceState(null, null, "?entity="+currTale+"&line="+currLine+"&view=collation&onlyReg="+onlyReg+"&words="+words);
			apparatus=apparatus.replace(/&lt;/g,"<");
			if (!hasVMap) {
				$('#collation').html(apparatus);
				var apps= $('#collation app');
			}
			else {
				$('#collationText').html(apparatus);
				var apps= $('#collationText app');
			}
			//deal with the first app, to get wits with this line etc
			var firstApp=$(apps[0]);
			var firstRdg=firstApp.find('rdg')[0];
			if ($(firstRdg).attr('type')!="lac") alert("First reading should list out mss...")
			for (var k=0; k<eval(currTale+"mss").length; k++) {
				currWits.push(eval(currTale+"mss")[k].name);
			}
			var wit=$(firstRdg).children()[0];
			var wits=$(wit).children();
			for (var k=0; k<wits.length; k++) {
				var thisWit=$(wits[k]).text();
				var a = currWits.indexOf(thisWit);  //is the wit in the lac? then it has the entity but not this line
				if (a!=-1) {
					outMSS.push(thisWit)
					var b = currWits.indexOf(thisWit);
					currWits.splice(b, 1);
				}
			}
			for (var m=0; m<currWits.length; m++) {
				inWits.push("<a href='javascript:getMSLine(\""+currLine+"\",\""+currWits[m]+"\")'>"+currWits[m]+"</a>");
			}
			appText+="<div id='VMLine'><p class='lemma'>Line "+currLine+" is in "+currWits.length+" witnesses ("+inWits.join(" ")+")</p>" ;
			if (outMSS.length==1) appText+="<p class='lemma' id='VMLout'> OUT 1 witness ("+outMSS[0]+")</p>";
			else if (outMSS.length>1) appText+="<p class='lemma'  id='VMLout'> OUT "+outMSS.length+" witnesses ("+outMSS.join(" ")+")</p>";
			appText+="</div><hr/>";
		}
		//ok. There are faults in the way the XML apparatus does things on overlaps etc. So we go into the json apparatus
		 //this is the lemma
		if (onlyReg) {
			for (var i=0, n=0; i<collation.structure.apparatus.length; i++, n++) { //need m as overlap variants also occur
				VMapApp.push({lemma:"", variants:[]});
				VMapApp[n].variants.push({variant:"[lemma]", id: ""+n+"-0", wits:[]});
				var overLem="";
				for (var j=0; j<collation.structure.apparatus[i].readings.length; j++) {
					//lemma is always first reading..
					var vartext="";
					if (!(collation.structure.apparatus[i].readings[j].created || collation.structure.apparatus[i].readings[j].overlap_status=="duplicate")) {
						for (k=0; k<collation.structure.apparatus[i].readings[j].text.length; k++) {
							vartext+=collation.structure.apparatus[i].readings[j].text[k].interface;
							if (k<collation.structure.apparatus[i].readings[j].text.length-1) vartext+=" ";
						}
						if (j==0) {
							appText+="<div class='VMAdiv' id='VMAdiv"+n+"' data-n='"+n+"'><p class='lemma'><span data-n='"+n+"-"+j+"'>"+vartext+" ";
							VMapApp[n].lemma=vartext;
							overLem=vartext;
						}
						else if (collation.structure.apparatus[i].readings[j].type=="om" || collation.structure.apparatus[i].readings[j].type=="om_verse") {
							appText+="<p class='variant'><span data-n='"+n+"-"+j+"'><i>Omitted</i> ";
							VMapApp[n].variants.push({variant:"<p class='variant'><i>Omitted</i> ", id: ""+n+"-"+j, wits:[]});
						} else {	
							appText+="<p class='variant'><span data-n='"+n+"-"+j+"'>"+vartext+" "; 
							VMapApp[n].variants.push({variant:vartext, id: ""+n+"-"+j, wits:[]});
						}
						var nwits=collation.structure.apparatus[i].readings[j].witnesses.length;	
						if (collation.structure.apparatus[i].readings[j].type=="om" || collation.structure.apparatus[i].readings[j].type=="om_verse") {
						  //omitted include lac also. So filter by presence in inwits and - indicating mod orig etc
						   nwits=0;
						   for (var m=0; m<collation.structure.apparatus[i].readings[j].witnesses.length; m++) {
						   		var thisWit=collation.structure.apparatus[i].readings[j].witnesses[m];
						   		if (currWits.includes(thisWit) || thisWit.indexOf("-")!=-1) {
						   			appText+="<a href='javascript:getMSLine(\""+currLine+"\",\""+thisWit+"\")'>"+thisWit+"</a> ";
						   			VMapApp[n].variants[j].wits.push(thisWit);
						   			nwits++;
						   		}  
						   }
						} else {
							for (var m=0; m<collation.structure.apparatus[i].readings[j].witnesses.length; m++) {
								var thisWit=collation.structure.apparatus[i].readings[j].witnesses[m];
								if (thisWit=="Base") nwits--;
								else {
									appText+="<a href='javascript:getMSLine(\""+currLine+"\",\""+thisWit+"\")'>"+thisWit+"</a> ";
									VMapApp[n].variants[j].wits.push(thisWit);
								}
							}
						}
						appText+="("+nwits+")";
					} 
				}
				//deal with overlapping variants. Really effing tricky
				//found a much simpler way of dealing with it!!!
		//		if (collation.structure.apparatus[i].overlap_units) { //extract...go through keys to get mss and variants etc
				if (collation.structure.hasOwnProperty("apparatus2"))  {
					var iO=-1;
					//check we have an entry with a start associating with this word..
					for (let x=0; x<collation.structure.apparatus2.length; x++) {
						if (collation.structure.apparatus2[x].start==collation.structure.apparatus[i].start) iO=x;
					}
					if (iO!=-1) { 
						var overWits=[];   
						overLem="";
						//far simpler!!! get lemma first. This will be the first reading found
						for (let x=0; x<collation.structure.apparatus2[iO].readings[0].text.length; x++) {
							overLem+=collation.structure.apparatus2[iO].readings[0].text[x].interface;
							if (x<collation.structure.apparatus2[iO].readings[0].text.length-1) overLem+=" ";
						}
						//now populate the overWits structure
						for (let x=1; x<collation.structure.apparatus2[iO].readings.length; x++) {
//							overWits.push({text:"", wits:[]})
							var OWT="";
							var OWW=collation.structure.apparatus2[iO].readings[x].witnesses;
							for (let y=0; y<collation.structure.apparatus2[iO].readings[x].text.length; y++) {
								OWT+=collation.structure.apparatus2[iO].readings[x].text[y].interface;
								if (y<collation.structure.apparatus2[iO].readings[x].text.length-1) OWT+=" ";
							}
							overWits.push({text:OWT, wits:OWW})
						}
						n++;
						appText+="</div><div class='VMAdiv' id='VMAdiv"+n+"' data-n='"+n+"'><p class='lemma'>"+overLem+" (<i>overlapping</i>)</p>";
						VMapApp.push({lemma:"OVERLAP", variants:[{variant: overLem, wits:["Base"]}]});
						 //deal with overlapping variants now...
						for (let x=0; x<overWits.length; x++) {
							appText+="<p class='variant'><span data-n='"+n+"-"+j+"'>"+overWits[x].text+" ";
							VMapApp[n].variants.push({variant:overWits[x].text, wits:[]});
							for (let y=0; y<overWits[x].wits.length; y++) {
								appText+="<a href='javascript:getMSLine(\""+currLine+"\",\""+overWits[x].wits[y]+"\")'>"+overWits[x].wits[y]+"</a> ";
								VMapApp[n].variants[x].wits.push(overWits[x].wits[y]);
							}
							appText+="("+overWits[x].wits.length+")</span></p>";
						}		
					}
				}
				appText+="</div>"
			}
		}
		if (!onlyReg && !words) { //work direct from JSON full app. Here we treat overlapped apps differently
			var vartext="";
			if (transform) {
				appText='<ab n="CTP2:entity='+entities[currentEntity].name+':line='+currLine+'-APP">';
			}
			for (var i=0, n=0; i<collation.structure.apparatus.length; i++, n++) {
				if (transform) {
					rdgNo=0;
					appText+='<app from="'+((i+1)*2)+'" n="CTP2:entity='+entities[currentEntity].name+':line='+currLine+'" to="'+((i+1)*2)+ '" type="main">';
				} else {
					appText+="<div class='VMAdiv' id='VMAdiv"+n+"' data-n='"+n+"'>";
				}
				VMapApp.push({lemma:"", variants:[]});
				for (var j=0; j<collation.structure.apparatus[i].readings.length; j++) {
					if (collation.structure.apparatus[i].readings[j].created) continue;
					if ((collation.structure.apparatus[i].readings[j].type=="om" || collation.structure.apparatus[i].readings[j].type=="om_verse") && collation.structure.apparatus[i].readings[j].overlap_status!="duplicate") {
						if (!transform) {
							appText+="<p class='variant'><i>omitted</i> "
						}
						VMapApp[n].variants.push({variant:"<p class='variant'><span data-n='"+n+"-"+j+"'><i>Omitted</i> ", spellings:[{spelling: "omitted", wits:[]}]});
						for (var m=0; m<collation.structure.apparatus[i].readings[j].witnesses.length; m++) {
							var thisWit=collation.structure.apparatus[i].readings[j].witnesses[m];
							if (currWits.includes(thisWit) || thisWit.indexOf("-")!=-1) {
								if (!transform) {
									appText+="<a href='javascript:getMSLine(\""+currLine+"\",\""+thisWit+"\")'>"+thisWit+"</a> ";
								}
								VMapApp[n].variants[j].spellings[0].wits.push(thisWit);
							}  
					   }
					} else {
						vartext="";
						for (k=0; k<collation.structure.apparatus[i].readings[j].text.length; k++) {
							vartext+=collation.structure.apparatus[i].readings[j].text[k].interface;
							if (k<collation.structure.apparatus[i].readings[j].text.length-1) vartext+=" ";
						}
						if (j==0) {
							if (!transform) {
								appText+="<p class='lemma'>"+vartext+" ";
								//note: we collapse all the variants into one app when outputting by spelling
							}
							VMapApp[n].lemma=vartext;
							VMapApp[n].variants.push({variant:"[lemma]", spellings:[]});
						}  else {
							if (collation.structure.apparatus[i].readings[j].overlap_status!="duplicate")
							 {
							 	if (!transform) { //collapsing variant forms when outputting spelling database
									appText+="<p class='variant'>"+vartext+" ";
								}
								VMapApp[n].variants.push({variant:vartext, spellings:[]});
							}
						}
						if (collation.structure.apparatus[i].readings[j].overlap_status=="duplicate") {/* appText+=" (<i>overlapped variation</i>) " */}
						else {
							appText+=createUnRegRdg(collation.structure.apparatus[i].readings[j], n, transform, collation.context);
							if (!transform) {
								appText+="</p>";
							} 
						}
					}
				}
				if (!transform) {
					appText+="</div>";
				} 
				//check overlap readings existence...
				if (collation.structure.hasOwnProperty("apparatus2"))  {
					var iO=-1;
					//check we have an entry with a start associating with this word..
					for (let x=0; x<collation.structure.apparatus2.length; x++) {
						if (collation.structure.apparatus2[x].start==collation.structure.apparatus[i].start) iO=x;
					}
					if (iO!=-1) { 
						n++;
						VMapApp.push({lemma:"", variants:[]});
						if (!transform) {
							appText+="<div class='VMAdiv' id='VMAdiv"+n+"' data-n='"+n+"'>"; 
						}
						var overWits=[];   
						overLem="";
						//far simpler!!! get lemma first. This will be the first reading found
						for (let x=0; x<collation.structure.apparatus2[iO].readings[0].text.length; x++) {
							overLem+=collation.structure.apparatus2[iO].readings[0].text[x].interface;
							if (x<collation.structure.apparatus2[iO].readings[0].text.length-1) overLem+=" ";
						}
						VMapApp[n].lemma=overLem;
						VMapApp[n].variants.push({variant:"[lemma]", spellings:[]});
						if (!transform) {
							appText+="<p class='lemma'><i>Overlapping readings</i> "+overLem+"</p>";
						}
						//now populate the overWits structure with unreg readings
						for (let x=1; x<collation.structure.apparatus2[iO].readings.length; x++) {
							var OWT="";
							var OWW=collation.structure.apparatus2[iO].readings[x].witnesses;
							var spellings=[];
							for (let y=0; y<OWW.length; y++) {
								var thisSp="";
								for (let z=0; z<collation.structure.apparatus2[iO].readings[x].text.length;z++) {
									thisSp+=collation.structure.apparatus2[iO].readings[x].text[z][OWW[y]].original;
									if (z<collation.structure.apparatus2[iO].readings[x].text.length-1) thisSp+=" ";
								}
								//do we have this spelling already??
								var alreadySp=spellings.filter(function (obj){return obj.spelling === thisSp;})[0]
								if (alreadySp) alreadySp.wits.push(OWW[y]);
								else spellings.push({wits: [OWW[y]], spelling: thisSp})
							}
							for (let y=0; y<collation.structure.apparatus2[iO].readings[x].text.length; y++) {
								OWT+=collation.structure.apparatus2[iO].readings[x].text[y].interface;
								if (y<collation.structure.apparatus2[iO].readings[x].text.length-1) OWT+=" ";
							}
							if (!transform) {
								appText+="<p class='variant'>"+OWT+" ";
							}
							VMapApp[n].variants.push({variant:OWT, spellings:[]});
							for (let y=0; y<spellings.length; y++) {
								let witAttr="";
								let rdgIds="";
								VMapApp[n].variants[x-1].spellings.push({spelling: spellings[y], id:""+n+"-"+x+"-"+y, wits:[]});
								if (!transform) {
									appText+="<span data-n='"+n+"-"+x+"-"+y+"'>"
								}
								for (let z=0; z<spellings[y].wits.length; z++) {
									if (!transform) {
										appText+="<a href='javascript:getMSLine(\""+currLine+"\",\""+spellings[y].wits[z]+"\")'>"+spellings[y].wits[z]+"</a> ";
									} else {
										witAttr+=spellings[y].wits[z];
										if (z<spellings[y].wits.length-1) {witAttr+=" "};
										rdgIds+="<idno>"+spellings[y].wits[z]+"</idno>"
									}
									VMapApp[n].variants[x-1].spellings[y].wits.push(spellings[y].wits[z]);
								}
								if (!transform) {	
									appText+="("+spellings[y].spelling+")</span> "
								} else {
									rdgNo++;
									appText+='<rdg type="overlap" n="'+rdgNo+'" varSeq="'+rdgNo+'" wit="'+witAttr+'">'+spellings[y].spelling+'<wit>'+rdgIds+'</wit></rdg>'
								}
							}
							if (!transform) {
								appText+="</p>"
							} 
						}
							if (!transform) {
							appText+="</div>"
						} 
					}
				}
				if (transform) {
					appText+="</app>";
				}
			}
			if (transform) {
					appText+="</ab>";
			}
		}
		if (!onlyReg && words) {
				//used in transform to generate spelling tables
			//get the base..
			if (transform) {
				appText="<ab n='"+collation.context+"'>";
			}  else {
				appText+="<p class='lemma'>Base text: ";
			}
			for (var i=0; i<collation.structure.apparatus.length; i++) {
				for (j=0; j<collation.structure.apparatus[i].readings[0].text.length; j++) {
					if (!transform && collation.structure.apparatus[i].readings[0].text[j]["Base"].pc_before) {
						appText+=collation.structure.apparatus[i].readings[0].text[j]["Base"].pc_before+" ";
					}
					if (!transform) {
						appText+=collation.structure.apparatus[i].readings[0].text[j]["Base"].original;
					}
					if (j<collation.structure.apparatus[i].readings[0].text.length-1 && !transform) appText+=" ";
					if (!transform && collation.structure.apparatus[i].readings[0].text[j]["Base"].pc_after) {
						appText+=collation.structure.apparatus[i].readings[0].text[j]["Base"].pc_after+" ";
					}
				}
				appText+=" ";
			}
			if (!transform) {
				appText+="</p>";
			}
			//now get all the spellings...
			var spellings=[];
			for (var i=0; i<collation.structure.apparatus.length; i++) {
				for (j=0; j<collation.structure.apparatus[i].readings.length; j++) {
					for (k=0; k<collation.structure.apparatus[i].readings[j].text.length; k++) {
						for (var p=0; p<collation.structure.apparatus[i].readings[j].text[k].reading.length; p++) {
							var thisWit=collation.structure.apparatus[i].readings[j].text[k].reading[p];
							if (thisWit!="Base") {
								if (collation.structure.apparatus[i].readings[j].text[k][thisWit] ) {
									var reg=collation.structure.apparatus[i].readings[j].text[k].interface;
									var orig=collation.structure.apparatus[i].readings[j].text[k][thisWit].original;
									if (orig=="length") orig="Length";  //because length is a reserved key, naturally
									if ((typeof spellings[reg]!="undefined") && (typeof spellings[reg][orig]!="undefined"))  {
										if (typeof spellings[reg][orig].wits == "undefined") { //wierdly..spellings[reg][orig] can be wrongly defined
											spellings[reg][orig]={wits:[thisWit]};
										}
										if (!spellings[reg][orig].wits.includes(thisWit)) {
											spellings[reg][orig].wits.push(thisWit);
										}
									} else if (typeof spellings[reg]!="undefined") {
										spellings[reg][orig]={wits:[thisWit]};
									} else {
										spellings[reg]=[];
										spellings[reg][orig]={wits:[thisWit]};
									}
								}
							}
						}
					} //deal with subreadings...
					if (collation.structure.apparatus[i].readings[j].standoff_subreadings) {
						for (var k=0; k<collation.structure.apparatus[i].readings[j].standoff_subreadings.length; k++) {
							var thisWit=collation.structure.apparatus[i].readings[j].standoff_subreadings[k];
							if (thisWit!="Base") {
								if (collation.structure.apparatus[i].readings[j].SR_text[thisWit]) {
									for (var m=0; m<collation.structure.apparatus[i].readings[j].SR_text[thisWit].text.length; m++) {
										var reg=collation.structure.apparatus[i].readings[j].SR_text[thisWit].text[m].interface;
										var orig=collation.structure.apparatus[i].readings[j].SR_text[thisWit].text[m][thisWit].original;
										if (spellings[reg] && spellings[reg][orig])  {
											if (!spellings[reg][orig].wits.includes(thisWit)) {
												spellings[reg][orig].wits.push(thisWit);
											}
										} else if (spellings[reg]) {
											spellings[reg][orig]={wits:[thisWit]};
										} else {
											spellings[reg]=[];
											spellings[reg][orig]={wits:[thisWit]};
										}
									}
								}
							}
						}
					}
				}
			}
			//ok... extract all the regularizations
			var sortSpells=Object.keys(spellings);
			for (var i=0; i<sortSpells.length; i++) {
				if (!transform) {
					appText+="<div class='VMAdiv' id='VNAdiv"+i+"' data-n='"+i+"'><p class='lemma'>"+sortSpells[i]+": ";
				} else {
					appText+='<app type="main" n="'+collation.context+'">'
				}
				VMapApp.push({lemma:"", variants:[]});
				var theseSpells=Object.keys(spellings[sortSpells[i]]);
				for (var j=0; j<theseSpells.length; j++) {
					VMapApp[i].variants.push({spelling: theseSpells[j], wits:[]});
					if (!transform) {
						appText+="<span id='"+i+"-"+j+"'>"+theseSpells[j]+" (";
					} 
					spellings[sortSpells[i]][theseSpells[j]].wits.sort();
					if (!transform) {
						for (var k=0; k<spellings[sortSpells[i]][theseSpells[j]].wits.length; k++) {
							var thisWit=spellings[sortSpells[i]][theseSpells[j]].wits[k];
							VMapApp[i].variants[j].wits.push(thisWit); 
							appText+="<a href='javascript:getMSLine(\""+currLine+"\",\""+thisWit+"\")'>"+thisWit+"</a>";
							if (k<spellings[sortSpells[i]][theseSpells[j]].wits.length-1) appText+=" ";
						}
						appText+=") </span>";
					} else {
						var spWits="";
						var spIds="";
						for (var k=0; k<spellings[sortSpells[i]][theseSpells[j]].wits.length; k++) {
							var thisWit=spellings[sortSpells[i]][theseSpells[j]].wits[k];
							spWits+=thisWit+" ";
							spIds+="<idno>"+thisWit+"</idno>"
						}
						appText+='<rdg n="'+(j+1)+'" varSeq="'+(j+1)+'" wit="'+spWits.trim()+'">'+theseSpells[j]+'<wit>'+spIds+'</wit></rdg>'
					}
				}
				if (!transform) {
					appText+="</p></div>";
				} else {
					appText+="</app>"
				}
			}
		}
		if (transform) {
			var boo=1;
			if (words) {appText+="</ab>"}
			callback(appText);
		};
		if (!hasVMap) $('#collation').html(appText);
		else {
			$('#collationText').html(appText);
			populateVMapLine();
			UnivOnlyReg=onlyReg;
			UnivWords=words;
			if (onlyReg) {
				$('div.VMAdiv').hover(VMapHoverIn);
				$('#VMLine').hover(VMapLineHoverIn);
			}
			if (!onlyReg && !words) {
				$('div.VMAdiv').hover(VMapHoverIn);
				$('#VMLine').hover(VMapLineHoverIn);
			}
			if (!onlyReg && words) {
				$('div.VMAdiv').hover(VMapHoverIn);
				$('#VMLine').hover(VMapLineHoverIn);
			}
		}
	})
	.fail(function( jqXHR, textStatus, errorThrown ) {
        console.log(jqXHR);
        console.log(textStatus);
        console.log(errorThrown );
    });
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

function createUnRegRdg(rdg, vno, transform, context) { 
	//dig into the full apparatus to create an apparatus showing the fully regularized readings
	//for each witness to each reading here...
	//note offset. First reading in xml app is always info on block present/absent. So appN is one less: skip for app
	var apparatus=""; 
	var srcWits=[];
	for (var m=0; m<rdg.witnesses.length; m++) {
		srcWits.push({name: rdg.witnesses[m], text:"", spellWits: []});  //use ms name as key
	}
	for (var k=0; k<rdg.text.length; k++) { //we can do this two ways. Treat as phrases, or as single words
	//phrases! note that this is a bit tricky.. rdg.witnesses MAY include mss which don't actually have words here..
	//(they might be in overlap, or somewhere, who knows)
		for (var j=0; j<rdg.text[k].reading.length; j++) {
			//find srcWit corresponding to this reading wit...
			for (var n=0; n<srcWits.length && srcWits[n].name!=rdg.text[k].reading[j]; n++);
			if ((typeof srcWits[n]=="undefined")) {
				var boo=1; //when for example we have Ht-orig but I think no corresponding orig (phrase reg? eg RE 218)
			} else {
				srcWits[n].text+=rdg.text[k][rdg.text[k].reading[j]].original;  //build up srcWits text
				if (k<rdg.text.length-1) srcWits[n].text+=" ";
			}
		}
	}
		//there could be subreadings here. If so... the wit will appear in standoff_subreadings, and its text will be in SR_text
	for (var j=0; j<srcWits.length; j++) {
		if (srcWits[j].text=="") {
			if (rdg.hasOwnProperty("standoff_subreadings") && rdg.standoff_subreadings.includes(srcWits[j].name)) {
				if (rdg.SR_text[srcWits[j].name]) {
					for (var k=0; k<rdg.SR_text[srcWits[j].name].text.length; k++) {
						srcWits[j].text+=rdg.SR_text[srcWits[j].name].text[k].interface;
						if (k<rdg.SR_text[srcWits[j].name].text.length-1) srcWits[j].text+=" ";
					}
				}
			}
		}
	}
	for (var j=0; j<srcWits.length; j++) {
		srcWits[j].spellWits.push(srcWits[j].name);
		for (var k=j+1; k<srcWits.length; k++) { //build lists of wits with spellings
			if (srcWits[j].text==srcWits[k].text) {
				srcWits[j].spellWits.push(srcWits[k].name);
				srcWits.splice(k, 1);
				k--;
			}
		}
	}  
	for (var i=0; i<srcWits.length; i++) {
		var varId=""+vno+"-"+String(VMapApp[vno].variants.length-1)+"-"+i;
		let spellingMss="";
		let spellingWits="";
		VMapApp[vno].variants[VMapApp[vno].variants.length-1].spellings.push({spelling: srcWits[i].text, id: varId, wits:[]});
		if (!transform)	{
			apparatus+="<span data-n='"+varId+"'>";
		} 
		for (var j=0; j<srcWits[i].spellWits.length; j++) {
			if (!transform) {
				apparatus+="<a href='javascript:getMSLine(\""+currLine+"\",\""+srcWits[i].spellWits[j]+"\")'>"+srcWits[i].spellWits[j]+"</a>";
			} else {
			   	spellingMss+=srcWits[i].spellWits[j];
			   	spellingWits+='<idno>'+srcWits[i].spellWits[j]+'</idno>'
			}
			VMapApp[vno].variants[VMapApp[vno].variants.length-1].spellings[VMapApp[vno].variants[VMapApp[vno].variants.length-1].spellings.length-1].wits.push(srcWits[i].spellWits[j]);
			if (!transform) {
				if (j<srcWits[i].spellWits.length-1) apparatus+=" ";
			} else {
				if (j<srcWits[i].spellWits.length-1) spellingMss+=" ";
			}
		}
		if (!transform) {
			apparatus+=" ("+srcWits[i].text+")</span>";
			if (i<srcWits.length-1) apparatus+=", ";
		} else {
			rdgNo++;
			//look for conversion problems here
			if (srcWits[i].text.indexOf("''")>-1) messages+="<br>Error in "+context+": \"''\" found in reading. This will likely cause conversion errors";
			if (srcWits[i].text.indexOf("&lt;am")>-1) messages+="<br>Possible error in "+context+": \"&lt;am\" found in reading. Check for valid xml, etc";
			if (srcWits[i].text.indexOf("&lt;ex")>-1) messages+="<br>Possible error in "+context+": \"&lt;ex\" found in reading. Check for valid xml, etc";
			if (srcWits[i].text.indexOf("&lt;/am")>-1) messages+="<br>Possible error in "+context+": \"&lt;/am\" found in reading. Check for valid xml, etc";
			if (srcWits[i].text.indexOf("&lt;/ex")>-1) messages+="<br>Possible error in "+context+": \"&lt;/ex\" found in reading. Check for valid xml, etc";
			if (srcWits[i].text.indexOf("&lt;hi")>-1) messages+="<br>Possible error in "+context+": \"&lt;hi\" found in reading. Check for valid xml, etc";
			if (srcWits[i].text.indexOf("&lt;/hi")>-1) messages+="<br>Possible error in "+context+": \"&lt;/hi\" found in reading. Check for valid xml, etc";
			if (srcWits[i].text=="") messages+="<br>Error in "+context+": no text found in reading. This will cause conversion errors";
			apparatus+='<rdg n="'+rdgNo+'" varSeq="'+rdgNo+'" wit="'+spellingMss+'">'+srcWits[i].text+'<wit>'+spellingWits+'</wit></rdg>';
		}
	}
	return apparatus;
}
