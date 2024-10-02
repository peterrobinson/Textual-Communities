//controls choices made from the universal banner, to make life very easy
function populateMSS (which) {
	//replace whole of contents of #entityMenu
	let entities=entityPages, newMenu="", witnesses=[], i=0, newVal="", thisVal="", lastEntities=[];
	let doChange=true;
	//detect if change is on line, not on menus...
	if ($("#menu"+which).length==0) newVal=$("#line").val();
	while (entities!=null) {
		newMenu+="<select id='menu"+i+"' onchange='populateMSS("+i+");'>\n";
		if (i<=which) {	thisVal=$("#menu"+i).val();} else {thisVal=entities[0].entity;}
		for (let j=0; j<entities.length; j++) {
			let title=entities[j].name;
			if (typeof aliases!="undefined") {
				if (i==0) {
					let myAlias=aliases.filter(alias=>alias.topEntity==title);
					if (myAlias.length>0) title=myAlias[0].alias;
				} else {
					let values=title.split("=");
					let myAlias=aliases.filter(alias=>alias.key==values[0]);
					if (myAlias.length>0) title=myAlias[0].alias+" "+values[1];
				}
			}
			if (thisVal==entities[j].entity) {
				witnesses=entities[j].witnesses;
				if (entities[j].hasOwnProperty("subentities")) {
					if ($("#menu"+which).length>0) {newVal=entities[j].subentities[0].entity};
				}
				newMenu+="  <option value='"+entities[j].entity+"' selected='true'>"+title+"</option>\n";
			} else {
				newMenu+="  <option value='"+entities[j].entity+"'>"+title+"</option>\n";
			}
		}
		newMenu+="</select>\n";
		lastEntities=entities.filter(key=>key.entity==thisVal)[0];
		entities=getNextEntities(entities, thisVal);
		i++;
	}
  //now remake the entity menus from here on. 
		//does this line even exist?
	let	menuVal=$("#line").val();
	//we might be dealing with an alias. So check in aliases...
	let myline=[];
	if (typeof aliases!="undefined") {
		//loop through all the subentities until we find a match...
		let found=false;
		for (let a=0; a<lastEntities.subentities.length && !found; a++) {
			let values=lastEntities.subentities[a].entity.split("=");
			if (aliases.filter(alias=>alias.key==values[0]).length>0) {
				myline=lastEntities.subentities.filter(key=>key.name==values[0]+"="+menuVal);
				if (myline.length>0) found=true;
			}
		}
	} else {
		 myline=lastEntities.subentities.filter(key=>key.name==newVal);
	}
	if (myline.length==0) {//does not exist at all...
		//so let's find something in this ms which does exist!
		let found=false, sline="";
		for (let i=0; i<lastEntities.subentities.length && !found;i++) {
			if (lastEntities.subentities[i].witnesses.filter(key=>key.name==$("#MS").val()).length>0) {
				myline=lastEntities.subentities[i];
				sline=lastEntities.subentities[i].name;
				found=true;
			}
		}
		if (!found) {//not in this ms at all! switch ms...
			sline=lastEntities.subentities[0].entity;
			let ms=lastEntities.subentities[0].witnesses[0].name;
			if (typeof aliases!="undefined") sline=convertAlias(sline);
			alert(getPath("")+" does not exist in this ms at all. Moving to "+getPath("")+", "+sline+" in "+ms);
			$("#MS").val(ms);
		} else {
			if (typeof aliases!="undefined") sline=convertAlias(sline);
			alert(getPath(menuVal)+" does not exist. Moving to "+sline+" in "+$("#MS").val());
		}
		newVal=sline;
		doChange=true;
	} else if (myline[0].witnesses.filter(key=>key.name==$("#MS").val()).length==0){
		//that line not in this witness. Switch to a line that is
		let sline="";
		let found=false;
		for (let i=0; i<lastEntities.subentities.length; i++) {
			if (lastEntities.subentities[i].witnesses.filter(key=>key.name==$("#MS").val()).length>0) {
				sline=lastEntities.subentities[i].name;
				found=true;
			}
		}
		if (typeof aliases!="undefined") sline=convertAlias(sline);
		alert(getPath(menuVal)+" does not exist in witness "+$("#MS").val()+". Moving to "+sline+" in "+$("#MS").val());
		newVal=sline;
		doChange=true;
	} else {
		witnesses=myline[0].witnesses;
	}
	if (typeof aliases!="undefined") newVal=convertAlias( newVal);
	let title=newVal;
	//we got to figure out what makes sense here as the new value for the line...
	//if what changed was a higher entity, then set the value here to the first line in this entity in THIS ms
	//if there is no ms for this line .. find the nearest line where this ms exists
	//if this ms is not in any line in this entity .. find the first ms which is here
	newMenu+='<input id="line" type="text" size="3" style="height:23px" name="line" value="'+title+'" onchange="populateMSS('+i+'); "/>\n'
	newMenu+='<select id="MS" onchange="changeView()">\n';
	if (!doChange) { //just retain witnesses we have
		let myWitnesses=$("#MS").html();
		newMenu+=myWitnesses;
	} else {
		//get current selected...
		newVal=$("#MS").val()
		for (let j=0; j<witnesses.length; j++) {
			if (witnesses[j].name==newVal) {
				newMenu+='  <option value="'+witnesses[j].name+'" selected="true">'+witnesses[j].name+'</option>\n';
			} else {
				newMenu+='  <option value="'+witnesses[j].name+'">'+witnesses[j].name+'</option>\n';
			}
		} 
	}
	newMenu+="</select>";
	$("#entityMenu").html(newMenu);
	if (doChange) {changeView()};
}

