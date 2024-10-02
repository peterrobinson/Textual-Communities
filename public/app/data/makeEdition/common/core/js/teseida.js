function initMyEdition(){
	//place holder, override in your edition
	if (view=="transcript") {
		$("#MS").val(currMS);
		$("#book").val(currBook);
		$("#stanza").val(currStanza);
		 initTranscript(currMS, currPage, 0);
	} else if (view=="compare") {
		$("#book").val(myBook);
		$("#stanza").val(myStanza);
	}
}

 
 function initMyTranscript(ms, page, index){
	//place holder, override in your edition
	if (typeof makeEdition != "undefined" && !makeEdition) {
		$("#panel-right").show();
		openImage();
	 	return;
	}
	else {
		showThisPage();
	}
}

function openImage () {
	if (iiifURL) {
		viewer = OpenSeadragon({
			id: "panel-left",
			maxZoomPixelRatio: 3,  //0.5 for stemmata
			minZoomImageRatio: 0.7,
			homeFillsViewer: true,
			prefixUrl: "https://openseadragon.github.io/openseadragon/images/"
		});	
		$.get(iiifURL, function(source) {
			if (viewer) viewer.open([source]);
		});
	}
}

function changeView() {
	let thisMs=$("#MS").val();
	let thisBook=$("#book").val();
	let thisStanza=$("#stanza").val()
	let matchMe=$("#book").val();
	if (thisStanza!="") matchMe+="_"+thisStanza;
	if (thisMs!="COMPARE") {
		if (thisBook=="Preface") {
			if (view=="index") {
				location.href="html/transcripts/"+thisMs+"/1r.html";
			} else {
				location.href="../../transcripts/"+thisMs+"/1r.html";
			}
		} else {
			if (thisStanza=="-") {
				$("#stanza").val("1")
				matchMe=thisBook+"_"+"1";
			}
			let thiswit=pageEntities.filter(function (obj){return obj.witness==thisMs})[0];
			let thisMatch=thiswit.entities.filter(function (obj){return obj.match==matchMe})[0];
			if (thisMatch) {
				let newPage=thisMatch.page;	
				if (view=="index") {
					location.href="html/transcripts/"+thisMs+"/"+newPage+".html";
				} else {
					location.href="../../transcripts/"+thisMs+"/"+newPage+".html";
				}
			} else {
				//send an error message
				alert("Cannot find "+matchMe+" in witness "+ thisMs+". Likely that witness is missing that text.");
	//			$("#MS").val(thisMS);
			}
		}
	} else {
		//is this in entities?
		if (thisBook=="Preface" && thisStanza!="IS") {
			thisStanza="IS";
			$("#stanza").val("IS");
		}
		let compBook=entities.filter(function (obj){return obj.entity==thisBook})[0];
		let compStanza=compBook.entities.filter(function (obj){return obj==thisStanza})[0];
		if (!compBook || !compStanza) {
			alert("Cannot find any comparison for book "+thisBook+",  stanza "+ thisStanza+". Likely there is no such book and stanza.");
		} else {
			if (view=="index") {
				location.href="html/compare/"+thisBook+"/"+thisStanza+".html";
			} else {
				location.href="../../compare/"+thisBook+"/"+thisStanza+".html";
			}
		}
	}
}
