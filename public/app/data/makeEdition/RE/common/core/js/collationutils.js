var currWits=[], outWits=[], thisVMapApp=[];

function formatLink (source) {
	let name="", link="";
	let topEntity=source.slice(0, source.indexOf(":"));
	let restName=source.slice(source.indexOf(":")+1);
	let slices=source.split(":");
	let startLink=source.slice(0, source.lastIndexOf(":"));
	let endLink=source.slice(source.lastIndexOf(":")+1);
	if (typeof aliases!="undefined") {
		if (aliases.filter(item=>item.topEntity==topEntity && item.context=="all").length>0) {
			name=aliases.filter(item=>item.topEntity==topEntity && item.context=="all")[0].alias;
		} else {
			name=topEntity;
		}
		for (let i=1; i<slices.length; i++) {
			let parts=slices[i].split("=");
			if (aliases.filter(item=>item.key==parts[0] && item.context=="menus").length>0) {
				let pName=aliases.filter(item=>item.key==parts[0] && item.context=="menus")[0].alias;
				if (pName=="") {
					name+=" "+parts[1];
				} else {
					name+=" "+pName+" "+parts[1];
				}
			}
			if (i<slices.length-1) {
				name+=",";
			}
		}
	} else if (context=="transcribe") {
		name=topEntity+" "+restName;
	}
	link=startLink+"/"+endLink+".html";
	return({"name":name, "link":link});
}

function createLinks(){
	let prevLink="", nextLink="";
	if (prevCollation!="undefined") {
		let previous=formatLink(prevCollation);			
		prevLink="<span id='prevlink'><a class='cla' href='../"+previous.link+"'><img class='cli' src='/app/data/makeEdition/common/core/images/iconPrev.png' height='24'> "+previous.name+"</a> </span>"
	} else {
		prevLink="<span></span>";
	}
	if (nextCollation!="undefined") {
		let next=formatLink(nextCollation);
		nextLink="<span id='nextlink'> <a  class='cla' href='../"+next.link+"'>"+next.name+" <img class='cli' src='/app/data/makeEdition/common/core/images/iconNext.png' height='24'></a> </span>"
	} else {
		nextLink="<span></span>";
	}
	let folder=currEntity.slice(0, currEntity.lastIndexOf(":"));
	let file=currEntity.slice(currEntity.lastIndexOf(":")+1)+".xml";
	$("#collXMLLink").attr("href","../../../xml/collation/"+folder+"/"+file);
	$("#prevColl").html(prevLink);
	$("#nextColl").html(nextLink);
	$("#collSummary").html(formatLink(currEntity).name);
	let parts=currEntity.split(":")
	let nextEntities=entityPages.filter(entity=>entity.entity==parts[0])[0].subentities;
	let i=1;
	for (;i<parts.length-1; i++ ) {
		nextEntities=nextEntities.filter(entity=>entity.entity==parts[i])[0].subentities;
	}
	let witnesses=nextEntities.filter(entity=>entity.entity==parts[i])[0].witnesses;
	let thisPage=witnesses.filter(witness=>witness.name==currMS)[0].pages[0];
	let dirName=currEntity.slice(0,currEntity.lastIndexOf(":"));
	let transcriptMS=getDefaultMs(currEntity);
	let compEntity=compareIndex.filter(myEntity=>myEntity.entity==currEntity)[0].index;
	$("#collTranscriptLink").attr("href","javascript:getMSLine('"+currEntity+"','"+transcriptMS+"')");
	$("#collCompareLink").attr("href","javascript:getCompareFromCollation('"+compEntity+"','"+currEntity+"','"+transcriptMS+"')");
	if (!regState) {
		$("#collSpellingSpan").show();
		$("#collStateTitle").attr("title", "Check box to show original spellings")
		$("#collStateText").html("Regularized spelling")
		$("#collSpellingBox").attr("onclick","location.href='../../collationreg/"+dirName+"/"+parts[parts.length-1]+".html'");
		if (!wordState) {
			$("#collSpellingSpan").attr("title", "Check box to see unregularized forms sorted by words");
			$("#collStateWords").html("By words")
			$("#collWordsBox").attr("onclick","location.href='../../collationorigwords/"+dirName+"/"+parts[parts.length-1]+".html'");
		} else {
			$("#collStateTitle").attr("title", "Check box to show regularized spellings only")
			$("#collStateWords").html("By lemma")
			$("#collSpellingSpan").attr("title", "Check box to see unregularized forms sorted by collation lemma");
			$("#collWordsBox").attr("onclick","location.href='../../collationorig/"+dirName+"/"+parts[parts.length-1]+".html'");
		}
	} else {
		$("#collSpellingBox").attr("onclick","location.href='../../collationorig/"+dirName+"/"+parts[parts.length-1]+".html'");
		$("#collStateText").html("Original spelling")
	}
}

