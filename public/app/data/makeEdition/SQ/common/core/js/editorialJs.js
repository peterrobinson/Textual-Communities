function initEditorial () {
	$.get(universalBannerLocation, function (data, status){
		$("#editorialMenu").html($(data).find("#editorialMenu").html());
		$("#entityMenu").html($(data).find("#entityMenu").html());
		$("#entityMenu").html(initializeEntityChoice(currEntity, currMS));
		$("#rTable").show();
		$("#panel-left").hide();
		$("#editorial").show();
		var panelRight = new Clay('#panel-right');
		panelRight.on('resize', function(size) {
			resizeRTable();
		});
		resizeRTable();  
		$(".popAppWordCont-orig").hide();
		$(".edBaseLine").find("w").removeClass("showTip");
		let baselines=$(".edBaseLine");
		for (let i=0; i<baselines.length; i++) {
			let words=$(baselines[i]).find("w"); //mmm might be omission...?
			let wordId=$(words[0]).attr("class");
			$(words[0]).addClass("collLemmaText");
			for (let j=1; j<words.length; j++) {
				if ($(words[j]).attr("class")==wordId) {
					$(words[j]).addClass("collLemmaText");
				}
			}
		}
	});
}

function selectEdSpelling(element){
	if ($(element).is(":checked")) {
		$(element).closest('.edComm').find(".popAppWordCont-orig").show()
		$(element).closest('.edComm').find(".popAppWordCont-reg").hide()
		
	} else {
		$(element).closest('.edComm').find(".popAppWordCont-reg").show()
		$(element).closest('.edComm').find(".popAppWordCont-orig").hide()
	}
}

function movePopUpCollation(thisID,type, entity) { //same name as function called from compare and transcript pages but adapted as it is not a popup
	//type is: prevLine, nextLine, prevWord, nextWord
	let root=$("[data-entity='"+entity+"']");
	$(root).find("w.collLemmaText").removeClass("collLemmaText");
	if (type=="prevWord") { //get the first word with this class
		//could be after omission at the beginning of the verse and so no previous word...
		let prevWord=$($("w."+thisID)[0]).prev("w");
		let prevId="";
		if (prevWord.length) {
			 prevId=$(prevWord).attr("class");  // because we dont have showTip or dummy
		} else {
			let prevNum=parseInt(thisID.slice(thisID.lastIndexOf("_")+1))-1;
			prevId=thisID.slice(0, thisID.lastIndexOf("_")+1)+prevNum;
		}
		$(root).find(".PUEditorial").html($($("#"+prevId)[0]).html());
		$("."+prevId).addClass("collLemmaText");
	} else if (type=="nextWord") { //get the last word with this class
		let thisWord=$("w."+thisID)[$("w."+thisID).length-1];
		let nextId="";  //possible there is no first word with the id of the first variant, because it is an omission
		if (!thisWord) {  //we assume only one omission...that omission is followed by a variant on a word
			let nextNum=parseInt(thisID.slice(thisID.lastIndexOf("_")+1))+1;
			nextId=thisID.slice(0, thisID.lastIndexOf("_")+1)+nextNum;
			thisWord=$("w."+nextId)[$("w."+nextId).length-1]
		} else {
			 nextId=$(thisWord).next("w").attr("class");
		}
		$(root).find(".PUEditorial").html($($("#"+nextId)[0]).html());
		$("."+nextId).addClass("collLemmaText");
	} 
	if ($(root).find(".selectEdSpelling").is(":checked")) {
		$(root).find(".popAppWordCont-orig").show()
		$(root).find(".popAppWordCont-reg").hide()
	}
}