function getPath(val) {
	let i=0, path="";
	let myMenu=$("#menu0");
	while (myMenu.length>0) {
		path+=$("#menu"+i+" option:selected").text()+" ";
		i++;
		myMenu=$("#menu"+i);
		if (myMenu.length>0) path+=", "
	}
	if (val=="") {
		return(path.trim());
	} else {
		return(path.trim()+", "+val);
	}
}

function getNextEntities (entities, val) { //cycle through recursive entities
	let nextEntity=entities.filter(key=>key.entity==val)[0];
	if (nextEntity.hasOwnProperty("subentities") && nextEntity.subentities[0].hasOwnProperty("subentities")) {
		entities=nextEntity.subentities;
	} else { //force stop before last entities
		entities=null;
	}
	return(entities)
}

function convertAlias(sought) {
	let values=sought.split("=");
	if (aliases.filter(alias=>alias.key==values[0] && alias.context=="menus").length>0) {
		return(aliases.filter(alias=>alias.key==values[0] && alias.context=="menus")[0].alias+values[1]);
	} else return(sought);
}

function changeView () { //develop as we add views
	let entities=entityPages, i=0, lastEntities=[];
	while (entities!=null) {
		thisVal=$("#menu"+i).val();
		lastEntities=entities.filter(key=>key.entity==thisVal)[0];
		entities=getNextEntities(entities, thisVal);
		i++;
	}
	let line=$("#line").val();
	let myEnt=lastEntities.subentities.filter(key=>key.entity==line);
	if (myEnt.length==0 && typeof aliases!="undefined") {
		//loop through all the subentities until we find a match...
		let found=false;
		for (let a=0; a<lastEntities.subentities.length && !found; a++) {
			let values=lastEntities.subentities[a].entity.split("=");
			if (aliases.filter(alias=>alias.key==values[0]).length>0) {
				myEnt=lastEntities.subentities.filter(key=>key.name==values[0]+"="+line);
				if (myEnt.length>0) found=true;
			}
		}
	} 
	if (myEnt.length==0) { 
		alert("There is no '"+line+"' in that context");
	} else { //which manuscript is chosen? skip if not a collation line, etc
		let ms=$("#MS").val();
		if (myEnt[0].witnesses.filter(key=>key.name==ms).length==0) {
			//this ms does not have this text! throw an error, and get a line which is in this ms
			let sline="", found=false;
			for (let i=0; i<lastEntities.subentities.length && !found;i++) {
				if (lastEntities.subentities[i].witnesses.filter(key=>key.name==$("#MS").val()).length>0) {
					myEnt=[lastEntities.subentities[i]];
					sline=lastEntities.subentities[i].name;
					if (typeof aliases!="undefined") sline=convertAlias(sline);
					$("#line").val(sline);
					found=true;
				}
			}
			alert("Witness "+ms+" does not have '"+line+"' Showing '"+sline+"' instead");
		} 
		let page=myEnt[0].witnesses.filter(key=>key.name==ms)[0].pages[0];
		alert("You have chosen witness "+ms+", "+page);
		//notice, we could have this on multiple pages in this ms. so later add facility to select which
	}
}