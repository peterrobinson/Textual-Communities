var varnums=[0,1,2,3,4,5,6,7,8,9,"a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"]
var transcripts=[];
var vBase=null;
		
async function searchVBase(vBase){ //ok so this is where it happens
	$("#rTable").hide();
	$("#searchVBase").show();
	$("#searchVBResults").html("");
	resizeRTable();
	var firstLoad=false;
  	let error="";
   	let searchDone=false;
   	if (!vBase) {
   		firstLoad=true;
   		vBase=transcripts["VBase"];
   	}
   	if (typeof vBase=="undefined") {
   		await getVBase();
   		vBase=transcripts["VBase"];
   	}
  	$("#presetVBs").html("");
   	vBase.conditionsets.forEach(function(conditionset, index){
   		if (index==0) return;
   		$("#presetVBs").append("<span class='preset'><input onclick='writePresets(\""+index+"\")' type='radio' name='presetVB'>"+conditionset.name+"</span>");
   	})
  	if (!vBase.witlist.includes('\\all')) vBase.witlist.push("\\all");
  	$("#conditions").html("");
  	if (firstLoad) {
  		writeConditions(vBase, 1);
  		$($("input[name=presetVB]")[0]).prop( "checked", true );
  		doSearch();
  	} else {
  		writeConditions(vBase, 0);
  	};
  	//if we are loading first time -- let's do a default seach hey
}

async function getVBase(){
	if (typeof transcripts["VBase"]=="undefined") {
		return new Promise(function(resolve, reject) {
			$.getJSON("http://inklesseditions.com/CT/common/js/vbases/"+vBaseName+".json", function(VBase) { //loads in background
				transcripts["VBase"]=VBase;  
				resolve();
			});
		});
	} else {
		return new Promise(function(resolve, reject) {
			resolve();
		});
	}
}

async function startVBfromURL() {
	if (typeof transcripts["VBase"]=="undefined") { 
		await getVBase();
	}
	let vBase=transcripts["VBase"];
	//parse the query string and write it into VBase search conditions 0 slot
	let nConds=parseInt($.urlParam("nconds")); 
	$("#conditions").html("");
	if ($.urlParam("vsite")=="true") {
		$( "#VBchoose").prop( "checked", true )
		$("#VBchooseSpan").css({"border":"solid", "border-color":"red"});
	} else {
		$("#VBchoose").prop( "checked", false )
		$("#VBchooseSpan").css({"border":"none", "border-color":"none"});
	} ;
	vBase.conditionsets[0].name=decodeURIComponent($.urlParam(name));
	 vBase.conditionsets[0].conditions=[];
	for (let i=0; i<nConds; i++) {
		vBase.conditionsets[0].conditions.push({in:(decodeURIComponent($.urlParam("in"+i))=="true")?true:false, spec:(decodeURIComponent($.urlParam("spec"+i))!="0")?decodeURIComponent($.urlParam("spec"+i)):"", wits:decodeURIComponent($.urlParam("wits"+i))})
	}
	searchVBase(vBase);
	doSearch();
}

async function searchVariantSite(vBase) {
	if (typeof vBase=="undefined") {
   		await getVBase();
   		vBase=transcripts["VBase"];
   	};
   	if ($("#VBchoose").is(':checked')) {
   		$("#VBchooseSpan").css({"border":"solid", "border-color":"red"})
	} else {
		$("#VBchooseSpan").css({"border":"none", "border-color":"red"})
	}
   	doSearch();
}

function addCond () {
	$($("div.conditionVB").last().find("a[title='Add condition']")[0]).remove();
	let k=parseInt($("div.conditionVB").last().attr("n"))+1;
	let addCond=" <a title='Add condition' href='javascript:addCond()'><img  src='../common/images/icons/addcondition.png' height='18px'></a>"
	let removeCond=" <a title='Remove condition' href='javascript:removeCond(\""+k+"\")'><img  src='../common/images/icons/deletecondition.png' height='18px'></a> ";
   	let toggleCond=" <a title='Disable condition'  data-active='true' href='javascript:toggleCond(\""+k+"\")'><img  src='../common/images/icons/disablecondition.png' height='18px'></a>";
   	let thisCond="<div class='conditionVB' n='"+k+"'>\
		<span class='inorout'><input id='InCond"+k+"' type='radio' name='inornotin"+k+"'>In /<input id='OutCond"+k+"' type='radio' name='inornotin"+k+"'>Not in</span>\
		<span class='spec'><input id='VBspec"+k+"' class='specVB' placeholder='(< > 3)' size='6'></span>\
		<span class='vbwits'><input id='VBCond"+k+"' class='conditionVB' placeholder='(list of witnesses, or \all)' size='40'></span>"+toggleCond+removeCond+addCond+"</div>";
   	$("#conditions").append(thisCond);
   	$("#InCond"+k).prop("checked", true);
   	//if there are two conditions.. then we started with one, and we need to add suspend/remove
   	if ($("div.conditionVB").length==2) {
   		let k=$($("div.conditionVB")[0]).attr("n");
   		removeCond=" <a title='Remove condition' href='javascript:removeCond(\""+k+"\")'><img  src='../common/images/icons/deletecondition.png' height='18px'></a> ";
   		toggleCond=" <a title='Disable condition' data-active='true' href='javascript:toggleCond(\""+k+"\")'><img  src='../common/images/icons/disablecondition.png' height='18px'></a>";
		$($("div.conditionVB")[0]).append(toggleCond+removeCond);
   	}
}

