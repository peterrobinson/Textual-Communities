function showMenu(){
	document.getElementById('edMenu').style.display = "block";
}

document.onclick = function(e){
	var divToHide = document.getElementById('edMenu');
	if (!document.getElementById("editorialMenu").contains(e.target)) {
	   //element clicked wasn't the div; hide the div
	   if (divToHide && (typeof divToHide.style!="undefined")) divToHide.style.display = 'none';
	}
};


function initializeEntityChoice (entity, MS) { //given an entity and a MS, set up the menus for it
	let thisMS=MS;
	let entityParts=entity.split(":");
	let entities=entityPages, newMenu="", witnesses=[], thisVal="", title="", i=0, nextEntities=[], errorStr="";
	for (i=0; entities && nextEntities; i++) {
		if (i==0) { //in case there is only one level of witness
			nextEntities=getNextEntities(entities, entityParts[0], null);
			witnesses=entities[0].witnesses;
			if (typeof thisMS=="undefined") thisMS=witnesses[0].name;
		}
		if (i>0) entities=nextEntities;  //roll gently downhill
		newMenu+="<select id='menu"+i+"' onchange='changeEntity();'>\n";
		thisVal=entityParts[i];
		for (let j=0; j<entities.length; j++) {
			title=entities[j].name;
			if (typeof aliases!="undefined") {
				if (i==0) {
					let myAlias=aliases.filter(alias=>alias.topEntity==title);
					if (myAlias.length>0) title=myAlias[0].alias;
				} else {
					let values=title.split("=");
					let myAlias=aliases.filter(alias=>alias.key==values[0] && alias.context=="menus");
					if (myAlias.length>0) {
						if (myAlias[0].alias=="") {
							title=values[1];
						} else {
							title=myAlias[0].alias+" "+values[1];
						}
					}
				}
			}
			if (thisVal==entities[j].entity) {
				witnesses=entities[j].witnesses;
				let nextVal=null;
				if (i<entityParts.length-1) nextVal=entityParts[i+1];
				nextEntities=getNextEntities(entities, thisVal, nextVal); 
				if (!nextEntities) { //hit last entity with children
					if (i<entityParts.length-2) {
						errorStr+="Problem evaluating "+entity+". Expected to find children of "+thisVal+". None found\n";
					} else {
						if (entities[j].subentities.filter(line=>line.entity==entityParts[entityParts.length-1]).length>0) {
							witnesses=entities[j].subentities.filter(line=>line.entity==entityParts[entityParts.length-1])[0].witnesses;
							if (typeof $("#MS").val()=="undefined") {
								$("#MS").val(witnesses[0].name);
								thisMS=$("#MS").val(witnesses[0].name);
							} else {
								if (witnesses.filter(witness=>witness.name==MS).length==0) {
									//let's find the best ms we can..
									errorStr+="Entity "+thisVal+" not found in witness "+MS+". Moving to witness "+witnesses[1].name+"\n";
									$("#MS").val(witnesses[1].name);
									thisMS=witnesses[1].name;
								}
							}
						} else {
							errorStr+="Problem evaluating "+entity+". No entity with value "+entityParts[entityParts.length-1]+" found. Moving to "+entities[j].subentities[0].entity+"\n";
							entityParts[entityParts.length-1]=entities[j].subentities[0].entity;
						}
					}
				} 
				newMenu+="  <option value='"+entities[j].entity+"' selected='true'>"+title+"</option>\n";
			} else {
				newMenu+="  <option value='"+entities[j].entity+"'>"+title+"</option>\n";
			}
		}
		newMenu+="</select>\n"
	}
	//add last entity part to input box
	title=entityParts[entityParts.length-1];
	if (typeof aliases!="undefined") {
		let values=title.split("=");
		let myAlias=aliases.filter(alias=>alias.key==values[0] && alias.context=="menus");
		if (myAlias.length>0) {
			if (myAlias[0].alias=="") {
				title=values[1];
			} else {
				title=myAlias[0].alias+" "+values[1];
			}	
		}
	}
	newMenu+='<input id="line" data-key="'+entityParts[entityParts.length-1]+'" type="text" size="3" style="height:23px" name="line" value="'+title+'" onchange="changeEntity(); "/>\n';
	newMenu+='<select id="MS" onchange="changeEntity()">\n';
	//adjusted .. let's NOT ever have "edition"
	//do we have a witness called Hg? If so, make it the base wit
	let basename="";
	if (thisMS!="Base" && witnesses.filter(wit=>wit.name==thisMS).length>0) {
		basename=thisMS;
	} else {
		basename=getDefaultMs(entity);
	}
	for (let j=0; j<witnesses.length; j++) {
		let witname=witnesses[j].name;
		if (witname=="Base") witname="Edition";
		if (basename==witname) {
			newMenu+='  <option value="'+witnesses[j].name+'" selected="true">'+witname+'</option>\n';
		} else {
			newMenu+='  <option value="'+witnesses[j].name+'">'+witname+'</option>\n';
		}
	} 
	newMenu+="</select>";
//	if (errorStr!="") alert(errorStr);
	return(newMenu);
}

