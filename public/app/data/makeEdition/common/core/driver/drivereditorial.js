function initEditorial () {
	let content="";
	$("#page-head").load(universalBannerLocation, function() {
		//is it just one item? or a commentary item, where there might be loads of them...
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
				content+="</h3>";
				content+="<a id='"+item[i].key+"'></a><a href='../../../html/collationsReg/"+item[i].key.slice(0, item[i].key.lastIndexOf(":"))+"/"+lastKey+".html'>Collation</a>"
				content+="</div>\n";
				for (let k=0; k<item[i].text.length; k++) {
					if (item[i].text[k].hasOwnProperty("attr")) {
						let attr=item[i].text[k].attr.slice(0,item[i].text[k].attr.indexOf("="));
						let value=item[i].text[k].attr.slice(item[i].text[k].attr.indexOf("=")+1);
						content+="<"+item[i].text[k].type+" "+attr+"='"+value+"'>"+item[i].text[k].text+"</"+item[i].text[k].type+">";
					} else {
						content+="<"+item[i].text[k].type+">"+item[i].text[k].text+"</"+item[i].text[k].type+">";
					}
				}
				content+="<p class='edRespons'>("+item[i].approver+", "+formatDate(item[i].date)+")</p>";
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
		sendHTML();
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