function toggleCond(myCond) {
	var thisCond=$("div.conditionVB[n="+myCond+"]")[0];
	if ($(thisCond).find("a[title='Disable condition']").length>0) {
		$($(thisCond).find("a[title='Disable condition']")[0]).attr("data-active","false");
		$($(thisCond).find("a[title='Disable condition'] img")[0]).attr("src","../common/images/icons/enablecondition.png");
		$($(thisCond).find("a[title='Disable condition']")[0]).attr("title","Enable condition");
		$($(thisCond).find("input[name='inornotin"+myCond+"']")).attr("disabled", true);
		$($(thisCond).find("#VBspec"+myCond)[0]).css("color", "grey");
		$($(thisCond).find("#VBCond"+myCond)[0]).css("color", "grey");
	} else if ($(thisCond).find("a[title='Enable condition']").length>0) {
		$($(thisCond).find("a[title='Enable condition']")[0]).attr("data-active","true");
		$($(thisCond).find("a[title='Enable condition'] img")[0]).attr("src","../common/images/icons/disablecondition.png");
		$($(thisCond).find("a[title='Enable condition']")[0]).attr("title","Disable condition");
		$($(thisCond).find("input[name='inornotin"+myCond+"']")).attr("disabled", false);
		$($(thisCond).find("#VBspec"+myCond)[0]).css("color", "black");
		$($(thisCond).find("#VBCond"+myCond)[0]).css("color", "black");

	}
}

function removeCond (myCond) {
	//if this is the last condition .. add + icon to second last one
	if ($("div.conditionVB").last().attr("n")==myCond) {
		let addCond="<a title='Add condition' href='javascript:addCond()'><img  src='../common/images/icons/addcondition.png' height='18px'></a>"
		$($("div.conditionVB")[$("div.conditionVB").length-2]).append(addCond);
	}
	$($("div.conditionVB[n='"+myCond+"']")[0]).remove();
	//renumber all the conditions now, starting at zero
	for (let i=0; i<$("div.conditionVB").length; i++) {
		let myN=$($("div.conditionVB")[i]).attr("n");
		$($("div.conditionVB")[i]).find("input[id='InCond"+myN+"']").attr("name", "inoroutin"+i);
		$($("div.conditionVB")[i]).find("input[id='InCond"+myN+"']").attr("id", "InCond"+i);
		$($("div.conditionVB")[i]).find("input[id='OutCond"+myN+"']").attr("name", "inoroutin"+i);
		$($("div.conditionVB")[i]).find("input[id='OutCond"+myN+"']").attr("id", "OutCond"+i);
		$($("div.conditionVB")[i]).find("input[name='inoroutin"+myN+"']").attr("name", "inoroutin"+i);
		$($("div.conditionVB")[i]).find("input[id='VBspec"+myN+"']").attr("id", "VBspec"+i);
		$($("div.conditionVB")[i]).find("input[id='VBCond"+myN+"']").attr("id", "VBCond"+i);
		$($("div.conditionVB")[i]).find("a[href='javascript:toggleCond("+myN+")']").attr("href", "javascript:toggleCond("+i+")");
		$($("div.conditionVB")[i]).find("a[href='javascript:removeCond("+myN+")']").attr("href", "javascript:removeCond("+i+")");
		$($("div.conditionVB")[i]).attr("n", i);
	}
	if ($("div.conditionVB").length==1) {
		$($("div.conditionVB").last().find("a[title='Remove condition']")[0]).remove();
		$($("div.conditionVB").last().find("a[title='Disable condition']")[0]).remove();
	}
}