function getDefaultMs(entity){
	let entities=entityPages, nextEntities=[], witness=[];
	let entityParts=entity.split(":");
	for (i=0; entities && nextEntities; i++) {
		if (i>0) entities=nextEntities; 
		thisVal=entityParts[i];
		let nextVal=null;
		for (let j=0; j<entities.length; j++) {
			if (thisVal==entities[j].entity) {
				witnesses=entities[j].witnesses;
				let nextVal=null;
				if (i<entityParts.length-1) nextVal=entityParts[i+1];
				nextEntities=getNextEntities(entities, thisVal, nextVal);
				if (!nextEntities) { 
					if (entities[j].subentities.filter(line=>line.entity==entityParts[entityParts.length-1]).length>0) {
						witnesses=entities[j].subentities.filter(line=>line.entity==entityParts[entityParts.length-1])[0].witnesses;
						if (witnesses.filter(wit=>wit.name=="Hg").length>0) {
							return("Hg");
						} else if (witnesses.filter(wit=>wit.name=="El").length>0) {
							return("El");
						} else if (witnesses.filter(wit=>wit.name=="Ch").length>0) {
							return("Ch");
						} else {
							//but what if there is only one witnes? send the first back
							if (typeof witnesses[1]=="undefined" ) {
								return (witnesses[0].name)
							} else {
								return (witnesses[1].name)
							}
						}
					}
				}
			}
		}
	}
}

function formatEntityLabel (entity) {
	let entityParts = entity.split(":");
	let formatString="";
	//top entity first
	let topEntity=entityParts[0];
	let myString=topEntity;
	if (typeof aliases!="undefined") {
		if (aliases.filter(alias=>alias.topEntity==topEntity).length>0) myString=aliases.filter(alias=>alias.topEntity==topEntity)[0].alias;
	}
	formatString+=myString+" ";
	for (let i=1; i<entityParts.length; i++) {
		myString=entityParts[i];
		let bits=entityParts[i].split("=");
		if (typeof aliases!="undefined") {
			if (aliases.filter(alias=>alias.key==bits[0] && alias.context=="menus").length>0) {
				if (aliases.filter(alias=>alias.key==bits[0] && alias.context=="menus")[0].alias=="") {
					myString=bits[1];
				} else {
					myString=aliases.filter(alias=>alias.key==bits[0] && alias.context=="menus")[0].alias+" "+bits[1];				
				}
			}
		}
		formatString+=myString;
		if (i<entityParts.length-1) formatString+=", ";
	}
	return formatString;
}
function changeEntity(){
	//first build a new entity from what is in the menus
	let entity="", errorStr="";
	for (let i=0; $("#menu"+i).length>0; i++) {
		entity+=$("#menu"+i).val()+":";
	}
		//if we have just changed the line value..we need to update the data key value
	let title=$("#line").val();
	let myKey=$("#line").attr("data-key");
	let values=myKey.split("=");
	if (typeof aliases!="undefined") {
		if (aliases.filter(alias=>alias.key==values[0] && alias.context=="menus").length>0) {
			let myAlias=aliases.filter(alias=>alias.key==values[0] && alias.context=="menus")[0].alias;
			if (myAlias=="") {
				myKey=values[1];
			} else {
				myKey=myAlias+" "+values[1]
			}
		}
	} 
	if (title!=myKey) {
		if (title.indexOf(" ")>-1) {
			title=title.slice(title.indexOf(" ")+1);
		} else if (title.indexOf("=")>-1) {
			title=title.slice(title.indexOf("=")+1);
		}
		$("#line").attr("data-key", values[0]+"="+title)
	}
	entity+=$("#line").attr("data-key");
	$("#entityMenu").html(initializeEntityChoice(entity, $("#MS").val()));
	//now change the page. we might have changed the entity while initializing page and manuscript
	entity=getEntityFromMenu();
	let entityValues=entity.split(":");
	let entities=entityPages, i=0;
	for (; i<entityValues.length-1; i++) {
		if (entities.filter(entity=>entity.name==entityValues[i]).length>0) {
			entities=entities.filter(entity=>entity.name==entityValues[i])[0].subentities;
		} else {
			errorStr+="this should not happen";
		}
	}
	let ms=$("#MS").val();
	if (entities.filter(entity=>entity.name==entityValues[i]).length>0) {
		let witnesses=entities.filter(entity=>entity.name==entityValues[i])[0].witnesses;
		if (witnesses.filter(witness=>witness.name==ms).length>0) {
			let page=witnesses.filter(witness=>witness.name==ms)[0].pages[0];
			if (view=="transcript") {
				if (ms!=currMS || page!=currPage)  {
					if (errorStr!="") alert(errorStr);
					setCookie("newPage", entity, 0.0001);
					window.location.href="../../../html/transcripts/"+ms+"/"+page+".html";
				}
			} else if (view=="editorial") {
				setCookie("newPage", entity, 0.0001);
				window.location.href="../../../html/transcripts/"+ms+"/"+page+".html";
			} else if (view=="collation") {
				let folder=entity.slice(0, entity.lastIndexOf(":"));
				let collFile=entity.slice(entity.lastIndexOf(":")+1);
				if (regState) {
					window.location.href="../../../html/collationreg/"+folder+"/"+collFile+".html";
				} else if (!regState && !wordState) {
					window.location.href="../../../html/collationorig/"+folder+"/"+collFile+".html";
				} else if (!regState && wordState) {
					window.location.href="../../../html/collationorigwords/"+folder+"/"+collFile+".html";
				}
			} else if (view=="compare") {
				//are we still in the same compare? if so just reset nowEntity, rinse and repeat
				openCompare(entity);
			}
		} else { 
			errorStr+="this should not happen once more";
		}
	} else { //happened because this line does not exist.. so change it now
		errorStr+="Entity "+entityValues[i]+" not found. Moving to "+entities[0].name;
		entity=entity.replace(entityValues[i],entities[0].name);
		let witnesses=entities[0].witnesses;
		if (witnesses.filter(witness=>witness.name==ms).length>0) {
			let page=witnesses.filter(witness=>witness.name==ms)[0].pages[0];
			if (ms!=currMS || page!=currPage)  {
				if (errorStr!="") alert(errorStr);
				setCookie("newPage", entity, 0.00001);
				window.location.href="../../../html/transcripts/"+ms+"/"+page+".html";
			}
		}
	}
	if (errorStr!="") alert(errorStr);
}


