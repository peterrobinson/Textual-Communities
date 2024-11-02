 
var TCurl="https://textualcommunities.org"
var noteNumber=0;
const punctuation=".,:-/&@¶§;·⸫▽?!'"+'"';
var apparatusXML={};
const urlSrc="http://localhost:3000/app/data/makeEdition/teseida";
var currIndex=0;
const urlLocal="http://localhost:3000";


function initMyEdition(){
	//place holder, override in your edition
	if (typeof makeEdition != "undefined" && makeEdition) {
		if (view=="transcript") {
//			console.log("Starting ranscript for "+currMS+", "+currPage);
			currIndex=eval(currMS).findIndex(obj=>obj.page==currPage);
			$("#book").val(eval(currMS)[currIndex].init.book);
			if (eval(currMS)[currIndex].init.hasOwnProperty("stanza")) {
				$("#stanza").val(eval(currMS)[currIndex].init.stanza);
			} else {$("#stanza").val("-")}
	//		 console.log("starting on "+currPage+" in "+currMS)
			$("#compareLink").attr("href","../../../html/compare/"+$("#book").val()+"/"+$("#stanza").val()+".html")
			createMenu();
			 $("#title").html(title);
			 initTranscript(currMS, currPage, 0);
		} else if (view=="compare") {
//			console.log("Compare for "+thisBook+", "+thisStanza);
			$("#book").val(thisBook);
			$("#stanza").val(thisStanza);
			$("#compareSummary").html("Book "+thisBook+", Stanza "+thisStanza);
		    $("#MS").val("COMPARE");
		     $("#title").html(title);
		     if (!prevPage) {
		     	$("#prevCompare").html("         ");
		     }  else {
		     	$("#prevCompareText").html(prevPage);
		     	$("#prevCompareLink").attr("href","../../../html/compare/"+prevLink+".html");
		     }
		     if (!nextPage) {
		     	$("#nextCompare").hide();
		     }  else {
		     	$("#nextCompareText").html(nextPage);
		     	$("#nextCompareLink").attr("href","../../../html/compare/"+nextLink+".html");
		     }
		    let thiswit=pageEntities.filter(function (obj){return obj.witness=='AUT'})[0];
		    let thisMatch=thiswit.entities.filter(function (obj){return obj.match==thisBook+"_"+thisStanza})[0];
		    if (!thisMatch) {
		    	console.log("Book "+thisBook+", stanza "+thisStanza+" does not appear in AUT. Error!")
		    } else {
		    	$("#linkAUT").attr("href","../../../html/transcripts/AUT/"+thisMatch.page+".html")
		    }
		    thiswit=pageEntities.filter(function (obj){return obj.witness=='NO'})[0];
		    thisMatch=thiswit.entities.filter(function (obj){return obj.match==thisBook+"_"+thisStanza})[0];
		    if (!thisMatch) {
		    	console.log("Book "+thisBook+", stanza "+thisStanza+" does not appear in NO. Error!")
			} else {	
				$("#linkNO").attr("href","../../../html/transcripts/NO/"+thisMatch.page+".html")
			}
			createMenu();
			$("#compareFrame").show();
			doCompare(callbackCompare);
		} else if (view=="editorial") {
			createMenu();
		}
	} else if (typeof makeEdition != "undefined" && !makeEdition) {
		initTranscript("", "", 0);
	}
}

function createMenu() {
	let text="";
	let menu="<nav>\
		  	<label for=\"drop\" class=\"toggle\">≡ Menu</label>\
			  <input type=\"checkbox\" id=\"drop\" />\
			  <ul class=\"menu\"> \
			  	<li>\
			  		<label for=\"drop-2\" class=\"toggle\">Editorial Material</label>\
			  		<a href=\"#\" style=\"height: 16px; position: relative; top:-4px; padding-left:5px; padding-right:5px\">Editorial Material <img src=\"/app/data/makeEdition/teseida/common/images/down-arrow-brown.png\" height=\"8px\" /></a>\
			  		<input type=\"checkbox\" id=\"drop-2\" />\
			  		<ul class=\"box\">";
	for (let i=0; i<editorial.length;i++) {
		menu+="<li><a href=\"../../editorial/menu/"+editorial[i].key+".html\">"+editorial[i].title+"</a></li>";
		if (view=="editorial" && editorial[i].key==key) {
			$("#title").html("Teseida: "+editorial[i].title);
			text+="<h2 id=\""+editorial[i].key+"\">"+editorial[i].title+"</h2>"
			for (let j=0; j<editorial[i].text.length; j++) {
				let attr="", thistext="";
				if (typeof editorial[i].text[j].attr!="undefined") attr=" "+editorial[i].text[j].attr;
				if (typeof editorial[i].text[j].text!="undefined") {
					thistext=adjustText(editorial[i].text[j].text, true);
				}
				text+="<"+editorial[i].text[j].type+attr+">"+thistext+"</"+editorial[i].text[j].type+">"
			}
		}
	}
	menu+="      </ul>\
			  	</li>\
			  </ul>\
			</nav>"
	$("#edMenu").html(menu);
	if (view=="editorial") {
		$("#editorial").html(text);
		$("#editorial").show();
		callbackMenu()
	}
}

