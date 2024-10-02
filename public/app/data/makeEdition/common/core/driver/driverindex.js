function initIndex () {
	if (!isstandalone) {
		let banner=universalBanner;
	    banner=banner.replaceAll("xxxx", "<").replaceAll("yyyy", ">").replaceAll("zzzz", "&nbsp;");
	    $("#page-head").html(banner);
		createIndex();
	} else {
/*		$("#page-head").load(universalBannerLocation, function() {
	
			if (!ssSearch) $("#Search").remove();
			createIndex();
		});  */
		if (!ssSearch) $("#Search").remove();
		if (!hasVBase) {
			$("#VBase").remove();
			$("#VBaseLink").remove();
		}
		createIndex();
	}
}

function createIndex (){
	var newTitle=longTitle.replaceAll("&gt;",">").replaceAll("&lt;","<")
	$("#longTitle").html(newTitle);
	$("#imageSplash").attr("src", splash);
	$("#title").html(shortTitle);
	$("#transcriptLink").attr("href", "javascript:getTranscriptFromVBase('"+currMS+"', '"+firstTranscript.slice(firstTranscript.indexOf("/")+1)+"', '" +firstEntity+"')");
	$("#imageLink").attr("href", "html/transcripts/"+firstTranscript+".html");
	let directory=firstEntity.slice(0, firstEntity.lastIndexOf(":"));
	let cFile=firstEntity.slice(firstEntity.lastIndexOf(":")+1);
	$("#collationLink").attr("href", "html/collationreg/"+directory+"/"+cFile+".html");
	sendHTML();
}


//this is so simple! no more fiddling with sending stuff to a database
function sendHTML(){
	//remove driver stuff
	$(".driverScript").remove();
	$("#tipDiv").remove();
	var s = new XMLSerializer();
	var d = document;
	var str = s.serializeToString(d); 
	window.parent.postMessage(str, "*");
}