function getNextEntities (entities, val, nextval) { //cycle through recursive entities
	if (entities.filter(key=>key.entity==val).length==0) {
		return(null);
	}
	let nextEntity=entities.filter(key=>key.entity==val)[0];
	//check that there is a child or not for the nextvalue
	if (nextEntity.hasOwnProperty("subentities")) {
		if (nextEntity.subentities.filter(sub=>sub.entity==nextval).length>0) {
			let thisEntity=nextEntity.subentities.filter(sub=>sub.entity==nextval)[0];
			if (thisEntity.hasOwnProperty("subentities")) {
				entities=nextEntity.subentities;
			} else {
				entities=null;
			}
		} else {
			entities=null;
		}
	}  else { //force stop before last entities
		entities=null;
	}
	return(entities)
}

function getMSLine(entity, ms) {
	let page=getMSPage(entity, ms);
	getTranscriptFromCollation (ms, page, entity);
}

function getEntityFromMenu() {
	let entity="";
	for (let i=0; $("#menu"+i).length>0; i++) {
		entity+=$("#menu"+i).val()+":";
	}
	entity+= $("#line").attr("data-key");
	return(entity);
}

function getMSPage(entity, ms) {
	let parts=entity.split(":")
	let nextEntities=entityPages.filter(entity=>entity.entity==parts[0])[0].subentities;
	let i=1;
	for (;i<parts.length-1; i++ ) {
		nextEntities=nextEntities.filter(entity=>entity.entity==parts[i])[0].subentities;
	}
	let witnesses=nextEntities.filter(entity=>entity.entity==parts[i])[0].witnesses;
	let thisPage=witnesses.filter(witness=>witness.name==ms)[0].pages[0];
	return (thisPage);
}

function getTranscriptFromVBase (ms, page, entity) {
	setCookie("newPage", entity, 0.0001);
	window.location.href="html/transcripts/"+ms+"/"+page+".html";
}

function moveBase(source) { //just puts the Base at the beginning of every
	let destiny=[];
	if (source.includes("Base")) {
		destiny.push("Base");
		for (let i=0; i<source.length; i++) {
			if (source[i]!="Base") {
				destiny.push(source[i]);
			}
		}
		return(destiny)
	} else {
		return(source);
	}
}

function getTranscriptFromCollation (ms, page, entity) {
	setCookie("newPage", entity, 0.0001);
	window.location.href="../../../html/transcripts/"+ms+"/"+page+".html";
}
