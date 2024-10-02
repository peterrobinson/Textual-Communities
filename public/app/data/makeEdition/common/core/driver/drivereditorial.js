const punctuation=".,:-/&@¶§;·⸫▽?!'"+'"';
const suffixes=["","-mod","-orig"]

function initEditorial () {
	if (!isstandalone) {
		let banner=universalBanner;
	    banner=banner.replaceAll("xxxx", "<").replaceAll("yyyy", ">").replaceAll("zzzz", "&nbsp;");
	    $("#page-head").html(banner);
		createEditorial();
	} else {
		if (!ssSearch) {
			$("#staticSearch").remove();
		}
		if (!hasVBase) {
			$("#VBase").remove();
			$("#VBaseLink").remove();
		}
		$("#shortTitle").html(shortTitle);
		createEditorial();  //we don't load the banner until run time
	}
}

function createEditorial (){
	//is it just one item? or a commentary item, where there might be loads of them...
	let content="";
	if (!Array.isArray(item)) {
		content+="<h2>"+item.title+"</h2>\n";
		$("title").html(item.title);
		for (let i=0; i<item.text.length; i++) {
			if (item.text[i].hasOwnProperty("attr")) {
				let attr=item.text[i].attr.slice(0,item.text[i].attr.indexOf("="));
				let value=item.text[i].attr.slice(item.text[i].attr.indexOf("=")+1);
				content+="<"+item.text[i].type+" "+attr+"='"+value+"'>"+item.text[i].text+"</"+item.text[i].type+">";
			} else {
				content+="<"+item.text[i].type+">"+item.text[i].text+"</"+item.text[i].type+">";
			}
		} 
	} else { //must be a commentary. Could be lots and lots of them
		//get the title
		let eName=item[0].key.slice(0, item[0].key.indexOf(":"));
		let vName=eName;
		if (typeof aliases !="undefined") {
			if (aliases.filter(item=>item.topEntity==eName && item.context=="all").length>0) {
				vName=aliases.filter(item=>item.topEntity==eName && item.context=="all")[0].alias;
			} 
		}
		$("title").html(vName+": Textual Commentary");
		content+="<h2>Textual Commentary for "+vName+"</h2>\n"
		for (let i=0; i<item.length; i++) {
			content+="<div class='edComm' id='"+item[i].key+"' data-entity='"+item[i].key+"'>";
			content+="<div class='edCommHead'><h3>";
			let keys=item[i].key.split(":");
			let eKey="", eValue="";
			for (let j=1; j<keys.length; j++) { //ignore first split, which is just the entity name
				let thisKey=keys[j].split("=");
				eKey=thisKey[0];
				eValue=thisKey[1];
				let title=eKey+" "+eValue;
				if (typeof aliases !="undefined") {
					if (aliases.filter(item=>item.key==eKey && item.context=="commentary").length>0) {
						eKey=aliases.filter(item=>item.key==eKey && item.context=="commentary")[0].alias;
						title=eKey+" "+eValue;
					}
				}
				content+=title;
				if (j<keys.length-1) content+=", ";
			}
			let lastKey="";
			lastKey=item[i].key.slice(item[i].key.lastIndexOf(":")+1);
			let thisMS=getDefaultMs(item[i].key);
			let compEntity="";
			if (typeof compareIndex!="undefined") {
				compEntity=compareIndex.filter(myEntity=>myEntity.entity==item[i].key)[0].index;
			}
			content+="</h3>";
			content+="<span class='selectEdSpellingLink' title='Check box to see original spelling'><input class='selectEdSpelling' onclick='javascript:selectEdSpelling(this)' type='checkbox' />Original Spelling</span>";
			content+="<a href='javascript:getMSLine(\""+item[i].key+"\",\""+thisMS+"\")'>Transcript</a>";
			content+="<a href='../../../html/collationreg/"+item[i].key.slice(0, item[i].key.lastIndexOf(":"))+"/"+lastKey+".html'>Collation</a>"
			content+="<a href='javascript:getCompareFromCollation(\""+compEntity+"\",\""+item[i].key+"\",\""+thisMS+"\")'>Compare</a>";
			content+="<a  href='../../../vBase.html'>VBase</a>";
			content+="</div>\n";
			content+="<div class='edBaseLineCtr'><div class='edBaseMS'>"+thisMS+"</div><div data-lineID='"+item[i].key+"-"+thisMS+"' class='edBaseLine'></div></div>";
			content+="<div class='PUEditorial' id='PUEdColl-"+item[i].key+"-"+thisMS+"'></div>";
			for (let k=0; k<item[i].text.length; k++) {
				if (item[i].text[k].hasOwnProperty("attr")) {
					let attr=item[i].text[k].attr.slice(0,item[i].text[k].attr.indexOf("="));
					let value=item[i].text[k].attr.slice(item[i].text[k].attr.indexOf("=")+1);
					content+="<"+item[i].text[k].type+" "+attr+"='"+value+"'>"+item[i].text[k].text+"</"+item[i].text[k].type+">";
				} else {
					content+="<"+item[i].text[k].type+">"+item[i].text[k].text+"</"+item[i].text[k].type+">";
				}
			}
			content+="<p class='edRespons'>("+item[i].approver+", "+formatDate(item[i].date)+")</p>\n";
			content+="</div>\n"
		}
	}
	content=content.replaceAll("&lt;","<").replaceAll("&gt;",">")
	$("#editorial").html(content);
	$("#rTable").show();
	$("#panel-left").hide();
	$("#editorial").show();
	var panelRight = new Clay('#panel-right');
	panelRight.on('resize', function(size) {
		resizeRTable();
	});
	resizeRTable();
	makePopUpCollations(function(){ //async, of course
		$(".popAppTitle").remove();
		sendHTML();
	});
}

function makePopUpCollations(callback) { //go get the line and the collations
	let commentaries=$(".edComm");
	async.mapSeries(commentaries, function(commentary, cblines){ 
		let entity=$(commentary).attr("data-entity");
		let thisMS=getDefaultMs(entity);
		//make the collation line ...
		//get the collation first, then make the line from it
		console.log("Making collation for "+entity);
		$.get(TCurl+"/uri/urn:det:tc:usask:"+TCcommunity+"/entity="+entity+"?type=apparatus&format=approved") 
			.done (function(json) {
				let mss=[];
				let collation=JSON.parse(json).structure;
				mss.push(thisMS);
			   	let wits=identifyAppWits(collation, mss)
			   	if (wits.noApps.length>0) {
					createCollationLine (collation, wits.noApps[0], 0, entity, "editorial");
					let line=$("div[data-lineID='"+entity+"-"+thisMS+"']")[0];
					createWordAppLine(collation,line, entity, json, thisMS, cblines);
					let puID="#PUColl-"+entity+"-"+thisMS+"_1";
					puID=puID.replaceAll(":", "-").replaceAll("=", "_");
					let puHTML=$(puID).html();
					$("[id='PUEdColl-"+entity+"-"+thisMS+"']").html(puHTML);
					cblines(null, [])
				} else {
					getAppLine(TCcommunity, entity, thisMS, 0, "editorial", function() {
						//make the apparatus here
						cblines(null,[]);
					});
				}
			})
			.fail (function( jqXHR, textStatus, errorThrown ) {
				console.log(jqXHR);
				console.log(textStatus);
				console.log(errorThrown );
				cblines(null,[]);
			})
		}, function (err) {
			callback();
	});
}

function formatDate (rawdate) {
    var date = new Date(rawdate);
    var months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return date.getDate()+" "+months[date.getMonth()]+" "+date.getFullYear();
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