function callbackMenu () {
 	//only here if all tasks complete
	var s = new XMLSerializer();
	var d = document;
	var str = s.serializeToString(d);
	$.ajax({
	  url: urlLocal+"/api/writeMakeEdition",
	  type: 'POST',
	  data:  JSON.stringify({id: "Editorial-"+TCCommunity+"-"+key, html: str, community: TCCommunity}),
	  accepts: 'application/json',
	  contentType: 'application/json; charset=utf-8',
	  dataType: 'json'
	}).done(function( data ) {
	   console.log("HTML saved to database for "+key);
	   self.error="";
	  })
	 .fail(function( jqXHR, textStatus, errorThrown) {
	   console.log("Error " + errorThrown);
	});
 }

 function callbackCompare () {
 	//only here if all tasks complete
 	$("#driverScript").remove();
 	let script='<script type="text/javascript">const myBook="'+thisBook+'", myStanza="'+thisStanza+'"</script>';
 	$("head").append(script);
	var s = new XMLSerializer();
	var d = document;
	var str = s.serializeToString(d);
	$.ajax({
	  url: urlLocal+"/api/writeMakeEdition",
	  type: 'POST',
	  data:  JSON.stringify({id: "Compare-"+TCCommunity+"-"+thisBook+"-"+thisStanza, html: str, community: TCCommunity}),
	  accepts: 'application/json',
	  contentType: 'application/json; charset=utf-8',
	  dataType: 'json'
	}).done(function( data ) {
	   console.log("HTML saved to database for Book "+thisBook+", stanza "+thisStanza);
	   self.error="";
	  })
	 .fail(function( jqXHR, textStatus, errorThrown) {
	   console.log("Error " + errorThrown);
	});
 }
 
function initMyTranscript(ms, page, index){
	showThisPage();
}


function getImageInf(callback) {
	$.get(TCimages+"/uri/urn:det:tc:usask:"+imagesCommunity+"/document="+currMS+":folio="+currPage+"?type=IIIF&format=url", function(url) {
		if (url.length) {
		  	var conscript='\r<script type="text/javascript">\r\tconst iiifURL="'+url[0].url+'";</script>';
			$( "head" ).append(conscript);
		}
		callback(null,[]);
	});
}

function getTextPage(callback) {
	$.get(TCurl+"/uri/urn:det:tc:usask:"+TCCommunity+"/document="+currMS+":folio="+currPage+"?type=transcript&format=xml", function(xml) {
		let text=adjustText(xml, true);
		$("#t-c2-text").html("<div>"+text+"</div>");
		$.get(TCurl+"/uri/urn:det:tc:usask:"+TCCommunity+"/document=Glosses-"+currMS+":folio="+currPage+"?type=transcript&format=xml")
			.done(function(glossxml) {
				var parser = new DOMParser();
				var xmlDoc = parser.parseFromString(glossxml, "text/xml");
				let notes = xmlDoc.querySelectorAll("note[type='gloss']");
				for (let i=0; i<notes.length; i++) {
					let myNote=notes[i].innerHTML;
					let line=0;
					let myGloss=adjustText(myNote, false);
					let origin=$(notes[i]).attr("xml:id").split("-")[3];
					let stanza=origin.slice(origin.indexOf("S")+1, origin.indexOf("L"));
					if (origin.indexOf("P")>-1) {
						line=origin.slice(origin.indexOf("L")+1, origin.indexOf("P"));
					} else {
						line=origin.slice(origin.indexOf("L")+1);
					}
					if (line.indexOf("a")>-1) {line=line.slice(0, line.indexOf("a"));}
					if (line.indexOf("b")>-1) {line=line.slice(0, line.indexOf("b"));}
					if (!$("lg[n='"+stanza+"']").find("l[n='"+line+"']").length) {
//						console.log("gloss reference "+origin+" not found on page "+currPage+" of "+currMS);
					} 					
					if ($(notes[i]).attr("rend")=="rm") {
					//if we are in the preface ... look differently
						if (origin=="BPrefaceS40L7P1") {
							let top=$($("#t-c2-text")[0]).find("seg[n='"+origin+"']")[0].offsetTop;
							$("#t-c6-right").append("<div id=\"GR"+origin+"\">"+myGloss+"</div>");
							let glossTop=$("#GR"+origin)[0].offsetTop;
							$($("#GR"+origin)[0]).css({position: "relative", top:(top-glossTop)+"px"});
						} else {
							let top=$($($("#t-c2-text")[0]).find("lg[n='"+stanza+"']")[0]).find("l[n='"+line+"']")[0].offsetTop;
							$("#t-c6-right").append("<div id=\"GR"+currMS+currPage+"-"+stanza+"-"+line+"\">"+myGloss+"</div>");
							let glossTop=$("#GR"+currMS+currPage+"-"+stanza+"-"+line)[0].offsetTop;
							$($("#GR"+currMS+currPage+"-"+stanza+"-"+line)[0]).css({position: "relative", top:(top-glossTop)+"px"});
						}
					} else if ($(notes[i]).attr("rend")=="lm") {
						let top=$($($("#t-c2-text")[0]).find("lg[n='"+stanza+"']")[0]).find("l[n='"+line+"']")[0].offsetTop;
						$("#t-c1-left").append("<div id=\"GL"+currMS+currPage+"-"+stanza+"-"+line+"\">"+myGloss+"</div>");
						let glossTop=$("#GL"+currMS+currPage+"-"+stanza+"-"+line)[0].offsetTop;
						$($("#GL"+currMS+currPage+"-"+stanza+"-"+line)[0]).css({position: "relative", top:(top-glossTop)+"px"});
					} else if ($(notes[i]).attr("rend")=="el") {
						$($("lg[n='"+stanza+"']").find("l[n='"+line+"']")[0]).append("<span type=\"endGL\">"+myGloss+"</span>")
					}  else if ($(notes[i]).attr("rend")=="il") {
						if ($("#GLI"+stanza+line)[0]) {
							$("#GLI"+stanza+line).append("&nbsp;&nbsp;&nbsp;"+myGloss);
						} else {
							$( "<l type=\"ilGL\" id=\"GLI"+stanza+line+"\">&nbsp;&nbsp;&nbsp;"+myGloss+"</l><lb/>").insertBefore($($("lg[n='"+stanza+"']").find("l[n='"+line+"']")));
						}
					} else if ($(notes[i]).attr("rend")=="tlm") {
						$("#transcript-tm-c1").html("<span class=\"gloss\">"+myGloss)+"</span>";
					} else if ($(notes[i]).attr("rend")=="2") {
						$("#transcript-tm-c2").html(myGloss);
					} else if ($(notes[i]).attr("rend")=="blm") {
						$("#transcript-bm-c1").html("<div id=\"GBLM"+currMS+currPage+"-"+stanza+"-"+line+"\">"+myGloss+"</div>");
					} else if ($(notes[i]).attr("rend")=="brm") {
						$("#transcript-bm-c2").html("<div id=\"GBRM"+currMS+currPage+"-"+stanza+"-"+line+"\">"+myGloss+"</div>");
					} else {
//						console.log("found an unexpected gloss placement: "+$(notes[i]).attr("rend"));
					}
				}
				adjustMarginSizes();
				doWords();
//				createPopUps();
				callback(null,[]);
			})
			.fail(function() {
				$("#t-c1-left").css("width","100px");
				adjustMarginSizes();
				console.log("No glosses found for page "+currPage+" in "+currMS);
				doWords();
//				createPopUps();
				callback(null,[]);
		})
	});
}


