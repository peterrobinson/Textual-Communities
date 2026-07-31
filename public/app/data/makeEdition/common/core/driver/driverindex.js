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
/*		if (!hasVBase) {
			$("#VBase").remove();
			$("#VBaseLink").remove();
		} */
		createIndex();
	}
}

function createIndex (){
//	var newTitle=longTitle.replaceAll("&gt;",">").replaceAll("&lt;","<")
	$("#longTitle").html('<span style="font-size: 80%">'+pubname+". Edited by "+generalEditors+" • "+pubYear+"</span><br>"+'<span style="font-size: larger">'+pubpart+"</span>");
//	$("#pubpart").html('<span style="font-size: larger">'+pubpart+"</span>");
	$("#imageSplash").attr("src", splash);
	$("#title").html(shortTitle);
	$("#shortTitle").html(shortTitle);
	$("#editionLink").attr("href","html/transcripts/Edition/"+firstEditionPage+".html");
	$("#transcriptLink").attr("href", "javascript:getTranscriptFromVBase('"+currMS+"', '"+firstTranscript.slice(firstTranscript.indexOf("/")+1)+"', '" +firstEntity+"')");
	$("#imageLink").attr("href", "html/transcripts/"+firstTranscript+".html");
	$("#imageSplash").attr("width", $("#longTitle").width()+"px");
	let directory=firstEntity.slice(0, firstEntity.lastIndexOf(":"));
	let cFile=firstEntity.slice(firstEntity.lastIndexOf(":")+1);
	if (hasPartEditor) {
		$("#partEditor").html("Edited by "+partEditor);
	}
	$("#collationLink").attr("href", "html/collationreg/"+directory+"/"+cFile+".html");
	$("#compareLink").attr("href", "html/compare/"+startCompare.split(":")[0]+"/"+startCompare.split(":")[1]+".html");
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