function showWitList() {
	let vBase=transcripts["VBase"];
	if ($("#witList a")[0].innerText=="Show witnesses") {
		$($("#witList")[0]).append(" "+vBase.witlist.join(" "));
		$($("#witList a")[0]).html("Hide witnesses");
	} else {
		$($("#witList")[0]).html('<a href="javascript:showWitList()">Show witnesses</a>');
	}
}

function writePresets (which) {
	$("#VBerror").html("");
	let vBase=transcripts["VBase"];
	$("#conditions").html("");
	$("#searchVBResults").html("");
	writeConditions(vBase, which);
	doSearch();
}

function writeConditions(vBase, cSet) {
  	//write vBase conditions into window...
  	if ($("#VBchoose").is(':checked')) {
  		var searchSite="&vsite=true";
  	} else {var searchSite="&vsite=false";}
  	let queryString="&name="+vBase.conditionsets[cSet].name+searchSite+"&nconds="+vBase.conditionsets[cSet].conditions.length;
   	for (let k=0; k<vBase.conditionsets[cSet].conditions.length; k++) {
   		if (k<vBase.conditionsets[cSet].conditions.length-1 || k>0) {
   			var removeCond=" <a title='Remove condition' href='javascript:removeCond("+k+")'><img  src='../common/images/icons/deletecondition.png' height='18px'></a> ";
   			var toggleCond=" <a title='Disable condition' data-active='true' href='javascript:toggleCond("+k+")'><img  src='../common/images/icons/disablecondition.png' height='18px'></a>";
   		} else {
   			var removeCond="";
   			var toggleCond="";
   		}
   		if (k==vBase.conditionsets[cSet].conditions.length-1) {
   			var addCond=" <a title='Add condition' href='javascript:addCond()'><img  src='../common/images/icons/addcondition.png' height='18px'></a>"
   		} else {
   			var addCond="";
   		}
		let thisCond="<div class='conditionVB' n='"+k+"'>\
		<span class='inorout'><input id='InCond"+k+"' type='radio' name='inornotin"+k+"'>In /<input id='OutCond"+k+"' type='radio' name='inornotin"+k+"'>Not in</span>\
		<span class='spec'><input id='VBspec"+k+"' class='specVB' placeholder='(<=> 3)' size='6'></span>\
		<span class='vbwits'><input id='VBCond"+k+"' class='VBCondWits' placeholder='(list of witnesses, or \all)' size='40'></span>"+toggleCond+removeCond+addCond+"</div>";
   		$("#conditions").append(thisCond);
   		if (vBase.conditionsets[cSet].conditions[k].in) {$("#InCond"+k).prop("checked", true)} else {$("#OutCond"+k).prop("checked", true)};
   		$("#VBspec"+k).val(vBase.conditionsets[cSet].conditions[k].spec);
    	$("#VBCond"+k).val(vBase.conditionsets[cSet].conditions[k].wits);
    	queryString+="&in"+k+"="+vBase.conditionsets[cSet].conditions[k].in+"&spec"+k+"="+vBase.conditionsets[cSet].conditions[k].spec+"&wits"+k+"="+vBase.conditionsets[cSet].conditions[k].wits;
 	}
 	//update url and document title
 	window.history.replaceState(null, null, "index.html?view=VBase"+queryString);
 	document.title=publication+": VBase Search "+vBase.conditionsets[cSet].name;
}