function showThisPage() {	
	if (prevPage) $("#prevPageLink").html("<a height='18px' id=\"pplA\" href=\""+prevPage+".html\"><img src='/app/data/makeEdition/common/images/iconPrev.png' height='16px'>&nbsp;&nbsp;"+prevPage+"</a>");
	if (nextPage) $("#nextPageLink").html("<a height='18px' id=\"nplA\" href=\""+nextPage+".html\">"+nextPage+"&nbsp;&nbsp;<img src='/app/data/makeEdition/common/images/iconNext.png' height='16px'></a>");
	$("#pageInf").html(makePageInf());
	if (typeof makeEdition != "undefined" && makeEdition) {
		async.waterfall([
			function(callback) {
				getImageInf(callback);
			 },
			 function(arguments, callback) {
				getTextPage(callback);
			 },
			 function(arguments, callback) {
			 	createPopUps(callback)
			 }
		], function (err){ //write out the page now
			var s = new XMLSerializer();
			var d = document;
			var str = s.serializeToString(d);
			console.log("Finished page "+currPage+" in "+currMS)
			$.ajax({
			  url: urlLocal+"/api/writeMakeEdition",
			  type: 'POST',
			  data:  JSON.stringify({id: "Transcript-"+TCCommunity+"-"+currMS+"-"+currPage, html: str, community: TCCommunity}),
			  accepts: 'application/json',
			  contentType: 'application/json; charset=utf-8',
			  dataType: 'json'
			}).done(function( data ) {
			   console.log("HTML saved to database for "+currPage+" in "+currMS);
			   self.error="";
			  })
			 .fail(function( jqXHR, textStatus, errorThrown) {
			  self.success="Error " + errorThrown;
			});
		});
	} 
}


function adjustMarginSizes(){
	let fontSize=$("#t-c1-left").css("font-size");
	let div=$("#t-c1-left");
	let width=getTextSize(div[0].innerHTML, fontSize);
	$("#t-c1-left").css("width", (width+25)+"px");
	fontSize=$("#t-c6-right").css("font-size");
	div=$("#t-c6-right");
	 width=getTextSize(div[0].innerHTML, fontSize);
	$("#t-c6-right").css("width", (width+15)+"px");
	fontSize=$("#transcript-tm-c1").css("font-size");
	div=$("#transcript-tm-c1");
	width=getTextSize(div[0].innerHTML, fontSize);
	$("#transcript-tm-c1").css("width", (width+15)+"px");
	 div=$("#t-c2-text");
	 let lines=$($("#t-c2-text")[0]).find("l");
	 let longestLine=0;
	 	if ($("#book").val()=="Preface") {
		longestLine=500;
	}
	 for (let i=0; i<lines.length;i++) {
	 	fontSize=$(lines[i]).css("font-size");
	 	width=getTextSize($(lines[i])[0].innerHTML, fontSize);
	 	if (width>longestLine) longestLine=width;
	 	if (width<320) width=320;  //takes account of short lines, etc
	 	if ($(lines[i]).attr("type")=="ilGL") width=250;
	 	if ($(lines[i]).attr("id")=="GLI178") width=400;  //very long line!
	 	$(lines[i]).css("width", (width+10+"px"));
	 }
	 $("#t-c2-text").css("width", (longestLine+45)+"px");
	 if ($("#t-c1-left").html()=="" && ($("#transcript-bm-c1").html()!="" || $("#transcript-tm-c1").html()!="")) {
	 	$("#t-c1-left").css("width","100px");
	 }
	 if ($("#t-c1-left").html()=="" && $("#transcript-bm-c1").html()!="" && $("#transcript-tm-c1").html()!="") {
	 	$("#t-c1-left").css("width","100px");
	 }
	 if ($("#t-c1-left").html()=="" && $("#transcript-bm-c1").html()=="" && $("#transcript-tm-c1").html()=="") {
	 	$("#t-c1-left").css("width","100px");
	 }
	 if ($("#transcript-tm-c1").html()!="" && $("#transcript-tm-centre").html()=="" && $("#transcript-tm-c2").html()=="") {
	 	$("#transcript-tm-c1").css("width","700px");
	 }
}

function getTextSize(html, fontSize){
	let text = document.createElement("span");
    document.body.appendChild(text);
	text.style.font = "junicoderegular";
	text.style.fontSize = fontSize;
	text.style.height = 'auto';
	text.style.width = 'auto';
	text.style.position = 'absolute';
	text.style.whiteSpace = 'no-wrap';
	text.innerHTML = html;
	let width = Math.ceil(text.clientWidth);
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
	document.body.removeChild(text);
	return(width+incr);
}


