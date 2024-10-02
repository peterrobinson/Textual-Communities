function initBanner () {
	$("#shortTitle").html(shortTitle);
	//build the editorial menu first
	let preface="        ";
	let preface2=preface+"      ";
	let preface3=preface+"  ";
	let edMenu='\n         <ul class="mainMenu">\n\
           <li onClick="showMenu()">\n\
             <a href="#" class="hasSubMenu"><span>Editorial Material</span><span class="pointer">&#8964;</span></a>\n\
             <ul class="subMenu" id="edMenu">\n';
	for (let i=0; i<menu.length; i++) {
		if (menu[i].hasOwnProperty("menu") && menu[i].menu.length>0) {
			edMenu+=preface2+'<li><a class="hasSubMenu" href="../../../html/editorial/commentary/'+menu[i].key+'.html"><span>'+menu[i].title+'</span><span>&#x2C3;&#x2C3;</span></a>\n'
			edMenu+=processSubMenu(menu[i].menu, preface2+"  ", menu[i].key+".html");
			edMenu+=preface2+'</li>\n';
		} else {
			edMenu+=preface2+'<li><a href="../../../html/editorial/menu/'+menu[i].key+'.html">'+menu[i].title+'</a></li>\n'
		}
	}
	edMenu+="           </ul>\n         </li>\n       </ul>\n      "
	$("#editorialMenu").html(edMenu);
	//now let's populate the entities menu
	let entityMenu=initializeEntityChoice(currEntity);
	$("#entityMenu").html("\n"+entityMenu+"       ");
	sendHTML();
}

function makeEntityMenus(theseEntities, i) {
	let entityText="         <select id='menu"+i+"' onchange='changeEntity();'>\n";
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
		entityText+='         <input id="line" data-key="'+thisEntity.name+'"type="text" size="3" name="line" value="'+title+'" onchange="changeEntity();"/></input>\n';
		entityText+='         <select id="MS" onchange="changeEntity()">\n';
		for (let j=0; j<thisEntity.witnesses.length; j++) {
			entityText+='           <option value="'+thisEntity.witnesses[j].name+'">'+thisEntity.witnesses[j].name+'</option>\n';
		}
		entityText+="         </select>\n";
		return(entityText);
	} else { //let's add another and recurse merrily along
		entityText+=""+makeEntityMenus(theseEntities[0].subentities, i+1);
		return(entityText);
	}
}

//this is so simple! no more fiddling with sending stuff to a database
function sendHTML(){
	if (!hasVBase) $("#VBase").remove();
	if (!ssSearch) $("#Search").remove();
	var s = new XMLSerializer();
	var d = $("#grp2")[0];
	var str = s.serializeToString(d); 
	window.parent.postMessage(str, "*");
}

//build multilevel submenus without fear or favour
function processSubMenu(menu, preface, link) {
	let preface2=preface+"  ";
	let preface3=preface+"    ";
	let edMenu=preface+'<ul class="SuperSubMenu">\n';
	for (let i=0; i<menu.length; i++) {
		if (menu[i].hasOwnProperty("menu") && menu[i].menu.length>0) {
			edMenu+=preface2+'<li><a class="hasSubMenu" href="../../../html/editorial/commentary/'+link+'#'+menu[i].key+'"><span>'+menu[i].title+'</span<span>&#x2C3;&#x2C3;</span></a>\n'
			edMenu+=processSubMenu(menu[i].menu, preface2+"  ", link);
			edMenu+=preface2+'</li>\n';
		} else {
			edMenu+=preface2+'<li><a href="../../../html/editorial/commentary/'+link+'#'+menu[i].key+'">'+menu[i].title+'</a></li>\n'
		}
	}
	edMenu+=preface+"</ul>\n";
	return(edMenu);
}