function doSearch() {
	 	//parse the conditions first
	let vBase=transcripts["VBase"];
//	writeConditions(vBase, 0);
	if (!vBase.witlist.includes('\\all')) vBase.witlist.push("\\all");
	$("#VBerror").html("");
	let conditions=[];
	let found=[];
  	let varsites=[];
  	let condWits=[];
  	if (typeof $("#VBFrom").val()!="undefined") {var varFrom = parseInt($("#VBFrom").val())} else {var varFrom=1};
 	if (typeof $("#VBTo").val()!="undefined") {var varTo = parseInt($("#VBTo").val())} else {var varTo=50};
 	$(".VBCondWits").css('background-color', 'white');
  	$("#searchVBResults").html("");
 	for (var k=0; k<$("div.conditionVB").length; k++) {
  		let thisSpec=$($("#VBspec"+k)[0]).val();
		let thisIn=$('#InCond'+k+':checked').val();
		var isActive=$("div.conditionVB[n="+k+"]")[0];
		if ($("div.conditionVB").length==1) {isActive=true
		} else if ($(isActive).find("a[title='Disable condition']").length>0) {isActive=true} else {isActive=false}
		if (typeof thisIn=="undefined") {thisIn=false} else if (thisIn=="on") {thisIn=true;}
  		conditions.push({"in": thisIn, spec: thisSpec, wits:$($("#VBCond"+k)[0]).val(), witoffsets:[], active: isActive});
  		var wits=$($("#VBCond"+k)[0]).val().split(" ");
  		for (var m=0; m<wits.length; m++) {if (wits[m]=="") wits.splice(m--, 1)};
  		if (wits.length==0) {
  				$("#VBerror").html("No witnesses specified in condition "+(k+1)+". You have to list one or more witnesses!");
  				$("#VBCond"+k).css('background-color', '#ffdddd');
  				return;
  		} else {
  			var mycondition=".conditionVB:nth("+k+")";
			for (var j=0; j<wits.length; j++) {
				var place=vBase.witlist.indexOf(wits[j]);
				if (place==-1) {
					$("#VBerror").html("Witness \""+wits[j]+"\" in condition "+(k+1)+" not present in the witness list");
					$("#VBCond"+k).css('background-color', '#ffdddd');
					return;
				} else {
					conditions[k].witoffsets.push(place);
					condWits.push(wits[j]);  //all wits specifed in conditions
				}
			}
		} 
		//check if there is anything in the specifications
		if (thisSpec!=="") {
			var regex = /\d+/g;
			var matches = thisSpec.match(regex);
			if (conditions[k].gt) delete conditions[k].gt;
			if (conditions[k].lt) delete conditions[k].lt;
			if (conditions[k].eq) delete conditions[k].eq;
			if (conditions[k].nwits) delete conditions[k].nwits;
			if (!matches) {
				$("#VBerror").html("Specification \""+thisSpec+"\" in condition "+(k+1)+" must contain a number");
				var spec=".specVB:nth("+k+")";
				$(spec).css("color", "red");
				return;
			} else {
				var spec=".specVB:nth("+k+")";
				$(spec).css("color", "black");
				conditions[k].nwits=parseInt(matches[0]);
			}
			if (thisSpec.indexOf("<")!=-1) {
				conditions[k].lt=true;
			} else if (thisSpec.indexOf(">")!=-1) {
				conditions[k].gt=true;
			} else if (thisSpec.indexOf("=")!=-1) {
				conditions[k].eq=true;
			}
		}
  	}
  	///ok teed up conditions now...
  	for (var i=0; i<vBase.varsites.length; i++) {
  		if ($("#VBchoose").is(':checked')) {
  			for (let k=0; k<conditions.length; k++) {
  				conditions[k].satisfied=false;
  			}
  		}
  		var condFail=false;
  		if ($("#VBchoose").is(':checked')) {
  			if (typeof vBase.varsites[i].used=="undefined") {
  				vBase.varsites[i].used=[];
  				for (let j=0; j<vBase.varsites[i].variants.length; j++) {
  					vBase.varsites[i].used.push(false);
  				}
  			} else {
				for (let j=0; j<vBase.varsites[i].variants.length; j++) {
					vBase.varsites[i].used[j]=false;
				}
			}
  		}
  		for (var j=0; j<vBase.varsites[i].variants.length; j++) {
  			if (!$("#VBchoose").is(':checked')) {
  				condFail=false;
				for (let k=0; k<conditions.length; k++) {
					if (!conditions[k].active) continue;
					condFail=testCondition(conditions, k, vBase, i, j);
					if (condFail) break;
				}
				if (!condFail) {
  					found.push({varsite:i, variant:j});
  				}
   			} else { //test each condition, to discover if ANY variant satisfies. Keep the variant if each variant satisfies a condition
				for (let k=0; k<conditions.length; k++) {
					if (!conditions[k].active) continue;
					if (vBase.varsites[i].used[j]) continue;
					condFail=testCondition(conditions, k, vBase, i, j);
					if (!condFail) {
						conditions[k].satisfied=true;
						vBase.varsites[i].used[j]=true;
					}
				}
   			}
  		}
  		condFail=false;
  		if ($("#VBchoose").is(':checked')) { //is every condition satisfied?
  			for (let k=0; k<conditions.length; k++) {
  				if (!conditions[k].active) continue;
  				if (!conditions[k].satisfied) condFail=true;
  			}
  			if (!condFail) {
  				found.push({varsite:i, variant:0});
  			}
  		}
  	}
  	$("#VBsuccess").html("Search finished");
  	if ($("#VBchoose").is(':checked')) {
  		var adviseVBChecked=" &nbsp;&nbsp;&nbsp;&nbsp;(<span style='color:red'><b>Find variant sites</b></span> is checked. Do you want this?)"
  	} else {
  		var adviseVBChecked="";
  	}
  	$("#VBResultsHead").html(found.length+" variants found. Displaying variants <input id='VBFrom' type='text' size='3' value='"+varFrom+"'> to <input id='VBTo' type='text' size='3' value='"+varTo+"'>"+adviseVBChecked);
	for (var i=varFrom-1; i<varTo && i<found.length; i++) {
		//ok... let's put it nicely together here
		//make the lemma..
		var varsite=vBase.varsites[found[i].varsite];
		var varsiteN=found[i].varsite;
		var nvars=found[i].variant;
		var entName=varsite.entity;
		var voffset=varnums[nvars];
		var readings=[];
		var nwits=0;
		var wits=""
		//do reading first
		for (var k=0; k<varsite.matrix.length; k++) {
			if (varsite.matrix[k]==voffset) {
				nwits++;
				if (wits=="") wits+=vBase.witlist[k];
				else  wits+=" "+vBase.witlist[k];
			}
		}
		if ($("#VBchoose").is(':checked')) {
			readings.push({reading: varsite.variants[nvars], nWits: nwits, wits: wits});
		} else {
			readings.push({reading: "<span style='color:red'>"+varsite.variants[nvars]+"</span>", nWits: nwits, wits: wits});
		}
		for (var j=0; j<varsite.variants.length; j++) {
			if (j!=nvars) {
				var voffset=varnums[j];
				nwits=0;
				wits="";
				for (var k=0; k<varsite.matrix.length; k++) {
					if (varsite.matrix[k]==voffset) {
						nwits++;
						if (wits=="") wits+=vBase.witlist[k];
						else  wits+=" "+vBase.witlist[k];
					}
				}
				readings.push({reading: varsite.variants[j], nWits: nwits, wits: wits});
			}
		}
		//make the lemma
		var start=0, end=0, /* lemstart=parseInt(vBase.varsites[found[i].varsite].from), lemend=parseInt(vBase.varsites[found[i].varsite].to), */ lemma="";
		//might be whole block..can't be with commedia, change for chaucer
/*		if (!vBase.varsites[found[i].varsite].from) {
			lemma="Whole block";
		} else { */
			for (var k=found[i].varsite; k>=0; k--) {
				if (vBase.varsites[k].entity!=varsite.entity ) {
					start=k+1;
					k=0;
				} else if (k==0) {
					start=0;
				}
			}
			for (var k=found[i].varsite; k<vBase.varsites.length; k++) {
				if (vBase.varsites[k].entity!=varsite.entity) {
					end=k;
					k=vBase.varsites.length;
				} else if (k==vBase.varsites.length-1) end=k;
			}
			//create the whole line and lemma...
			//index of found site...
			for (var k=start; k< found[i].varsite; k++) {
				//no ... have to get lemma from PET ...that is here always  varsites[k].matrix[8]	
				//in CT: it will always be base, which is zero	 
				 lemma+=vBase.varsites[k].variants[0]+" ";
			}
			lemma+="<span style='color:red'>"+vBase.varsites[found[i].varsite].variants[0]+"</span> ";
			for (var k=found[i].varsite+1; k<end; k++) {
				 lemma+=vBase.varsites[k].variants[0]+" ";
			}
/*		} */
		let prefix=varsite.entity.slice(0,2);
		let vbTale=varsite.entity.slice(12, varsite.entity.indexOf(":", 12));
		let vbLine=varsite.entity.slice(varsite.entity.indexOf("line=")+5);
		$("#searchVBResults").append("<div class='VBLemma'>"+currEntities.filter(entity=>entity.val==vbTale)[0].name+", "+vbLine+": "+lemma+' <span class="showTip VBVM'+prefix+' VBVM"><a href="javascript:getCollationVB(\''+vbTale+'\',\''+vbLine+'\')"><img class="VBVmap" src="../common/images/icons/VMap.png" height="24px"></a></span></div>');
		let results="<div>";
		var colors=palette('mpn65', $(readings).length);
		for (let x=0; x<readings.length; x++) {
			 // check if we have a specifed witness here
			 let witString="";
			 let theseWits=readings[x].wits.split(" ");
			 for (let y=0; y<theseWits.length; y++) {
			 	if (condWits.includes(theseWits[y])) {
			 		witString+="<span style='color:#"+colors[x]+"'>"+theseWits[y]+"</span> "
			 	} else {
			 		witString+=theseWits[y]+" ";
			 	}
			 }
			 results+="<div class='VBReading'><span class='VBRdg'>"+readings[x].reading+"</span><span class='VBRdgNWits'>"+readings[x].nWits+"</span>&nbsp;<span class='VBRdgWits'>"+witString+"</span></div>";
		}
	/*	readings.forEach(function(reading){
			results+="<div class='VBReading'><span class='VBRdg'>"+reading.reading+"</span><span class='VBRdgNWits'>"+reading.nWits+"</span>&nbsp;<span class='VBRdgWits'>"+reading.wits+"</span></div>";
		}); */
		results+="</div>";
		$("#searchVBResults").append(results);
		//do we need vMaps here? surely not
//		varsites.push({lemma: "<b>"+varsite.entity+": "+lemma+"</b>", readings: readings});	
//		$(".VBVM").hover(openVBVMap, closeVBVMap);
//		$(".infoVM").hover(openinfoVM);
	}
	
  	searchDone=true;
  	found=found.length;
}