function getLetterWidth (myText, rend) {
	if ($($(myText)[0]).find("hi[rend="+rend+"]").length>0) {
		return Math.ceil($($(myText)[0]).find("hi[rend="+rend+"]").outerWidth(true));
	} else {
		return 0;
	}
}

function openPage(ms, index) {
	currMS=ms;
	currIndex=parseInt(index);
	currPage=eval(currMS)[index].page;
	showThisPage();
}

function makePageInf() {
	let msInf="";
	if (currMS=="AUT") {msInf="Autograph"} else if (currMS=="NO") {msInf="Naples"}
	let pInf=msInf+" "+currPage+". ";
	if (eval(currMS)[currIndex].init.book=="Preface" && eval(currMS)[currIndex].end.book=="Preface") {
		pInf+="Preface"
	} else if (eval(currMS)[currIndex].init.book=="Preface" && eval(currMS)[currIndex].end.book!="Preface") {
		pInf+="Preface–Book "+eval(currMS)[currIndex].end.book+", Stanza "+eval(currMS)[currIndex].end.stanza;
	} else if (eval(currMS)[currIndex].init.book==eval(currMS)[currIndex].end.book && eval(currMS)[currIndex].init.stanza==eval(currMS)[currIndex].end.stanza) {
		pInf+="Book "+eval(currMS)[currIndex].init.book+", Stanza "+eval(currMS)[currIndex].init.stanza;
	} else if (eval(currMS)[currIndex].init.book==eval(currMS)[currIndex].end.book && eval(currMS)[currIndex].init.stanza!=eval(currMS)[currIndex].end.stanza) {
		pInf+="Book "+eval(currMS)[currIndex].init.book+", Stanzas "+eval(currMS)[currIndex].init.stanza+"–"+eval(currMS)[currIndex].end.stanza;
	} else if (eval(currMS)[currIndex].init.book!=eval(currMS)[currIndex].end.book) {
		pInf+="Book "+eval(currMS)[currIndex].init.book+", Stanza "+eval(currMS)[currIndex].init.stanza+"–Book "+eval(currMS)[currIndex].end.book+", Stanza "+eval(currMS)[currIndex].end.stanza;
	}
	if (eval(currMS)[currIndex].init.book=="Preface") {
		let conscript='\r<script type="text/javascript">\r\tconst currBook="Preface", currStanza="-";</script>';
		$( "head" ).append(conscript);
	} else {
		let conscript='\r<script type="text/javascript">\r\tconst currBook="'+eval(currMS)[currIndex].init.book+'", currStanza="'+eval(currMS)[currIndex].init.stanza+'";</script>';
		$( "head" ).append(conscript);
	}
	return(pInf);
}

function zeroTranscripts () {
	$("#t-c1-left").html("");
	$("#t-c6-right").html("");
	$("#t-c2-text").html("");
	$("#transcript-tm-c1").html("");
	$("#transcript-tm-centre").html("");
	$("#transcript-tm-c2").html("");
	$("#transcript-bm-c1").html("");
	$("#transcript-bm-centre").html("");
	$("#transcript-bm-c2").html("");
}

function adjustText(xml, isText) {  //sets up popups within text
	let text=xml.replace("<text>","").replace("</text>","").replace("<body>","").replace("</body>","").replaceAll("<lb/><lb/>","<br>").replaceAll("<lb/>","<br>");
	//first, are there any notes in here???
	let isNote=text.indexOf("type=\"ed\"");
	if (isNote==-1) isNote=text.indexOf("type='ed'");
	if (isNote>-1) isNote=text.lastIndexOf("<note ", isNote);
	let startXML="";
	while (isNote>-1) {
		startXML=text.slice(0, isNote);
		isNote=text.indexOf(">", isNote)
		let endNote=text.indexOf("</note>", isNote);
		let textNote=text.slice(isNote+1, endNote);
		if (isText) {var prefix=""} else {var prefix="g"};
		if (textNote.indexOf("/il-")>-1 || textNote.indexOf("/rm-")>-1 || textNote.indexOf("/tm-")>-1 || textNote.indexOf("/lm-")>-1) {
			text=startXML+text.slice(endNote+7);	
		} else {
			text=startXML+" <span class=\"showTip note"+noteNumber+prefix+" noteFlag\"><img src=\"/app/data/makeEdition/common/images/noteIcon.png\" height=\"12px\"></span> "+text.slice(endNote+7);
			$("#popUps").append("<div id=\"note"+noteNumber+prefix+"\">"+textNote+"</div>");
			noteNumber++; 
		}
		isNote=text.indexOf("type=\"ed\"");
		if (isNote==-1) isNote=text.indexOf("type='ed'");
		if (isNote>-1) isNote=text.lastIndexOf("<note ", isNote);
	}
	isNote=text.indexOf("type=\"cw\"");
	if (isNote>-1) {
		isNote=text.lastIndexOf("<note ", isNote);
		startXML=text.slice(0, isNote)
		let endNote=text.indexOf("</note>", isNote);
		let textNote=text.slice(isNote+16, endNote);
		text=startXML+text.slice(endNote+7);
		$("#transcript-bm-centre").html(textNote);
	}
	return(text);
}

function doWords() {
	let lines=$("l");
	for (let i=0; i<lines.length; i++) {
		if ($(lines[i]).attr("type")!="ilGL") {
			doWordsLine(lines[i]);
		}
	}
}