function makeFromAppME(XMLapparatus, currMSS, apparatus, onlyReg, words, hasVMap, transform, isPopApp, entity, callback) {
	var inWits=[], outMSS=[], VMapApp=[];
	let parts=entity.split(":");
	var collation=JSON.parse(apparatus);
	//there could be duplicate readings, a by-product of overlapping variants. Resolve them.
	//we are loading both the xml and the json app. No need to have both, really
	collation=resolveDuplicatesME(collation);
	let appText="";
	if (!transform && !isPopApp) {
		createLinks();
		XMLapparatus=XMLapparatus.replace(/&lt;/g,"<");
		if (!hasVMap) {
			$('#collation').html(XMLapparatus);
			var apps= $('#collation app');
		}
		else {
			$('#collationText').html(XMLapparatus);
			var apps= $('#collationText app');
		}
		//deal with the first app, to get wits with this line etc
		var firstApp=$(apps[0]);
		var firstRdg=firstApp.find('rdg')[0];
	///  ???	if ($(firstRdg).attr('type')!="lac") alert("First reading should list out mss...");
		let ePages=entityPages.filter(entity=>entity.entity==parts[0])[0].witnesses;
		var wit=$(firstRdg).children()[0];
		var wits=$(wit).children();
		for (var k=0; k<wits.length; k++) {
			var thisWit=$(wits[k]).text();
			if (currMSS.filter(ms=>ms.name==thisWit).length==1) {
				outMSS.push(thisWit);
				for (let b=0; b<currMSS.length; b++) {
					if (currMSS[b].name==thisWit) {
						currMSS.splice(b, 1);
						b--;
					}
				}
				
			}
		}
		for (var m=0; m<currMSS.length; m++) {
			let witName=currMSS[m].name;
			if (currMSS[m].name=="Base") witName="Edition"
			inWits.push("<a href='javascript:getMSLine(\""+currEntity+"\",\""+currMSS[m].name+"\")'>"+witName+"</a>");
		}
		appText+="<div id='VMLine'><p class='lemma'>"+label(currEntity)+" is in "+currMSS.length+" witnesses ("+inWits.join(" ")+")</p>" ;
		if (outMSS.length==1) appText+="<p class='lemma' id='VMLout'> OUT 1 witness ("+outMSS[0]+")</p>";
		else if (outMSS.length>1) appText+="<p class='lemma'  id='VMLout'> OUT "+outMSS.length+" witnesses ("+outMSS.join(" ")+")</p>";
		appText+="</div><hr/>";
		for (let a=0; a<currMSS.length; a++) {
			currWits.push(currMSS[a].name);
		}
		outWits=outMSS;
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
								appText+="<a href='javascript:getMSLine(\""+currEntity+"\",\""+thisWit+"\")'>"+thisWit+"</a> ";
								VMapApp[n].variants[j].wits.push(thisWit);
								nwits++;
							}  
					   }
					} else {
						collation.structure.apparatus[i].readings[j].witnesses=moveBase(collation.structure.apparatus[i].readings[j].witnesses);
						for (var m=0; m<collation.structure.apparatus[i].readings[j].witnesses.length; m++) {
							var thisWit=collation.structure.apparatus[i].readings[j].witnesses[m];
		//					if (thisWit=="Base") nwits--;
		//					else {
								let witName=thisWit;
								if (thisWit=="Base") witName="Edition";
								appText+="<a href='javascript:getMSLine(\""+currEntity+"\",\""+thisWit+"\")'>"+witName+"</a> ";
								VMapApp[n].variants[j].wits.push(thisWit);
		//					}
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
							appText+="<a href='javascript:getMSLine(\""+currEntity+"\",\""+overWits[x].wits[y]+"\")'>"+overWits[x].wits[y]+"</a> ";
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
			appText='<ab n="'+community+':entity='+currEntity+'-APP">';
		}
		if (isPopApp) appText="<div>"
		for (var i=0, n=0; i<collation.structure.apparatus.length; i++, n++) {
			if (transform) {
				rdgNo=0;
				appText+='<app from="'+((i+1)*2)+'" n="CTP2:entity='+entities[currentEntity].name+':line='+currEntity+'" to="'+((i+1)*2)+ '" type="main">';
			} else { //here we are making the popApp
				if (isPopApp) {
					appText+="<div class='PUVarUnit' start='"+collation.structure.apparatus[i].start+"' end='"+collation.structure.apparatus[i].end+"'>";
				} else {
					appText+="<div class='VMAdiv' id='VMAdiv"+n+"' data-n='"+n+"'>";
				}
			}
			VMapApp.push({lemma:"", variants:[]});
			for (var j=0; j<collation.structure.apparatus[i].readings.length; j++) {
				if (collation.structure.apparatus[i].readings[j].created) continue;
				if  (collation.structure.apparatus[i].readings[j].overlap_status=="duplicate") continue; //there is an apparatus2, dealt with below
				if ((collation.structure.apparatus[i].readings[j].type=="om" || collation.structure.apparatus[i].readings[j].type=="om_verse") && collation.structure.apparatus[i].readings[j].overlap_status!="duplicate") {
					if (!transform) {
						if (isPopApp) {
							if  (collation.structure.apparatus[i].readings[j].type=="om_verse") {
								continue; //skip this here -- deal with elsewhere
							} else {
								if (currMSinWitsME(collation.structure.apparatus[i].readings[j].witnesses, currMS)) {
										appText+="<div class='popAppWordRow'><span class='popAppWordRdg msRdg'><hi rend='ital'>Om.</hi></span>";
								} else {
									appText+="<div class='popAppWordRow'><span class='popAppWordRdg'><hi rend='ital'>Om.</hi></span>";
								}
							}
						} else {
							appText+="<p class='variant'><i>omitted</i> ";
						}
					}
					VMapApp[n].variants.push({variant:"<p class='variant'><span data-n='"+n+"-"+j+"'><i>Omitted</i> ", spellings:[{spelling: "omitted", wits:[]}]});
					//may need to emend next line to filter out mss not extant here at all
					if (isPopApp) appText+="<span class='popAppWordNwits'>"+collation.structure.apparatus[i].readings[j].witnesses.length+"</span><span class='popAppWordWitsCont'>";
					for (var m=0; m<collation.structure.apparatus[i].readings[j].witnesses.length; m++) {
						var thisWit=collation.structure.apparatus[i].readings[j].witnesses[m];
						if (!transform) {
							if (isPopApp) {
								if (currMS==thisWit) {
									appText+="<span class='popAppWordWitsAny msRdg'>"+thisWit+" </span>"
								} else {
									appText+="<span class='popAppWordWitsAny'>"+thisWit+" </span>"
								}
							} else {
								appText+="<a href='javascript:getMSLine(\""+currEntity+"\",\""+thisWit+"\")'>"+thisWit+"</a> ";
							}
						}
						VMapApp[n].variants[j].spellings[0].wits.push(thisWit);
				   }
				   if (isPopApp) appText+="</span></div>"
				} else {
					vartext="";
					for (k=0; k<collation.structure.apparatus[i].readings[j].text.length; k++) {
						vartext+=collation.structure.apparatus[i].readings[j].text[k].interface;
						if (k<collation.structure.apparatus[i].readings[j].text.length-1) vartext+=" ";
					}
					if (j==0) {
						if (!transform) {
							if (isPopApp) {
								appText+='<div class="popAppWordRow">';
								if (currMSinWitsME(collation.structure.apparatus[i].readings[j].witnesses, currMS)) {
									appText+='<span class="popAppWordRdg msRdg">'+vartext+'</span>'
								} else {
									appText+='<span class="popAppWordRdg">'+vartext+'</span>'
								}
								 appText+="<span class='popAppWordNwits'>"+collation.structure.apparatus[i].readings[j].witnesses.length+"</span><span class='popAppWordWitsCont'>"
							} else {
								appText+="<p class='lemma'>"+vartext+" ";
							}
							//note: we collapse all the variants into one app when outputting by spelling
						}
						VMapApp[n].lemma=vartext;
						VMapApp[n].variants.push({variant:"[lemma]", spellings:[]});
					}  else {
						if (collation.structure.apparatus[i].readings[j].overlap_status!="duplicate")
						 {
							if (!transform) { //collapsing variant forms when outputting spelling database
								if (isPopApp) {
									appText+='<div class="popAppWordRow">';
									if (currMSinWitsME(collation.structure.apparatus[i].readings[j].witnesses, currMS)) {
										appText+='<span class="popAppWordRdg msRdg">'+vartext+'</span>'
									} else {
										appText+='<span class="popAppWordRdg">'+vartext+'</span>'
									}
									 appText+="<span class='popAppWordNwits'>"+collation.structure.apparatus[i].readings[j].witnesses.length+"</span><span class='popAppWordWitsCont'>"
								} else {
									appText+="<p class='variant'>"+vartext+" ";
								}
							}
							VMapApp[n].variants.push({variant:vartext, spellings:[]});
						}
					}
					if (collation.structure.apparatus[i].readings[j].overlap_status=="duplicate") {/* appText+=" (<i>overlapped variation</i>) " */}
					else {
						appText+=createUnRegRdgME(collation.structure.apparatus[i].readings[j], n, transform, collation.context, isPopApp, VMapApp, entity);
						if (!transform) {
							if (isPopApp) {
								appText+="</span></div>"
							} else {
								appText+="</p>";
							}
						} 
					}
				}
			}
			if (isPopApp && collation.structure.hasOwnProperty("apparatus2")) { //grab overlap here
				let thisWord=collation.structure.apparatus[i].start;
				//we have overlap
				let thisPopApp="";
				for (let k=0; k<collation.structure.apparatus2.length; k++) {
					if (thisWord>=collation.structure.apparatus2[k].start && thisWord<=collation.structure.apparatus2[k].end) { //it overlaps
						let overRdg="";
						for (let y=0;  y<collation.structure.apparatus2[k].readings.length; y++) {
							if (y==0) { // get the overtext reading
								for (let x=0; x<collation.structure.apparatus2[k].readings[y].text.length; x++) {
									overRdg+=collation.structure.apparatus2[k].readings[y].text[x].interface;
									if (x<collation.structure.apparatus2[k].readings[y].text.length-1) overRdg+=" ";
								}
							} else {
								let thisRdg="";
								for (let x=0; x<collation.structure.apparatus2[k].readings[y].text.length; x++) {
									thisRdg+=collation.structure.apparatus2[k].readings[y].text[x].interface;
									if (x<collation.structure.apparatus2[k].readings[y].text.length-1) thisRdg+=" ";
								}
								thisPopApp+='<div class="popAppWordRow">';
								if (currMSinWitsME(collation.structure.apparatus2[k].readings[y].witnesses, currMS)) {
									thisPopApp+='<span class="popAppWordRdg msRdg">'+overRdg+' [overlap]:<br/>'+thisRdg+'</span>'
								} else {
									thisPopApp+='<span class="popAppWordRdg">'+overRdg+' [overlap]:<br/>'+thisRdg+'</span>'
								}
								thisPopApp+='<span class="popAppWordNwits">'+collation.structure.apparatus2[k].readings[y].witnesses.length+'</span><span class="popAppWordWitsCont">';
								thisPopApp+=createUnRegRdgME(collation.structure.apparatus2[k].readings[y], n, transform, collation.context, isPopApp, VMapApp, entity);
						/*		for (let z=0; z<collation.structure.apparatus2[k].readings[y].witnesses.length; z++) {
									if (collation.structure.apparatus2[k].readings[y].witnesses[z]==currMS) {
										thisPopApp+='<span class="popAppWordWitsAny msRdg">'+collation.structure.apparatus2[k].readings[y].witnesses[z]+'</span>';
									} else {
										thisPopApp+='<span class="popAppWordWitsAny">'+collation.structure.apparatus2[k].readings[y].witnesses[z]+'</span>';
									}
								} */
								thisPopApp+="</span></div>"
							}
						} //having done all the readings in this span .. stop!
						thisWord=collation.structure.apparatus2[k].end+1;
					}
					appText+=thisPopApp;
				}
			}
			//if a ms is omitting the whole line (NOT a lacuna .. eg orig scribe deletes the line)
			if (collation.structure.hasOwnProperty("om_readings") && collation.structure.om_readings.length>0) {
				appText+='<div class="popAppWordRow">';
				if (currMSinWitsME(collation.structure.om_readings, currMS)) {
					appText+='<span class="popAppWordRdg msRdg"><hi rend="ital">Verse om.</hi></span>'
				} else {
					appText+='<span class="popAppWordRdg"><hi rend="ital">Verse om.</hi></span>'
				}
				appText+='<span class="popAppWordNwits">'+collation.structure.om_readings.length+'</span><span class="popAppWordWitsCont">';
				for (let x=0; x<collation.structure.om_readings.length; x++) {
					if (currMS==collation.structure.om_readings[x]) {
						appText+='<span class="popAppWordWitsAny msRdg">'+collation.structure.om_readings[x]+'</span>';
					} else {
						appText+='<span class="popAppWordWitsAny">'+collation.structure.om_readings[x]+'</span>';
					}
				}
				appText+="</span></div>"
			}
			if (!transform) {
				appText+="</div>";
			} 
			//check overlap readings existence...
			if (collation.structure.hasOwnProperty("apparatus2") && !isPopApp)  {
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
									appText+="<a href='javascript:getMSLine(\""+entity+"\",\""+spellings[y].wits[z]+"\")'>"+spellings[y].wits[z]+"</a> ";
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
		} else if (isPopApp) {
			appText+="</div>";
		}
	}
	if (!onlyReg && words) {
			//used in transform to generate spelling tables
		//get the base..
		if (transform) {
			appText="<ab n='"+collation.context+"'>";
		}  else {
			appText+="<p class='lemma'>Edition text: ";
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
				//		if (thisWit!="Base") {
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
					//	}
					}
				} //deal with subreadings...
				if (collation.structure.apparatus[i].readings[j].standoff_subreadings) {
					for (var k=0; k<collation.structure.apparatus[i].readings[j].standoff_subreadings.length; k++) {
						var thisWit=collation.structure.apparatus[i].readings[j].standoff_subreadings[k];
			//			if (thisWit!="Base") {
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
			//			}
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
					spellings[sortSpells[i]][theseSpells[j]].wits=moveBase(spellings[sortSpells[i]][theseSpells[j]].wits);
					for (var k=0; k<spellings[sortSpells[i]][theseSpells[j]].wits.length; k++) {
						var thisWit=spellings[sortSpells[i]][theseSpells[j]].wits[k];
						VMapApp[i].variants[j].wits.push(thisWit); 
						let witName=thisWit;
						if (thisWit=="Base") witName="Edition";
						appText+="<a href='javascript:getMSLine(\""+entity+"\",\""+thisWit+"\")'>"+witName+"</a>";
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
	if (!hasVMap) {
		if (isPopApp) {
			return(appText)
		} else {
			$('#collation').html(appText)
			callback();
		};
	}	else {
		$('#collationText').html(appText);
//		populateVMapLine(); do this when it loads
		UnivOnlyReg=onlyReg;
		UnivWords=words;
		thisVMapApp=VMapApp;
		callback();
/* do this when it loads
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
*/
	}
}

function createSpan(entity, start) {
	let parts=entity.split(":"), rubric="";
	//first part is just community; second is entity
	if (start==0) {
		let thisEnt=parts[1];
		//might be in form entity=L3...
		if (thisEnt.indexOf("=")>-1) thisEnt=thisEnt.slice(thisEnt.indexOf("=")+1);
		if (typeof aliases !="undefined") {
			if (aliases.filter(item=>item.topEntity==thisEnt && item.context=="all").length>0) {
				thisEnt=aliases.filter(item=>item.topEntity==thisEnt && item.context=="all")[0].alias;
			} 
		}
		rubric+=thisEnt+" ";
	}
	if (start!=0) start--;
	for (let i=start+2; i<parts.length; i++) {
		let thisKey=parts[i].split("=")[0];
		let thisVal=parts[i].split("=")[1];
		let thisEnt=thisKey+" "+thisVal;
		if (typeof aliases !="undefined") {
			if (aliases.filter(item=>item.key==thisKey && item.context=="menus").length>0) {
				let alias=aliases.filter(item=>item.key==thisKey && item.context=="menus")[0].alias;
				if (alias=="") {
					thisEnt=aliases.filter(item=>item.key==thisKey && item.context=="menus")[0].alias+thisVal;
				} else {
					thisEnt=aliases.filter(item=>item.key==thisKey && item.context=="menus")[0].alias+" "+thisVal;
				}
			} 
		}
		rubric+=thisEnt;
		if (i<parts.length-1) rubric+=", ";
	}
	return(rubric);
}

function resolveDuplicatesME(collation) { //needed because overlap readings can create a duplicate lemma
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

function createUnRegRdgME(rdg, vno, transform, context, isPopApp, VMapApp, entity) { 
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
		let varId=""+vno+"-20-"+i;  //check this!!
		if (typeof hasVMap!="undefined" && hasVMap){
			varId=""+vno+"-"+String(VMapApp[vno].variants.length-1)+"-"+i;
		}
		let spellingMss="";
		let spellingWits="";
		if (typeof hasVMap!="undefined" && hasVMap){
			 VMapApp[vno].variants[VMapApp[vno].variants.length-1].spellings.push({spelling: srcWits[i].text, id: varId, wits:[]});
		}
		if (!transform)	{
			apparatus+="<span data-n='"+varId+"'>";
		} 
		srcWits[i].spellWits=moveBase(srcWits[i].spellWits);
		for (var j=0; j<srcWits[i].spellWits.length; j++) {
			if (!transform) {
				let witName=srcWits[i].spellWits[j];
				if (srcWits[i].spellWits[j]=="Base") witName="Edition";
				apparatus+="<a href='javascript:getMSLine(\""+entity+"\",\""+srcWits[i].spellWits[j]+"\")'>"+witName+"</a>";
			} else {
			   	spellingMss+=srcWits[i].spellWits[j];
			   	spellingWits+='<idno>'+srcWits[i].spellWits[j]+'</idno>'
			}
			if (typeof hasVMap!="undefined" && hasVMap){
				VMapApp[vno].variants[VMapApp[vno].variants.length-1].spellings[VMapApp[vno].variants[VMapApp[vno].variants.length-1].spellings.length-1].wits.push(srcWits[i].spellWits[j]);
			}
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

function adjustID(myId) {
	return myId.replaceAll("=","_").replaceAll(":","-");
}
function getPopUpCollationME(line, structure, entity, wordNumber, appNumber, ms) {
	let links=getPopLinks(TCcommunity+":entity="+entity);
	let popApp='';
//	currLine=lineNumber;  //leave as string
//	currTale=taleName;
	let myId=adjustID("PUColl-"+entity+"-"+ms+"_"+(appNumber+1));
	popApp+='<div id="pAFrame-'+myId+'" class="popAppFrame" data-id="'+myId+'">';
	popApp+='<span id="pATitle-'+myId+'" class="popAppTitle"><span>&nbsp;&nbsp;&nbsp;<a href="javascript:$(\'#tipDiv\').css(\'visibility\',\'hidden\');setTimeout(()=>{hideCollation()},\'100\')"><img src="/app/data/makeEdition/common/core/images/close.png" height="16px" /></a></span>';
	if (links.prevEntity=="") { popApp+="<span>&nbsp;</span>"} else {
		let prevId=adjustID('PUColl-'+links.prevEntity+'-'+ms+'_1');
		popApp+='<a href="javascript:movePopUpCollation(\''+prevId+'\',\'prevLine\',\''+entity+'\')">';
		popApp+='<img src="/app/data/makeEdition/common/core/images/iconPrev.png" height="16px"/></a>'
	}
	popApp+="<span>&nbsp;&nbsp;<input name='origSP' type='checkbox' class='puCB' onclick='choosePUsp(this)' />&nbsp;Original spelling</span>";
// create from entity
	popApp+="<span>"+createSpan(TCcommunity+":"+entity, 0)+"</span>";
	popApp+="<span onmouseover='showPUCollLink(this)' onmouseout='hidePUCollLink(this)'>&nbsp;<a class='showCollLink' href='blank' style='color:blue'>Collation</a><span class='chooseColl' style='display:none'><a href='../../collationreg/"+filePath(entity)+".html'>Regularized</a>/<a href='../../collationorig/"+filePath(entity)+".html'>Unregularized</a></span>&nbsp;</span>";
	if (links.nextEntity=="") { popApp+="<span>&nbsp;</span>"} else {
		let nextLink=adjustID('PUColl-'+links.nextEntity+'-'+ms+'_1');
		popApp+='<a href="javascript:movePopUpCollation(\''+nextLink+'\',\'nextLine\',\''+entity+'\'))">';
		popApp+='<img src="/app/data/makeEdition/common/core/images/iconNext.png" height="16px"/></a>'
	}
	popApp+="<span>&nbsp;</span></span>";
	let apparatus=structure.apparatus;
	popApp+='<div class="popApp"><span id="prevPopAppWord"></span>';
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
				} else if (readings[j].type=="om_verse") {
				//	reading='<hi rend="ital">Verse om.</hi>'; catch elsewhere
					continue; //go to next reading
				}
			} else {
				for (let k=0; k<readings[j].text.length; k++) {
					reading+=readings[j].text[k].interface;
					if (k<readings[j].text.length-1) reading+=" ";
				}
			}
			if (readings.length>1) {
				if (currMSinWitsME(readings[j].witnesses, ms)) {
					popApp+='<span class="app msRdg">'+reading+'</span>';
				} else {
					popApp+='<span class="app">'+reading+'</span>';
				}
			} else {
				popApp+='<span class="app">'+reading+'</span>';
			}
		} //if whole verse omitted: Add this here..
		if (structure.hasOwnProperty("om_readings") && structure.om_readings.length>0) {
			for (let m=0; m<structure.om_readings.length; m++) {
				if (currMSinWitsME(structure.om_readings, ms)) {
					popApp+='<span class="app msRdg"><hi rend="ital">Verse om.</hi></span>';
				} else {
					popApp+='<span class="app"><hi rend="ital">Verse om.</hi></span>';
				}
			}
		}
		if (readings.length>1) {
			popApp+='</span>';
		}
	}
	popApp+="</div>";  //end rdg app
	// which is the last word in our ms?
	let lastMsWord=parseInt($(line).find("w").last().attr("n"));
	let currApp=appNumber;
	popApp+='<span id="nextPopAppWord"></span>';
	popApp+="</div>";  //end pop app
	popApp+='<div class="popAppWordCont-reg"><hr/>';	
	let isThisApp=false;
	let liveWords=[];
		//detect that we are showing an omission...or just moving to the previous app, and don't need the word number
	if (wordNumber==-1) {
		isThisApp=true;
		//calculate the words in the mss...
		for (let j=0; j<apparatus[currApp].readings.length; j++) {
			for (let a=0; a<suffixes.length; a++) {
				if (typeof apparatus[currApp].readings[j].SR_text!="undefined" && typeof apparatus[currApp].readings[j].SR_text[ms+suffixes[a]]!="undefined") {
					for (let k=0; k<apparatus[currApp].readings[j].SR_text[ms+suffixes[a]].text.length; k++) {
						liveWords.push(parseInt(apparatus[currApp].readings[j].SR_text[ms+suffixes[a]].text[k][ms+suffixes[a]].index))
					}
				}
				for (let k=0; k< apparatus[currApp].readings[j].text.length; k++) {
					if (typeof apparatus[currApp].readings[j].text[k][ms+suffixes[a]]!="undefined") {
						liveWords.push(parseInt(apparatus[currApp].readings[j].text[k][ms+suffixes[a]].index));
					}
				}
			}
		}
	}
	for (let i=currApp; i < apparatus.length  && !isThisApp; i++) {  //this section needed to find which app has highlighted words
		for (let j=0; j<apparatus[i].readings.length && !isThisApp; j++) {
			//could be SR_text reading...
			for (let a=0; a<suffixes.length && !isThisApp; a++) {
				if (typeof apparatus[i].readings[j].SR_text!="undefined" && typeof apparatus[i].readings[j].SR_text[ms+suffixes[a]]!="undefined") {
					for (let k=0; k<apparatus[i].readings[j].SR_text[ms+suffixes[a]].text.length && !isThisApp; k++) {
						if (parseInt(apparatus[i].readings[j].SR_text[ms+suffixes[a]].text[k][ms+suffixes[a]].index) == wordNumber.toString()) {
							isThisApp=true;
							currApp=i;
							while (k<apparatus[i].readings[j].SR_text[ms+suffixes[a]].text.length) {liveWords.push(parseInt(apparatus[i].readings[j].SR_text[ms+suffixes[a]].text[k++][ms+suffixes[a]].index))}
						}
					}
				}
			}
			//not SR_text reading..
			if (!isThisApp) {
				for (let a=0; a<suffixes.length && !isThisApp; a++) {
					//could be omission! test first
					if (typeof apparatus[i].readings[j].type!="undefined" && apparatus[i].readings[j].type=="om" && apparatus[i].readings[j].witnesses.includes(ms+suffixes[a])) {
						isThisApp=true; 
						currApp=i;
						liveWords.push(-1);
						continue;
					}
					for (let k=0; k< apparatus[i].readings[j].text.length && !isThisApp; k++) {
						if (typeof apparatus[i].readings[j].text[k][ms+suffixes[a]]!="undefined" && parseInt(apparatus[i].readings[j].text[k][ms+suffixes[a]].index)==wordNumber.toString()) {
							isThisApp=true; 
							currApp=i;
							while (k<apparatus[i].readings[j].text.length) {liveWords.push(parseInt(apparatus[i].readings[j].text[k++][ms+suffixes[a]].index))}
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
							if (currMSinWitsME(structure.apparatus2[b].readings[c].witnesses, ms)) {
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
									if (structure.apparatus2[b].readings[c].witnesses[p]==ms+suffixes[a]) isCurrMs=true;
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
			if (currMSinWitsME(apparatus[currApp].readings[m].witnesses, ms)) {
				popApp+='<span class="popAppWordRdg msRdg">';
			} else {
				popApp+='<span class="popAppWordRdg">';
			}
			//could be an omission!
			if (apparatus[currApp].readings[m].hasOwnProperty("type") && apparatus[currApp].readings[m].type=="om" ) {
				popApp+='<hi rend="ital">Om.</hi></span>'
			} else if (apparatus[currApp].readings[m].hasOwnProperty("type") && apparatus[currApp].readings[m].type=="om_verse" ) {
				 popApp+='<hi rend="ital">Verse om.</hi></span>' //now treat seperately, catching in collation detail only after all other readings are done
	
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
			apparatus[currApp].readings[m].witnesses=moveBase(apparatus[currApp].readings[m].witnesses);
			for (let p=0; p<apparatus[currApp].readings[m].witnesses.length; p++) {
				let isCurrMs=false;
				for (let a=0; a<suffixes.length && !isCurrMs; a++) {
					if (apparatus[currApp].readings[m].witnesses[p]==ms+suffixes[a]) isCurrMs=true;
				}
				let witName=apparatus[currApp].readings[m].witnesses[p];
				if (witName=="Base") witName="Edition";
				if (isCurrMs) {
					popApp+='<span class="popAppWordWitsAny"><a style="color:red" href="javascript:getMSLine(\''+entity+'\',\''+apparatus[currApp].readings[m].witnesses[p]+'\')">'+witName+'</a> </span>';
				} else {
					popApp+='<span class="popAppWordWitsAny"><a href="javascript:getMSLine(\''+entity+'\',\''+apparatus[currApp].readings[m].witnesses[p]+'\')">'+witName+'</a> </span>';
				}
			}
			popApp+='</span>';
			popApp+='</div>'; // end popAppWordRow	
		} //now exjt all loops
	}
	popApp+='</div>'; // end popAppWordCont
	popApp+="</div>"; //end pop app frame
//	adjustPopUp(structure, liveWords, lastMsWord, currApp)
	if (liveWords.length==1) liveWords.push(liveWords[0]);
	return ({popApp:popApp, liveWords: liveWords, lastMsWord: lastMsWord, currApp: currApp+1});
}

function getAppLine(TCcommunity, entity, hasApp, witn, context, callback) {
	$.get(TCurl+"/uri/urn:det:tc:usask:"+TCcommunity+"/entity="+entity+":document="+hasApp+"?type=transcript&format=xml", function (line) {
		if (line.length==1) {
			let newLine=doWordsOneLine([], line[0].text, line[0].text, [], hasApp, context);
			if (context=="compare") {
				$("#cfTextWords"+witn).append("<l id=\"CfText-"+entity+"-"+hasApp+"\" data-entity=\""+entity+"\" data-ms=\""+hasApp+"\">"+ newLine+"</l><br/>");
			} else if (context=="editorial") {
				let line=$("div[data-lineID='"+entity+"-"+hasApp+"']")[0];
				$(line).html(newLine);
			}
		} else {
			for (let a=0; a<line.length; a++) {
				let newLine=doWordsOneLine([], line[a].text, line[a].text,[], hasApp, context);
				if (context=="compare") {	
					$("#cfTextWords"+witn).append("<l id=\"CfText-"+entity+"-"+hasApp+"\" data-entity=\""+entity+"\" data-ms=\""+hasApp+"\">("+line[a].place+") "+ newLine+"</l><br/>");
				} else if (context=="editorial") {
					let line=$("div[data-lineID='"+entity+"-"+hasApp+"']")[0];
					$(line).html(newLine);
				}
			}
		}
		callback(null, []);
	});

}

function createCollationLine (collation, myWit, witn, entity, context) {
	let thisLine="", nOmissions=0;
	if (collation.lac_readings.includes(myWit)) {
		thisLine="<span class=\"cfTextOut\">"+formatEntityLabel(entity)+": OUT</span>"
	} else {
		for (let j=0; j<collation.apparatus.length; j++) {
			//dig into find the word...
			for (let k=0; k<collation.apparatus[j].readings.length; k++) {
				if (collation.apparatus[j].readings[k].witnesses.includes(myWit)) {
					//we have this reading...could be in SR_text or text. which?
					if (collation.apparatus[j].readings[k].type=="om") {
						if (collation.apparatus[j].readings[k].witnesses.includes(myWit)) {
							thisLine+=" <w n='Omit"+nOmissions+"'>[..]</w> ";
							nOmissions++;
						}
					} else if (collation.apparatus[j].readings[k].type=="om_verse") {
						thisLine+="[...]"
					} else if (typeof collation.apparatus[j].readings[k].text[0][myWit]!="undefined") {
						for (let m=0; m<collation.apparatus[j].readings[k].text.length; m++) {
							let thisColl=collation.apparatus[j].readings[k].text[m][myWit];
							thisLine+="<w n=\""+thisColl.index+"\">";
							if (thisColl.hasOwnProperty("fullxml")) {
								thisLine+=thisColl.fullxml.replaceAll("&lt;","<").replaceAll("&nbsp;"," ").replaceAll("''",'"');
							} else {
								thisLine+=thisColl.original;
							}
							if (thisColl.hasOwnProperty("pc_after")) {
								thisLine+=thisColl.pc_after.replaceAll("&nbsp;"," ");
							}
							thisLine+="</w> ";
						}
					} else if (typeof collation.apparatus[j].readings[k].SR_text[myWit]!="undefined") {
						for (let m=0; m<collation.apparatus[j].readings[k].SR_text[myWit].text.length; m++) {
							let thisColl=collation.apparatus[j].readings[k].SR_text[myWit].text[m][myWit];
							thisLine+="<w n=\""+thisColl.index+"\">"+thisColl.original+"</w> ";
						}
					} else {//something else going on here
						console.log("handle tbis "+myWit+" "+entity+" reading "+j);
					}
				}
			}
		}
	}
	//append to correct div!
	if (context=="compare") {
		$("#cfTextWords"+witn).append("<l id=\"CfText-"+entity+"-"+myWit+"\" data-entity=\""+entity+"\" data-ms=\""+myWit+"\">"+ thisLine+"</l><br/>");
		//if this line contains an OUT: adjust style of parent line
		if ($("[id='CfText-"+entity+"-"+myWit+"']").find(".cfTextOut").length>0) {
			$("[id='CfText-"+entity+"-"+myWit+"']").addClass("lineCfTextOut")
		}
	} else if (context=="editorial") {//put it in the div set aside for it...
		let line=$("div[data-lineID='"+entity+"-"+myWit+"']")[0];
		$(line).html(thisLine);
	}
}	

//only called from transcribe, not from compare ever
function createPopUpCollationME(callback) {
	//get all the basic collateable units on this page...
	//add id and match attributes and a flag for collation present for each line
	//only get lines 
//	let lines=$("div[data-text='true']").find("l");  //they may not be lines! could be ab or p or ...
	let myPageEntities=pageEntitiesMin.filter(witness=>witness.witness==currMS)[0].pages.filter(page=>page.page==currPage)[0].entities;
	//we now do it backwards. Use the entity name to find the line
	let lines=[];
	for (let i=0; i<myPageEntities.length; i++) {
		let entityN=myPageEntities[i].entity.split(":")[1].split("=")[1];
//		let entityN=$($(lines[i]).parents("div[type='G']")[0]).attr("n");
		//this entity may not be a target in this publication -- eg end Millers Tale at start of L2
		if (!currEntities.includes(entityN)) {
			continue;
		}
		if (!myPageEntities[i].hasCollation) {
			continue;
		}
		//now read down the entity name to the element...add it to the lines structure
		let entParts=myPageEntities[i].entity.split(":");
		let findStr="$(\"[n='"+entityN+"']\")[0]";
		for (let j=2; j<entParts.length; j++) {
			findStr="$("+findStr+").find(\"[n='"+entParts[j].split("=")[1]+"']\")";
		}
		let myLine=eval(findStr);
		if (typeof myLine=="undefined") {
			console.log("Can't find collated unit "+myPageEntities[i].entity+" on page "+currPage+" of "+currMS)
			continue;
		}
	//could be that content of this line is in a note element in one of the margins...
		if ($(myLine).html()=="") {
			let book=$($(myLine)).parents("div").attr("n");
			let lineId=$(myLine).attr("n");
			myLine=$("[data-lref='"+book+"-"+lineId+"']")
		}
		for (let j=0; j<myLine.length; j++) {
			if ((myLine[j].localName)=="w") continue;
			if ((myLine[j].localName)=="pb") continue;
			lines.push(myLine[j]);	
			$(myLine[j]).attr("data-TCentity", myPageEntities[i].entity);
			$(myLine[j]).attr("data-hasCollation","true");
		}
	}
	//then async our way..
	async.mapSeries(lines, function(line, cblines){ 
		let entity=$(line).attr("data-TCentity");
		let community=entity.split(":")[0];
		entity=entity.slice(entity.indexOf(":entity=")+8);
		$.get( TCurl+"/uri/urn:det:tc:usask:"+community+"/entity="+entity+"?type=apparatus&format=approved") 
			.done (function(json) {
				let structure=JSON.parse(json).structure;
				createWordAppLine(structure, line, entity, json, currMS, cblines);
				cblines(null,[]);
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

function identifyAppWits(collation, mss) {
	let noApps=[];
	let hasApps=[];
	for (let j=0; j<collation.apparatus.length; j++) {
		for (let k=0; k<collation.apparatus[j].readings.length; k++) {
			for (let m=0; m<collation.apparatus[j].readings[k].witnesses.length; m++) {
				let hasApp=false;
				for (let n=1; n<suffixes.length && !hasApp; n++) {
					if (collation.apparatus[j].readings[k].witnesses[m].indexOf(suffixes[n])>-1) {
						let newWit=collation.apparatus[j].readings[k].witnesses[m].slice(0, collation.apparatus[j].readings[k].witnesses[m].indexOf(suffixes[n]));
						if (mss.includes(newWit)) {
							if (!hasApps.includes(newWit)) hasApps.push(newWit);
							hasApp=true;
						} else {
	//						console.log("this should not happen")
						}
					}
				}
			}
		}
	}
	for (let i=0; i<mss.length; i++) {
		if (!hasApps.includes(mss[i])) {
			noApps.push(mss[i]);
		}
	}
	return ({hasApps: hasApps, noApps: noApps});
}

function adjustPopUpLinksME(ID, startW, endW, lastW, entity, prevOmission) {
//find the links to next collation in the popup app and adjust
//is original spelling checked?
	if (startW > 2 || prevOmission) {
		let startId=adjustID(ID);
		$($("#"+startId)[0]).find("#prevPopAppWord").html('<a href="javascript:movePopUpCollation(\''+startId+'\',\'prevWord\',\''+entity+'\')">\
			<img src="/app/data/makeEdition/common/core/images/iconPrev.png" height="16px"/>&nbsp;&nbsp;</a>');
	}
	if (endW < lastW) {
		let nextId=adjustID(ID)
		$($("#"+nextId)[0]).find("#nextPopAppWord").html('<a href="javascript:movePopUpCollation(\''+nextId+'\',\'nextWord\',\''+entity+'\')">\
			<img src="/app/data/makeEdition/common/core/images/iconNext.png" height="16px"/>&nbsp;&nbsp;</a>');
	}
}

//now we have access to pageEntities .. would that be a better option?
//yes it very definitely would. Use pageEntitiesMin
function getPopLinks (entity) {
	var links={prevEntity:"", nextEntity:""};
	if (view=="transcript") {
	let myPage=pageEntitiesMin.filter(witness=>witness.witness==currMS)[0].pages.filter(page=>page.page==currPage)[0].entities;
		for (let i=0; i<myPage.length; i++) {
			if (myPage[i].entity==entity) {
				for (let j=i-1; j>=0; j--) {
					if (myPage[j].hasCollation) {
						links.prevEntity=myPage[j].entity.slice(myPage[j].entity.indexOf(":entity=")+8);
						break;
					}
				} 
				for (let j=i+1; j<myPage.length; j++) {
					if (myPage[j].hasCollation) {
						links.nextEntity=myPage[j].entity.slice(myPage[j].entity.indexOf(":entity=")+8);
						break;
					}
				}
				return links;
			}
		}
	} else if (view=="compare") {
		let thisEntity=entity.slice(entity.indexOf(":entity=")+8);
		let thisIndex=currEntities.indexOf(thisEntity);
		if (thisIndex>0) {
			links.prevEntity=currEntities[thisIndex-1];
		} 
		if (thisIndex<currEntities.length-1) {
			links.nextEntity=currEntities[thisIndex+1];
		}
	}
	return links;
}

function filePath(entity) { //returns the file path for this entity. Adjust for encoding over the web??
	let directory=entity.slice(0, entity.lastIndexOf(":"))+"/"+entity.slice(entity.lastIndexOf(":")+1);
	return(directory);
}

//have to treat divs as inline blocks here..
function getTextSize(html, fontSize){
	var text = document.createElement("span");
    document.body.appendChild(text);
	text.style.font = "junicoderegular";
	text.style.fontSize = fontSize;
	text.style.height = 'auto';
	text.style.width = 'auto';
	text.style.position = 'absolute';
	text.style.whiteSpace = 'no-wrap';
	text.innerHTML = html;
	$($(text)[0]).find("div").css("display", "inline");   //could be divs in there which will screw things up lol
//if there are orncps here .. make it wider lol
//need to make this an increment we add to the overall width...
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
	$($(text)[0]).find("note").css('display','block');
	let width = Math.ceil(text.clientWidth)+incr+2;  //for some reason, need to add the extra pixel
	document.body.removeChild(text);
	return(width);
}

function getLetterWidth (myText, rend) {
	if ($($(myText)[0]).find("hi[rend="+rend+"]").length>0) {
		return Math.ceil($($(myText)[0]).find("hi[rend="+rend+"]").outerWidth(true));
	} else {
		return 0;
	}
}

function doWordsOneLine(newArray, newline, line, openElements, witness, context) {
	 let thisLine="";
	 //trim space fron line start and end
	 newline=newline.trim();
	 let startXML=newline.indexOf("<");
	 if (startXML==-1) {//simple case, no app elements or embedded xml
	 	thisLine=newline;
	 	newline="";
	 } else {
	 	thisLine=newline.slice(0, startXML);
	 	newline=newline.slice(startXML);
	 }
	if (thisLine.length>0) {
		let myline=thisLine.split(" ");
		let lastIsWord=false;
		let tempArray=[];
		//if the last element in myline is "" then we have trailing space after last word
		if (myline[myline.length-1]=="") {
			lastIsWord=true;
			myline.splice(myline.length-1);
		}
		for (let j=0; j<myline.length; j++) {
			if (punctuation.includes(myline[j])) {
				if (j==0) {
					tempArray.push(myline[j]+" "+myline[1]);
					j++;
				} else {
					tempArray[tempArray.length-1]=tempArray[tempArray.length-1]+" "+myline[j];
				}
			} else {
				tempArray.push(myline[j]);
			}
		}
		for (let j=0; j<tempArray.length; j++) {
			if (tempArray[j]!=" ") {
				newArray.push({"word": tempArray[j], "start":[], "finished":true})
			}
		}
		if (!lastIsWord && newline.length>0) newArray[newArray.length-1].finished=false;
		//might be that last word is part of following xml.. in which case we need to set the last word finished to false
	} 
	//might have to deal with newline being just a space?
	if (newline.length>0) { //this recurses as we meet sequences of plain text/xml etc
		handleXML(newArray, newline, line, openElements, witness, context);
	}
	if (newArray.length==0) {//likely because the data has been stuck in a marginal note; use the lref to get text of the marginal note and put it in there
		let thisLine=$("[data-lref='"+line+"']").html();
		doWordsOneLine(newArray, thisLine, line, openElements, witness, context);
		let newStr=constructWElements(newArray, line);
		$("[data-lref='"+line+"']").html(newStr);
		return;
	}
	let newStr=constructWElements(newArray, line);
	return (newStr);
}

//because what goes on in apps is SO complex... we do this
function handleApp(newArray, newline, line, openElements, witness, context){
	//get to the end of this </app> (there could be another in the same word?)..could be a word trailing after the app
	let endApp=newline.indexOf("</app>");
	let appLine=newline.slice(0, endApp+6);
	newline=newline.slice(endApp+6);
	let $app = $(new DOMParser().parseFromString(appLine, 'text/xml'));
	let litRdg=$app.find("rdg[type='lit']")[0]; 
	let litRdgText=$(litRdg).text().trim(); //maybe we have a trailing and redundant ' ' after the reading

	if (context=="compare") {//making for compare view...
		//if there is a space in the literal reading ... then we are going to have to treat this as two or more words, ignoring mod and orig values, but retaining any seg etc information
		if (litRdgText.indexOf(" ")<0) { //simple case, no space, add to our new array
			//if this is followed by a space, close the word and go on
			if (newline[0]==" ") {
				newArray.push({"word":$(litRdg).html().trim(), start:[], "finished":true});
				newline=newline.trimStart();
			} else {
				newArray.push({"word":$(litRdg).html().trim(), start:[], "finished":false});
			}
			doWordsOneLine(newArray, newline, line, openElements, witness, context); //carry on!
		} else { //we have a space within our text!
			//a bit more complicated...
			//just stick our rdg on the beginning of the newline and process
			newline=$(litRdg).html().trim()+newline;
			doWordsOneLine(newArray, newline, newline, openElements, witness, context);
			return;
		}
	} else if (context=="transcript") {//we must be in a transcript, different result required
//		console.log("let's fix an app")
		let appText=$($app.find("app")[0]).html();
		if (newline[0]==" ") {
			newArray.push({"word":"<app>"+appText+"</app>", start:[], "finished":true});
			newline=newline.trimStart();
		} else {
			newArray.push({"word":"<app>"+appText+"</app>", start:[], "finished":false});
		}
		doWordsOneLine(newArray, newline, line, openElements, witness, context); //carry on!
	} else {
		//we really should not be here
		console.log("No context or context not compare/transcript in word division");
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

function handleXML(newArray, myline, line, openElements, witness, context) {
	//could be start or end element...
	//get startEl... could be several, one after another lol
	//if we are in an <app.. let's do it differently
	
	if (myline.indexOf("<app")==0) {
		handleApp(newArray, myline, line, openElements, witness, context);
		return;
	} else {
		let endEl=myline.indexOf(">");
		let element="";
		let closeEl="";
		let fullElement="";
		let startingEl=true;
		//if this an empty element, just <br>, add <br> to words array, but we don't increment word number
		//by definition ... we should not have any empty elements except <br> here
		//lol we can have <gap>. Better deal with it...
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
		if (element=="br" || element=="gap") {
			let emptyEl="<"+element+">"
			newArray.push({word: emptyEl, start: JSON.parse(JSON.stringify(openElements)), end:[], finished:false});
			//more elements... or not ...
			if (myline.indexOf("<")>-1) {
				//deal with words before ...
				let startEl=myline.indexOf("<");
				let startStr=myline.slice(0, startEl);
				if (startStr!="") splitWords(newArray, startStr, openElements);
				myline=myline.slice(startEl);
				handleXML(newArray, myline, line, openElements, witness, context);
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
					handleXML(newArray, myline, line, openElements, witness, context);
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
					}
				} else { //error!
					console.log("closing element "+closeEl+" found in "+witness+"; last open is "+openElements[openElements.length-1].gi)		
				};
			//case one. this element ends in this word
				for (let k=0; k<myline.length; k++) {
					if (myline[k]!="<" && myline[k]!=" ") {
						testWord+=myline[k];
					} else if (myline[k]=="<") {
						if (testWord!="") newArray.push({word:testWord, start: JSON.parse(JSON.stringify(openElements)), finished: false});
						myline=myline.slice(k)
						handleXML(newArray, myline, line, openElements, witness, context); //just keep recursing
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
}

function constructWElements(newArray, line) {
	let newStr="";
	let newWord="";
	let counter=0;
	newArray[newArray.length-1].finished=true;
	for (let i=0; i<newArray.length; i++) {
		if (newArray[i].finished) {	//hack here if our new word is a punctuation character ... append to previous word
			if (punctuation.includes(newArray[i].word) && newArray[i].word!="") { 
				newStr=newStr.slice(0, newStr.lastIndexOf("</w>"))+" "+newArray[i].word+"</w> ";
			} else if (newArray[i].word=="<br>") {
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
				newStr+='<w n="'+((counter+1)*2)+'">'+newWord+'</w>';
				newWord="";
				counter++;
				if (i<newArray.length-1) { //we have this so that strike throughs and underlines apply to spaces also
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
			if (typeof newArray[i].start =="undefined") {
				var foo=1;
				
			}
			for (let j=0; j<newArray[i].start.length; j++) {
				if (typeof newArray[i].end=="undefined") newWord+="<"+newArray[i].start[j].element+">"
			}
			if (newArray[i].word!="") newWord+=newArray[i].word;
			if (typeof newArray[i].end!="undefined") newWord+="</"+newArray[i].end+">";
		}
	}
	return(newStr);
}



//get apparatus for each word, given the line on which we have the apparatus
function createWordAppLine(structure, line, entity, json, ms, callback) {
	let words=$(line).find("w"), appNumber=0, wordNumber=2, prevOmission=false;
	while (appNumber<structure.apparatus.length) {
		let apparatus=getPopUpCollationME(line, structure, entity, wordNumber, appNumber, ms);
		appNumber=apparatus.currApp;
		let newID=adjustID("PUColl-"+entity+"-"+ms+"_"+appNumber);
		let newDiv="<div id='"+newID+"'>"+apparatus.popApp+"</div>";
		$("#WordColl").append(newDiv);
		if (apparatus.liveWords[0]==-1) {  //we have an omission in our currMS. go on to next word (but if omission is at end of ms...? and there are still readings?)
			 prevOmission=true;
			 adjustPopUpLinksME(newID, 2, 4, apparatus.lastMsWord, entity, prevOmission); //tricky...
		} else {
			for (let j=apparatus.liveWords[0]; j<apparatus.liveWords[apparatus.liveWords.length-1]+1; j+=2) {
				$(line).find("w[n='"+j+"']").attr("class", "showTip "+newID);
				$(line).find("w[n='"+j+"']").hover(showCollation, hideCollation);
			}
			wordNumber=apparatus.liveWords[apparatus.liveWords.length-1]+2;  //reset wordnumber if not omission
			//hmm ... if first word is 2 and there is an omission in previous app...we need to get this routine to point at that previous app
			adjustPopUpLinksME(newID, apparatus.liveWords[0], apparatus.liveWords[apparatus.liveWords.length-1], apparatus.lastMsWord, entity, prevOmission);
			prevOmission=false;
		}
	} //get original spelling form for each line
	let myApp=makeFromAppME("", [], json, false, false, false, false, true, entity, callback);
	let $app = $(new DOMParser().parseFromString(myApp, 'text/xml'));
	let apps=$app.find(".PUVarUnit");
	$(apps).each(function (index){
		let myNum=index+1;
		let newApp='<div class="popAppWordCont-orig"><hr/>'+$( this ).html()+'</div>';
		let myID=adjustID("PUColl-"+entity+"-"+ms+"_"+myNum);
		let myDiv=$("#pAFrame-"+myID);
		if (!myDiv) {
			console.log("cannot find popup apparatus for "+myID)
		} else {
			$(myDiv).append(newApp);
		} 
		adjustPopUpWidthsME(myID);  //do just once
	})
}

function adjustPopUpWidthsME(thisID) {
	let readings=$("#"+thisID).find(".popAppWordCont-reg .popAppWordRdg");
	let width=0;
		for (let i=0; i<readings.length; i++) {
		let thisWidth=getTextSize($(readings[i]).html(), 12);
		if (thisWidth>width) width=thisWidth;
	}
	$(readings).css("flex-basis", (width)+"px");
	readings=$("#"+thisID).find(".popAppWordCont-orig .popAppWordRdg");
	width=0;
	for (let i=0; i<readings.length; i++) {
		let thisWidth=getTextSize($(readings[i]).html(), 12);
		if (thisWidth>width) width=thisWidth;
	}
	$(readings).css("flex-basis", (width)+"px");
}

function currMSinWitsME(witnesses, myMS) {
	for (let a=0; a<suffixes.length; a++) {
		if (witnesses.includes(myMS+suffixes[a])) {
			return true;
		}
	}
	return false;
}


function getXMLApp(callback) {
	let containerEntity=currEntity.slice(0, currEntity.lastIndexOf(":"))
	$.get(TCurl+"/uri/urn:det:tc:usask:"+community+"/entity="+currEntity+"?type=apparatus&format=xml/positive", function (apparatus) {
		$.get(TCurl+"/uri/urn:det:tc:usask:"+community+"/entity="+containerEntity+":document=*?type=list", function (currWits) {
			callback(null, apparatus, currWits); 
		});
	});
}

//we need this to turn the entity list into what is handled by makeEntitySpan
function reformEntities(myEntities) {
	let newEntities={"entities": []};
	for (let i=0; i<myEntities.length; i++) {
		newEntities.entities.push({entity: TCcommunity+":entity="+myEntities[i]})
	}
	return(newEntities);
}
//use this to make a span in compare view as well as in transcript view
function makeEntitySpan(thisPage) {
	let rubric="";
	for (let i=0; i<thisPage.entities.length; i++) {
		if (i==0) {
			rubric+=createSpan(thisPage.entities[i].entity,0);
			lastEnt=thisPage.entities[0].entity.split(":")[1].split("=")[1];
			thisEntity=thisPage.entities[0].entity;
			continue;
		}
		let thisEnt=thisPage.entities[i].entity.split(":")[1].split("=")[1];
		if (lastEnt!=thisEnt) {
			rubric+="-" + createSpan(thisPage.entities[i-1].entity, levelChange(thisEntity, thisPage.entities[i-1].entity));
			rubric+="; "+createSpan(thisPage.entities[i].entity,0);
			lastEnt=thisEnt;
			thisEntity=thisPage.entities[i].entity;
		} 
	}
	if (thisEntity!=thisPage.entities[thisPage.entities.length-1].entity) {
		rubric+="-" + createSpan(thisPage.entities[thisPage.entities.length-1].entity, levelChange(thisEntity, thisPage.entities[thisPage.entities.length-1].entity));
	}
	return(rubric);
}

function levelChange (lastEntity, newEntity) { //given two entities, returns level at which they differ
	let lastParts=lastEntity.split(":");
	let newParts=newEntity.split(":");
	for (let i=1;i<lastParts.length; i++) {
		if (lastParts[i]!=newParts[i]) {
			return(i-1);
		}
	}
	// if we are here there is a problem.. could be mismatch of parts length
//	alert("could not identify differences between "+lastEntity+" and "+newEntity);
}

function hideCollation() {
//	$("w").removeClass("collLemma");
	$("w").removeClass("collLemmaText");
//	$("rdg").removeClass("collLemma");
}

function showCollation (event) {
	//the event could actually be on an embedded element within the word
		let idColl=$(event.currentTarget).attr("class").split(" ")[1];
		 setUpDrag(idColl);
		 $("."+idColl).addClass("collLemmaText");
		 adjustPopUpPosition(idColl, event);
		 setTimeout(() => {selectPUsp($("#tipDiv").find(".puCB")[0])});
}

function setUpDrag(idColl) {
//	if  ($("#pATitle-"+idColl).length)
	 $("[id='pATitle-"+idColl+"']").attr("onmousedown", "mydragg.startMoving(document.getElementById('tipDiv'),'whole',event)");
	 $("[id='pATitle-"+idColl+"']").attr("onmouseup", "mydragg.stopMoving('whole')");
	 $("[id='pATitle-"+idColl+"']").hover(highLightWords);
	 $("[id='pATitle-"+idColl+"']").css('cursor', 'move');
}