async function showVBaseSite() {
	let source = dw_Tooltip.actuator;
	if (!$("#spellingBox").is(':checked')) {
		var lines = $($(source).closest(".varGroup")[0]).find(".appline");
	} else {
		var lines = $($(source).closest(".varGroup")[0]).find(".spMsGrp");
	}
	//add the wits from the lines into the loaded VBase..
	if (typeof transcripts["VBase"]=="undefined") { 
		await getVBase();
	}
	var vBase=transcripts["VBase"];
	//if not in the default form... set condition set 0 back to nothing
	vBase.conditionsets[0].conditions[0].wits="";
	vBase.conditionsets[0].conditions[0].in=true;
	vBase.conditionsets[0].conditions[0].spec="";
	vBase.conditionsets[0].conditions.splice(1, vBase.conditionsets[0].conditions.length-1);
	lines.each(function(index){
		if (!$("#spellingBox").is(':checked')) {
			var wits=$(this).find(".wits,.variantWits")[0].innerText;  //all the wits
			var nWits=wits.split(" ").length;
		} else {
			var wits="";
			let witnesses=$(this).find("a");
			var nWits=0;
			witnesses.each(function(){
				wits+=$(this).text()+" ";
				nWits++;
			})
			wits=wits.trim();
		}
		var spec="";
		if (nWits>=6) {
			spec=">4";
		} else if (nWits>=5) {
			spec=">3";
		} else if (nWits>=4) {
			spec=">2";
		}
		if (index==0) {
			vBase.conditionsets[0].conditions[0].wits=wits;
			vBase.conditionsets[0].conditions[0].in=true;
			vBase.conditionsets[0].conditions[0].spec=spec;
		} else {
			vBase.conditionsets[0].conditions.push({"in":true, "spec": spec, "wits": wits})
		}
	})
	//now lets do a search on it.. lol....
	$( "#VBchoose" ).prop( "checked", true );
	searchVBase(vBase);
	doSearch();
}

