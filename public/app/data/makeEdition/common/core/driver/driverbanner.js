function initBanner () {
	$("#shortTitle").html(shortTitle);
	//build the editorial menu first
	let preface="        ";
	let preface2=preface+"      ";
	let preface3=preface+"  ";
	let edMenu='\n         <ul class="navbar-nav">\n\
           <li class="nav-item dropdown">\n\
             <a style="color:black; height:23px; background-color: white; font-size:100%;" class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown"><span style="position:relative;top:-8px">&nbsp;&nbsp;Editorial Material</span></a>\n\
             <ul class="dropdown-menu">\n';
	for (let i=0; i<menu.length; i++) {
		if (menu[i].hasOwnProperty("menu") && menu[i].menu.length>0) {
			edMenu+=preface2+'<li><a class="dropdown-item" href="../../../html/editorial/commentary/'+menu[i].key+'.html">'+menu[i].title+' &raquo;</a>\n'
			edMenu+=processSubMenu(menu[i].menu, preface2+"  ", menu[i].key+".html");
			edMenu+=preface2+'</li>\n';
		} else {
			edMenu+=preface2+'<li><a class="dropdown-item" href="../../../html/editorial/menu/'+menu[i].key+'.html">'+menu[i].title+'</a></li>\n'
		}
	}
	edMenu+="           </ul>\n         </li>\n       </ul>\n      "
	$("#editorialMenu").html(edMenu);
	//now let's populate the entities menu
	let entityMenu=makeEntityMenus(entityPages, 0);
	$("#entityMenu").html("\n"+entityMenu+"       ");
	sendHTML();
}

function makeEntityMenus(theseEntities, i) {
	let entityText="         <select id='menu"+i+"' onchange='populateMSS("+i+");'>\n";
	for (let j=0; j<theseEntities.length; j++) {
		//check the aliases file...
		let title=theseEntities[j].name;
		if (typeof aliases!="undefined") { 
			if (i==0) {
				let myAlias=aliases.filter(alias=>alias.topEntity==title && alias.context=="all");
				if (myAlias.length>0) title=myAlias[0].alias;
			} else {
				let values=title.split("=");
				let myAlias=aliases.filter(alias=>alias.key==values[0]);
				if (myAlias.length>0) {
					title=myAlias[0].alias+" "+values[1];
				}
			}
		}
		entityText+="           <option value='"+theseEntities[j].entity+"'>"+title+"</option>\n"
	}
	entityText+="         </select>\n";
	let thisEntity=theseEntities[0].subentities[0];
	if (!thisEntity.hasOwnProperty("subentities") || thisEntity.subentities.length==0) {
		let title=thisEntity.name;
		if (typeof aliases!="undefined") { 
			let values=title.split("=");
			let myAlias=aliases.filter(alias=>alias.key==values[0] && alias.context=="menus");
			if (myAlias.length>0) title=myAlias[0].alias+values[1];
		}
		entityText+='         <input id="line" type="text" size="3" style="height:23px" name="line" value="'+title+'" onchange="populateMSS('+(i+1)+');"/></input>\n';
		entityText+='         <select id="MS" onchange="changeView()">\n';
		for (let j=0; j<thisEntity.witnesses.length; j++) {
			entityText+='           <option value="'+thisEntity.witnesses[j].name+'">'+thisEntity.witnesses[j].name+'</option>\n';
		}
		entityText+="         </select>\n";
		return(entityText);
	} else { //let's add another and recurse merrily along
		entityText+=makeEntityMenus(theseEntities[0].subentities, i+1);
		return(entityText);
	}
}

//this is so simple! no more fiddling with sending stuff to a database
function sendHTML(){
/*	var s = new XMLSerializer();
	var d = document;
	var str = s.serializeToString(d); */
	let str=$("#page-head").html();
	window.parent.postMessage(str, "*");
}

//build multilevel submenus without fear or favour
function processSubMenu(menu, preface, link) {
	let preface2=preface+"  ";
	let preface3=preface+"    ";
	let edMenu=preface+'<ul class="submenu dropdown-menu">\n';
	for (let i=0; i<menu.length; i++) {
		if (menu[i].hasOwnProperty("menu") && menu[i].menu.length>0) {
			edMenu+=preface2+'<li><a class="dropdown-item" href="../../../html/editorial/commentary/'+link+'#'+menu[i].key+'">'+menu[i].title+' &raquo;</a>\n'
			edMenu+=processSubMenu(menu[i].menu, preface2+"  ", link);
			edMenu+=preface2+'</li>\n';
		} else {
			edMenu+=preface2+'<li><a class="dropdown-item" href="../../../html/editorial/commentary/'+link+'#'+menu[i].key+'">'+menu[i].title+'</a></li>\n'
		}
	}
	edMenu+=preface+"</ul>\n";
	return(edMenu);
}

//we will embed this in the universal banner, to make life very easy
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
			if (thisVal==entities[j].entity) {
				witnesses=entities[j].witnesses;
				if (entities[j].hasOwnProperty("subentities")) {
					if ($("#menu"+which).length>0) {newVal=entities[j].subentities[0].entity};
				}
				newMenu+="  <option value='"+entities[j].entity+"' selected='true'>"+entities[j].name+"</option>\n";
			} else {
				newMenu+="  <option value='"+entities[j].entity+"'>"+entities[j].name+"</option>\n";
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
	let myline=lastEntities.subentities.filter(key=>key.name==newVal);
	if (myline.length==0) {//does not exist at all...
		alert(getPath(newVal)+" does not exist. Try "+lastEntities.subentities[0].name+".");
		doChange=false;
	} else if (myline[0].witnesses.filter(key=>key.name==$("#MS").val()).length==0){
		let sline="";
		for (let i=0; i<lastEntities.subentities.length; i++) {
			if (lastEntities.subentities[i].witnesses.filter(key=>key.name==$("#MS").val()).length>0) {
				sline=lastEntities.subentities[i].name;
				break;
			}
		}
		alert(getPath(newVal)+" does not exist in witness "+$("#MS").val()+". Try "+sline);
		doChange=false;
	} else {
		witnesses=myline[0].witnesses;
	}
	newMenu+='<input id="line" type="text" size="3" style="height:23px" name="line" value="'+newVal+'" onchange="populateMSS('+i+'); "/></input>\n'
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
	}
	return(path.trim()+", "+val);
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

function changeView () { //develop as we add views
	let entities=entityPages, i=0, lastEntities=[];
	while (entities!=null) {
		thisVal=$("#menu"+i).val();
		lastEntities=entities.filter(key=>key.entity==thisVal)[0];
		entities=getNextEntities(entities, thisVal);
		i++;
	}
	let line=$("#line").val();
	let myEnt=lastEntities.subentities.filter(key=>key.entity==line)[0];
	if (!myEnt) { 
		alert("There is no '"+line+"' in that context");
	} else { //which manuscript is chosen? skip if not a collation line, etc
		let ms=$("#MS").val();
		if (lastEntities.subentities.filter(key=>key.entity==line)[0].witnesses.filter(key=>key.name==ms).length==0) {
			//this ms does not have this text! throw an error
			alert("Witness "+ms+" does not have '"+line+"'");
		}
		let page=lastEntities.subentities.filter(key=>key.entity==line)[0].witnesses.filter(key=>key.name==ms)[0].pages[0];
		alert("You have chosen witness "+ms+", "+page);
		//notice, we could have this on multiple pages in this ms. so later add facility to select which
	}
}