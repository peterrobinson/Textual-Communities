
function createVBase () {
	console.log("hello");
	$("#rTable").hide();
	$("#searchVBase").show();
	setUpVBase();
}

function setUpVBase (){
//		let vbJSONscript="<script>const vBase="+JSON.stringify(vBase)+"</script>";
//		$("head").append(vbJSONscript);
		for (let i=1; i<vBase.conditionsets.length; i++) {
   			$("#presetVBs").append("<span class='preset'><input onclick='writePresets(\""+i+"\")' type='radio' name='presetVB'>"+vBase.conditionsets[i].name+"</span>");
   		}
		if (!vBase.witlist.includes('\\all')) vBase.witlist.push("\\all");
		$("#titlePageHead").html("Variant database (VBase) for "+vBase.name);
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