function openinfoVM(){
	dw_Tooltip.klass="tooltip";
}



function testCondition(conditions, k, vBase, i, j) {
	var t=varnums[j];
	var nts=0; 
	let totWits=0;
	for (var l=0; l<vBase.varsites[i].matrix.length; l++) {
		if (vBase.varsites[i].matrix[l]==t) totWits++;
	  }
	if (conditions[k].wits=="\\all") {
	   	nts=totWits;
 	} else for (var l=0; l<conditions[k].witoffsets.length; l++) {
		if (vBase.varsites[i].matrix[conditions[k].witoffsets[l]]==t) nts++;
	}
	if (conditions[k].spec=="") {
		if (conditions[k].in) {
			if (conditions[k].witoffsets.length!=nts) {
				return (true);
			}
		} else {
			if (nts!=0) {
				return (true);
			}
		}
	} else {//we have a spec...Can either be < or > or the same number as mss found
		if (conditions[k].gt) {
			if (nts<=conditions[k].nwits) {
				return (true);
			}
		} else if (conditions[k].lt) {
			if (nts>=conditions[k].nwits) {
				return (true);
			}
		} else if (conditions[k].eq) {
			if (totWits!=conditions[k].nwits || nts!= conditions[k].nwits) {
				return (true);
			}
		} else {
			if (nts!=conditions[k].nwits) {
				return (true);
			}
		}
	} //got here? it worked
	return (false);
}

