

function createVBase () {
	console.log("hello");
	$("#rTable").hide();
	$("#searchVBase").show();
	$("#title").html("Variant database (VBase) for the "+vBase.name);
	setUpVBase();
}

function setUpVBase (){
	$.get(VBaseJson, function(data){
		let vbJSONscript="<script>const vBase="+JSON.stringify(data)+"</script>";
		$("head").append(vbJSONscript);
		for (let i=1; i<vBase.conditionsets.length; i++) {
   			$("#presetVBs").append("<span class='preset'><input onclick='writePresets(\""+i+"\")' type='radio' name='presetVB'>"+vBase.conditionsets[i].name+"</span>");
   		}
		if (!vBase.witlist.includes('\\all')) vBase.witlist.push("\\all");
		$("#vbTranscriptLink").attr("href", "javascript:getTranscriptFromVBase('"+currMS+"', '"+firstTranscript.slice(firstTranscript.indexOf("/")+1)+"', '" +currEntity+"')");
		$("#vbCollationLink").attr("href", "html/collationreg/"+currEntity.slice(0, currEntity.indexOf(":"))+"/"+currEntity.slice(currEntity.indexOf(":")+1)+".html");
 		sendHTML();
	});
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