function doWordsLine(xmlLine) {
	if ($(xmlLine).children().length==0) {
		let myline=$(xmlLine).html().split(" ");
		let newArray=[];
		for (let j=0; j<myline.length; j++) {
			if (punctuation.includes(myline[j])) {
				if (j==0) {
					newArray.push(myline[j]+" "+myline[1]);
					j++;
				} else {
					newArray[newArray.length-1]=newArray[newArray.length-1]+" "+myline[j];
				}
			} else {
				newArray.push(myline[j]);
			}
		}
		let newLine="";
		for (let j=0; j<newArray.length; j++) {
			newLine+='<w n="'+(j+1)+'">'+newArray[j]+'</w>';
			if (j<newArray.length-1) newLine+=" ";
		}
		$(xmlLine).html(newLine);
	} else { //we have embedded xml .. so cut it into elements
		//xml could be embedded in a word too lol. If 
		let newArray=[];
		let newline=$(xmlLine).html();
		let startEl=newline.indexOf("<");
		let openElements=[]; //pop and pull elements off and on as they open and close
		let startPos=0;
		if (startEl>-1) {
			let startStr=newline.slice(startPos, startEl);
			if (startStr!="") splitWords(newArray, startStr, openElements);
			newline=newline.slice(startEl);
			handleXML(newArray, newline, xmlLine, openElements);
		}
		constructWElements(newArray, xmlLine);
	 }
}


function handleXML(newArray, myline, line, openElements) {
	//could be start or end element...
	//get startEl... could be several, one after another lol
	let endEl=myline.indexOf(">");
	let element="";
	let closeEl="";
	let fullElement="";
	let startingEl=true;
	//if this an empty element, just <br>, add <br> to words array, but we don't increment word number
	//by definition ... we should not have any empty elements except <br> here
	let elString=myline.slice(1, endEl);
	if (elString[0]=="/") {
		elString=elString.slice(1);
		startingEl=false;
		closeEl=elString;
	}
	myline=myline.slice(endEl+1);
	if (elString.indexOf(" ")>-1) {
		element=elString.slice(0, elString.indexOf(" "));
		fullElement=elString;
		
	} else {
		element=fullElement=elString;
	}
	if (element=="br") {
		newArray.push({word: "<br>", start: JSON.parse(JSON.stringify(openElements)), end:[], finished:false});
		//more elements... or not ...
		if (myline.indexOf("<")>-1) {
			//deal with words before ...
			let startEl=myline.indexOf("<");
			let startStr=myline.slice(0, startEl);
	 		if (startStr!="") splitWords(newArray, startStr, openElements);
	 		myline=myline.slice(startEl);
			handleXML(newArray, myline, line, openElements);
			return;
		} else {
			splitWords(newArray, myline, openElements);
			return;
		}
	} else {  //track to the end of the element if it is in this word...
		let testWord="";
		if (startingEl) { 
			if (fullElement.indexOf('span class="showTip ')>-1) {
				let endSpan=myline.indexOf("</span>");
				let span=myline.slice(0, endSpan+7);
				myline=myline.slice(endSpan+7);
				if (myline[0]==" ") myline=myline.slice(1);
				newArray.push({word: "<"+fullElement+">"+span, start: JSON.parse(JSON.stringify(openElements)), end: closeEl, finished:true});
			} else {
				openElements.push({gi:element, element:fullElement, written: false});
			}
			//more xml coming..?
			let startEl=myline.indexOf("<");
			if (startEl>-1) {
				let startStr=myline.slice(0, startEl);
				if (startStr!="") splitWords(newArray, startStr, openElements);
				myline=myline.slice(startEl);
				handleXML(newArray, myline, line, openElements);
				return;
			} else {
				splitWords(newArray, myline, openElements);
				return;
			}
		} else { //closing element...could correspond to end of word or not 
			if (closeEl==openElements[openElements.length-1].gi) {
				openElements.pop();
				newArray.push({word: testWord, start: JSON.parse(JSON.stringify(openElements)), end: closeEl, finished:false});
				//if this is the end of a word..space following ...
				if (myline[0]==" ") {
					newArray[newArray.length-1].finished=true;
					myline=myline.slice(1);
				} else {
					//no need to do anything here; will be caught in go-around
				}
			} else { //error!
//				console.log("closing element "+closeEl+" found; last open is "+openElements[openElements.length-1].gi)		
			};
		//case one. this element ends in this word
			for (let k=0; k<myline.length; k++) {
				if (myline[k]!="<" && myline[k]!=" ") {
					testWord+=myline[k];
				} else if (myline[k]=="<") {
					if (testWord!="") newArray.push({word:testWord, start: JSON.parse(JSON.stringify(openElements)), finished: false});
					myline=myline.slice(k)
					handleXML(newArray, myline, line, openElements); //just keep recursing
					return;
				} else if (myline[k]==" ") {
					//we have reached the end of a word!
					if (testWord!="") {
						newArray.push({word:testWord, start: JSON.parse(JSON.stringify(openElements)), finished: true});
						myline=myline.slice(k);
						k=0;
						testWord="";
					}
				}
			}
	  	}
		if (testWord!="") newArray.push({word:testWord, start: JSON.parse(JSON.stringify(openElements)), finished: true});
	}
}



function splitWords(newWords, myStr, openElements) {  //newWord true if < at the beginning of a word, false if it is not
	let mywords=myStr.split(" ");
	if (mywords[0]=="") {
		mywords.shift();
		if (newWords.length>0) newWords[newWords.length-1].finished=true;
	}
	for (let j=0; j<mywords.length; j++) {
		newWords.push({word: mywords[j], start:JSON.parse(JSON.stringify(openElements)), finished:true});
	}
	if (newWords.length>0 && newWords[newWords.length-1].word=="") {
		newWords.pop();
	} else if (myStr.charAt(myStr.length-1)!=" ") {
		newWords[newWords.length-1].finished=false; //marker to concatenate...
	}
}

function constructWElements(newArray, line) {
	let newStr="";
	let newWord="";
	let counter=0;
	newArray[newArray.length-1].finished=true;
	for (let i=0; i<newArray.length; i++) {
		if (newArray[i].finished) {	
			if (newArray[i].word=="<br>") {
				newStr+="<br/>"
			} else if (newArray[i].word.indexOf('span class="showTip ')>-1) {
				newStr+=newArray[i].word;
			} else {
				for (let j=0; j<newArray[i].start.length; j++) {
					newWord+="<"+newArray[i].start[j].element+">"
				}
				newWord+=newArray[i].word;
				if  (typeof newArray[i].end!="undefined") newWord+="</"+newArray[i].end+">";
				for (let j=newArray[i].start.length-1; j>-1; j--) {
					newWord+="</"+newArray[i].start[j].gi+">"
				}
				newStr+='<w n="'+((counter+1)*1)+'">'+newWord+'</w>';
				newWord="";
				counter++;
				if (i<newArray.length-1) {
					for (let j=0; j<newArray[i].start.length; j++) {
						if (typeof newArray[i+1].start[j]!="undefined" && newArray[i].start[j].element==newArray[i+1].start[j].element) {
							newStr+="<"+newArray[i].start[j].element+">";
						}
					}
					newStr+=" ";
					for (let j=newArray[i].start.length-1; j>=0; j--) {
						if (typeof newArray[i+1].start[j]!="undefined" && newArray[i].start[j].gi==newArray[i+1].start[j].gi) {
							newStr+="</"+newArray[i].start[j].gi+">";
						}
					}
				}
			}
		} else { //add unfinished to next array word...note that by definition ??? next word should have same openElements as this one??
			for (let j=0; j<newArray[i].start.length; j++) {
				if (typeof newArray[i].end=="undefined") newWord+="<"+newArray[i].start[j].element+">"
			}
			if (newArray[i].word!="") newWord+=newArray[i].word;
			if (typeof newArray[i].end!="undefined") newWord+="</"+newArray[i].end+">";
		}
	}
	$(line).html(newStr);
}

function createPopUps(callback){ //read the apparatus for each word
	//what books are on this page?
	let divs=$("div[type=G]");
	async.mapSeries(divs, function(mydiv, cb4) {
//	for (let i=0; i<divs.length; i++) {
		let myBook=$(mydiv).attr("n");
		if (typeof apparatusXML[myBook]=="undefined") {
			var xmlurl=urlSrc+"/xml/"+myBook+"/regcollapp.xml"; 
	/*		 $.ajax({
                url: xmlurl,
                book: myBook,
                div: i,
                success: function(xml) {
                	apparatusXML[this.book]=xml;
					writePopApps(this.book, this.div);
            	}
            }); */
			$.get(xmlurl, function(xml) {
				apparatusXML[myBook]=xml;
				writePopApps(myBook, mydiv, cb4);
			}); 
		} else {
			writePopApps(myBook, mydiv, cb4);
		}
	}, function (err) {
		callback(null);
	})
}

function writePopApps(myBook, div,callback) {
	let lgs = $(div).find("lg");
	let nBook=myBook;
//	for (k=0; k<lgs.length; k++) {
	async.mapSeries(lgs, function(nlg, cb2) {
		let lg=$(nlg).attr("n");
		let lines=$(nlg).find("l");
		if (currMS=="AUT") {
			var totherMS="NO";
		} else {
			var totherMS="AUT";
		}
//		for (i=0; i<lines.length; i++) {
		async.mapSeries(lines, function(nline, cb3) {
			//get the apparatus for this line and the matching line in the other wit
			let line=$(nline).attr("n");
			if (typeof line=="undefined") { //probably interlinear, so lets just go around again
				cb3(null);
			} else {
				let msUrl=TCurl+"/uri/urn:det:tc:usask:"+TCCommunity+"/entity="+nBook+":lg="+lg+":line="+line+":document="+totherMS+"?type=transcript&format=xml";
				 $.ajax({
					url: msUrl,
					book: nBook,
					lg: lg,
					line: line,
					success: function(matchLine) {
						let newLine = document.createElement("l");
						if (typeof matchLine[0]=="undefined") {
					//		return; //no matching line
							cb3(null);
						} else {
							$(newLine).html(matchLine[0].text);
							doWordsLine(newLine);
							let otherWitWords=$(newLine).find("w");
							//now pull the apparatus together...get it from the apparatus
							let words=$("div[n="+this.book+"] lg[n="+this.lg+"] l[n="+this.line+"]").find('w');
							if (this.book=="Preface") {
								var myBook="0"} else {
								var myBook=this.book
							}
							let id="APP-B"+myBook+"S"+this.lg+"L"+this.line;
							let apps=$($(apparatusXML[this.book]).find("#"+id)[0]).find("app");
							for (j=0; j<words.length; j++) {
								let wordn=$(words[j]).attr("n");
								let lemma="";
								let otherRdg="";
								let baseRdg="";
								if (currMS=="AUT") {
									var otherMS="NO";
								} else {
									var otherMS="AUT";
								}
								for (let k=1; k<apps.length; k++) {
									//we need to identify the last lemma in either ms...
									if ($($(apps[k]).find("ref[n="+currMS+"]")[0]).attr("from")==wordn) {
										let endLem=k;
										while ($($(apps[endLem]).find("ref[n="+currMS+"]")[0]).attr("from")==wordn ){
											lemma+=$($(apps[endLem]).find("lem")[0]).text()+" ";
											endLem++;
										}
										//in case of phrases... follow the lemma from k to endLem
										let m=k;
										let lastWrdFrom=-1;
										while (m<endLem ) {
											let otherWrdFrom=parseInt($($(apps[m]).find("ref[n="+otherMS+"]")[0]).attr("from"))-1;
											let otherWrdTo=parseInt($($(apps[m]).find("ref[n="+otherMS+"]")[0]).attr("to"))-1;
											if (otherWrdTo==32766) {
												otherWrdTo=otherWitWords.length-1;
											}
											if (otherWrdFrom!=lastWrdFrom) {
												otherRdg+=$(otherWitWords[otherWrdFrom]).text()+" ";
											}
											while (otherWrdFrom<otherWrdTo) {
												otherRdg+=$(otherWitWords[++otherWrdFrom]).text()+" ";
											}
											lastWrdFrom=otherWrdTo;
											m++;
										}
										m=k;
										lastWrdFrom=-1;
										while (m<endLem ) {
											let thisWrdFrom=parseInt($($(apps[m]).find("ref[n="+currMS+"]")[0]).attr("from"))-1;
											let thisWrdTo=parseInt($($(apps[m]).find("ref[n="+currMS+"]")[0]).attr("to"))-1;
											if (thisWrdTo==32766) {
												thisWrdTo=words.length-1;
											}
											if (thisWrdFrom!=lastWrdFrom) {
												baseRdg+=$(words[thisWrdFrom]).text()+" ";
											}
											while (thisWrdFrom<thisWrdTo) {
												baseRdg+=$(words[++thisWrdFrom]).text()+" ";
											}
											lastWrdFrom=thisWrdTo;
											m++;
										}
										//right, assemble the apparatus...
										let puId="PU-B"+myBook+"S"+this.lg+"L"+this.line+"W"+wordn;
										let popApp="<div id=\""+puId+"\" type=\"popApp\"><h3 style=\"margin-left:50px; margin-bottom: 0px\">Variants at Book "+myBook+", Stanza "+this.lg+", line "+this.line+", word "+wordn+"</h3><p style=\"margin-left: 20px; margin-top:0px\">Edition: "+lemma+"<br>"+currMS+": "+baseRdg+"<br>"+otherMS+": "+otherRdg+"</p></div>";
										$("#popUps").append(popApp);
										$(words[j]).addClass("showTip "+puId);
										k=apps.length;  //stop here
									}
								}
							} 
							cb3(null);
						}
					},
					error: function() {
           				 console.log('Error occurred reading book '+nBook+" stanza "+lg+" line "+line+" in MS "+totherMS);
           				 cb3(null);
       				}
				})
            }
		}, function (err){
			cb2(null);
		});
	}, function (err){
		callback(null);
	});
}

function doCompare (callback){
	let myBook=$("#book").val();
	if (typeof apparatusXML[myBook]=="undefined") {
		var xmlurl=urlSrc+"/xml/"+myBook+"/regcollapp.xml"; 
		$.get(xmlurl, function(xml) {
			apparatusXML[myBook]=xml;
			writeCompare(myBook, $("#stanza").val(), callback);
		}); 
	} else {
		writeCompare(myBook, $("#stanza").val(), callback);
	}
}

function writeCompare(book, stanza, callback) {
	//get the lines in the book and stanza...
//	window.history.pushState(null, null, "index.html?view=compare&book="+book+"&stanza="+stanza);
	//deal with cases of Rubrics, always beginning with R
	if (stanza[0]=="R") {
		$("#compareEdition").html("");
		$("#compareAutograph").html("");
		$("#compareNaples").html("");
		let noXML="";
		let autXML="";
		async.waterfall([
			function(cb) { //AUT
				$.get(TCurl+"/uri/urn:det:tc:usask:TSBO/entity="+book+":line="+stanza+":document=AUT?type=transcript&format=xml")
				.done(function(lineXML) {
					autXML=lineXML;
					cb(null, null);
				})
				.fail(function() {
					console.log("Error, can't find book "+book+", stanza "+stanza+" in ms AUT");
					cb(null, null);
				});
			},
			function(x, cb) { //NO
				$.get(TCurl+"/uri/urn:det:tc:usask:TSBO/entity="+book+":line="+stanza+":document=NO?type=transcript&format=xml")
				.done (function(lineXML) {
					noXML=lineXML;
					cb(null, null);
				})
				.fail(function() {
					console.log("Error, can't find book "+book+", stanza "+stanza+" in ms NO");
					cb(null, null);
				});
			},
		], function (err, result) {
		//here we write out the base, AUT and NO
			let appbook=book;
			if (appbook=="Preface") appbook="0";
			let id="APP-B"+appbook+"L"+stanza;
			let apps=$($(apparatusXML[book]).find("#"+id)[0]).find("app");
			let autWords=[];
			if (autXML.length>0) {
				let newAUT = document.createElement("l");
				$(newAUT).html(autXML[0].text);
				doWordsLine(newAUT);
				autWords=$(newAUT).find("w");
			}
			let noWords=[];
			if (noXML.length>0) {
				let newNO = document.createElement("l");
				$(newNO).html(noXML[0].text);
				doWordsLine(newNO);
				noWords=$(newNO).find("w");
			}
			let baseComp="";
			let autComp="";
			let noComp="";
			let autLast=-1;
			let noLast=-1;
			for (let i=1; i<apps.length; i++) {
				let isVar=false;
				if ($(apps[i]).find("rdg").length>1)  isVar=true;
				if (isVar) {
					baseComp+="<span class='cVar'>"+$($(apps[i]).find("lem")[0]).html()+"</span> ";
				} else {
					baseComp+="<span>"+$($(apps[i]).find("lem")[0]).html()+"</span> ";
				}
				//get AUT here...if it exists! (might be in rubric or somet)
				if (autWords.length>0) {
					let autFrom=parseInt($($(apps[i]).find("ref[n=AUT]")[0]).attr("from"))-1;
					let autTo=parseInt($($(apps[i]).find("ref[n=AUT]")[0]).attr("to"))-1;
					if (autTo==32766) autTo=autWords.length-1;
					if (autFrom>autLast) {
						while (autFrom<=autTo) {
							if (autTo>autWords.length-1) {
								autFrom=autTo+1;
								autLast=autTo;
							} else {
								if (isVar) {
									autComp+="<span class='cVar'>"+$(autWords[autFrom]).html()+"</span> ";
								} else {
									autComp+=$(autWords[autFrom]).html()+" ";
								}
								autFrom++;
							}
						}
						autLast=autTo;
					}
				}
				if (noWords.length>0) {
					let noFrom=parseInt($($(apps[i]).find("ref[n=NO]")[0]).attr("from"))-1;
					let noTo=parseInt($($(apps[i]).find("ref[n=NO]")[0]).attr("to"))-1;
					if (noTo==32766) noTo=noWords.length-1;
					if (noFrom>noLast) {
						while (noFrom<=noTo) {
							if (noTo>noWords.length-1) {
								noFrom=noTo+1;
								noLast=noTo;
							} else {
								if (isVar) {
									noComp+="<span class='cVar'>"+$(noWords[noFrom]).html()+"</span> ";
								} else {
									noComp+=$(noWords[noFrom]).html()+" ";
								}
								noFrom++;
							}
							noLast=noTo;
						}
					}
				}
			}
			$("#compareEdition").append("<p>"+baseComp+"</p>");
			$("#compareAutograph").append("<p>"+autComp+"</p>");
			$("#compareNaples").append("<p>"+noComp+"</p>");
			return(callback(null));
		});
	} else {
		$.get(TCurl+"/uri/urn:det:tc:usask:TSBO/entity="+book+":lg="+stanza+":line=*?type=list")
		.done(function(lines) {
			$("#compareEdition").html("");
			$("#compareAutograph").html("");
			$("#compareNaples").html("");
			async.mapSeries(lines,function(line, cb2){ //one line at a time!
				let noXML="";
				let autXML="";
				async.waterfall([
					function(cb) { //AUT
						$.get(TCurl+"/uri/urn:det:tc:usask:TSBO/entity="+book+":lg="+stanza+":line="+line.name+":document=AUT?type=transcript&format=xml")
						.done(function(lineXML) {
							autXML=lineXML;
							cb(null, null);
						})
						.fail(function() {
							console.log("Error, can't find book "+book+", stanza "+stanza+", line "+line.name+" in ms AUT");
							cb(null, null);
						});
					},
					function(x, cb) { //NO
						$.get(TCurl+"/uri/urn:det:tc:usask:TSBO/entity="+book+":lg="+stanza+":line="+line.name+":document=NO?type=transcript&format=xml")
						.done (function(lineXML) {
							noXML=lineXML;
							cb(null, null);
						})
						.fail(function() {
							console.log("Error, can't find book "+book+", stanza "+stanza+", line "+line.name+" in ms NO");
							cb(null, null);
						});
					},
				], function (err, result) {
					//here we write out the base, AUT and NO
					let appbook=book;
					if (appbook=="Preface") appbook="0";
					let id="APP-B"+appbook+"S"+stanza+"L"+line.name;
					let apps=$($(apparatusXML[book]).find("#"+id)[0]).find("app");
					let autWords=[];
					if (autXML.length>0) {
						let newAUT = document.createElement("l");
						$(newAUT).html(autXML[0].text);
						doWordsLine(newAUT);
						autWords=$(newAUT).find("w");
					}
					let noWords=[];
					if (noXML.length>0) {
						let newNO = document.createElement("l");
						$(newNO).html(noXML[0].text);
						doWordsLine(newNO);
						noWords=$(newNO).find("w");
					}
					let baseComp="";
					let autComp="";
					let noComp="";
					let autLast=-1;
					let noLast=-1;
					for (let i=1; i<apps.length; i++) {
						let isVar=false;
						if ($(apps[i]).find("rdg").length>1)  isVar=true;
						if (isVar) {
							baseComp+="<span class='cVar'>"+$($(apps[i]).find("lem")[0]).html()+"</span> ";
						} else {
							baseComp+="<span>"+$($(apps[i]).find("lem")[0]).html()+"</span> ";
						}
						//get AUT here...if it exists! (might be in rubric or somet)
						if (autWords.length>0) {
							let autFrom=parseInt($($(apps[i]).find("ref[n=AUT]")[0]).attr("from"))-1;
							let autTo=parseInt($($(apps[i]).find("ref[n=AUT]")[0]).attr("to"))-1;
							if (autTo==32766) autTo=autWords.length-1;
							if (autFrom>autLast) {
								while (autFrom<=autTo) {
									if (autTo>autWords.length-1) {
										autFrom=autTo+1;
										autLast=autTo;
									} else {
										if (isVar) {
											autComp+="<span class='cVar'>"+$(autWords[autFrom]).html()+"</span> ";
										} else {
											autComp+=$(autWords[autFrom]).html()+" ";
										}
										autFrom++;
									}
								}
								autLast=autTo;
							}
						}
						if (noWords.length>0) {
							let noFrom=parseInt($($(apps[i]).find("ref[n=NO]")[0]).attr("from"))-1;
							let noTo=parseInt($($(apps[i]).find("ref[n=NO]")[0]).attr("to"))-1;
							if (noTo==32766) noTo=noWords.length-1;
							if (noFrom>noLast) {
								while (noFrom<=noTo) {
									if (noTo>noWords.length-1) {
										noFrom=noTo+1;
										noLast=noTo;
									} else {
										if (isVar) {
											noComp+="<span class='cVar'>"+$(noWords[noFrom]).html()+"</span> ";
										} else {
											noComp+=$(noWords[noFrom]).html()+" ";
										}
										noFrom++;
									}
									noLast=noTo;
								}
							}
						}
					}
					$("#compareEdition").append("<p>"+baseComp+"</p>");
					$("#compareAutograph").append("<p>"+autComp+"</p>");
					$("#compareNaples").append("<p>"+noComp+"</p>");
					cb2(null);
				})
			}, function (err) {
				return(callback(err));
			});
		})
		.fail (function() {
			console.log("Error, can't find book "+book+", "+stanza);
			return(callback(null));
		});
	}
}