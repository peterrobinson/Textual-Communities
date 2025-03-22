var $ = require('jquery')
  , JSZip = require('jszip')
  , JSZipUtils = require('jszip-utils')
;


var BrowserFunctionService = {
  prettyTei: function(teiRoot) {
    _.dfs([teiRoot], function(el) {
      var children = [];
      _.each(el.children, function(childEl) {
        if (['pb', 'cb', 'lb', 'div','body','/div'].indexOf(childEl.name) !== -1) {
          children.push({
            name: '#text',
            text: '\n',
          });
        }
        children.push(childEl);
      });
      el.children = children;
    });
    return teiRoot;
  },
  urlToPromise: function (url,cb) {
	return new Promise(function(resolve, reject) {
		JSZipUtils.getBinaryContent(url, function (err, data) {
			if(err) {
				reject(err);
			} else {
				resolve(data);
				cb(null, []);
			}
		});
	});
  },
  adjustResult: function(self, source, isIndex, persistVals, persistScripts) {
	let replaceStr="";
	if (persistVals.length>0) {
		replaceStr+="<script>const ";
		for (let i=0; i<persistVals.length; i++) {
			if (!persistVals[i].isobject) {
					replaceStr+=persistVals[i].key+" = "+'"'+persistVals[i].value+'"';
				} else {
					replaceStr+=persistVals[i].key+" = "+persistVals[i].value;
				}
			if (i<persistVals.length-1) replaceStr+=", "; 
		} 
		replaceStr+="</script>\n"; 
	}
	if (persistScripts.length>0) {
		for (let i=0; i<persistScripts.length; i++) {
			if (typeof persistScripts[i]=="undefined") continue;  //catches case where aliases file does not exist
			replaceStr+='<script type="text/javascript" src="'+persistScripts[i]+'"></script>\n';
		}
		source=source.replace('<script id="placeholder"></script>', replaceStr);
//		if (self.config.hasOwnProperty("ssSearch") && source.indexOf('<div id="staticSearch"></div>')>-1) {
//			source=source.replace('<div id="staticSearch"></div>',self.config.ssSearch);
//		} 
	} 
	//remove all file references with ../common
	source=source.replace(/src="[^"]+\/common\//g,'src="../../../common/');
	source=source.replace(/src='[^']+\/common\//g, "src='../../../common/");
	source=source.replace(/href="[^"]+\/common\//g,'href="../../../common/');
	source=source.replace(/href='[^']+\/common\//g, "href='../../../common/");
	source=source.replace(/universalBannerLocation = "[^"]+\/common\//g, 'universalBannerLocation="../../../common/');
	source=source.replace(/splash = "[^"]+\/common\//g, 'splash = "../../../common/');

//	source=source.replace(/url\(&quot;.*?\/common\//g, "url(&quot;../../../common/");
	if (isIndex) source=source.replaceAll("../../../", "");
	return(source);
 },
  customTemplates: function (str, drivervalues,driverfiles) { //we only add stuff used in the driver process here
	let myDOM = new DOMParser().parseFromString(str, "text/html");
	if (drivervalues.length>0) {
		let driverscript="<script class='driverScript'>const ";
		for (let i=0; i<drivervalues.length; i++) {
			if (!drivervalues[i].isobject) {
				driverscript+=drivervalues[i].key+" = "+'"'+drivervalues[i].value+'"';
			} else {
				driverscript+=drivervalues[i].key+" = "+drivervalues[i].value;
			}
			if (i<drivervalues.length-1) driverscript+=", ";
		}
		driverscript+="<";
		driverscript+="/script>\n";
		$(myDOM).contents().find("head")[0].insertAdjacentHTML('beforeend', driverscript);
	}
	if (driverfiles.length>0) {
		let dfiles="";
		for (let i=0; i<driverfiles.length; i++) {
			if (typeof driverfiles[i]=="undefined") continue;  //catches case where aliases file does not exist
			dfiles+='<script type="text/javascript" class="driverScript" src="'+driverfiles[i]+'"><';
			dfiles+='/script>\n';
		}
		$(myDOM).contents().find("head")[0].insertAdjacentHTML('beforeend', dfiles);
	}
	let s = new XMLSerializer();
	return(s.serializeToString(myDOM)); 
  },
  download: function (content, filename, contentType)  {
  /*    if(!contentType) contentType = 'application/octet-stream';
      var a = document.createElement('a');
      var blob = new Blob([content], {'type':contentType});
      a.href = window.URL.createObjectURL(blob);
      a.download = filename;
      a.click(); */
      let file = new File([content], filename, {type: contentType});
      let link = document.createElement('a')
 	  let url = URL.createObjectURL(file)
	  link.href = url
	  link.download = file.name
	  document.body.appendChild(link)
	  link.click()
	  document.body.removeChild(link)
	  window.URL.revokeObjectURL(url)
  },
  isImageViewable:function(page, state) {
    if (state.role=="CREATOR" || state.role=="LEADER") return true;   //always veiwable
    if (state.role=="NONE") {
        if ((page.attrs.control && page.attrs.control.images!="INHERITED") && page.attrs.control.images=="ALL") return true;
        if ((page.attrs.control && page.attrs.control.images!="INHERITED") && page.attrs.control.images!="ALL") {state.imsg=page.attrs.control.imsg; state.image=null; return false};
        if ((state.document.attrs.control && state.document.attrs.control.images!="INHERITED") && state.document.attrs.control.images=="ALL") return true;
        if ((state.document.attrs.control && state.document.attrs.control.images!="INHERITED") && state.document.attrs.control.images!="ALL") {state.imsg=state.document.attrs.control.imsg; state.image=null; return false};
        if (state.community.attrs.control && state.community.attrs.control.images=="ALL")  return true;
        if (state.community.attrs.control && state.community.attrs.control.images!="ALL") {state.imsg=state.community.attrs.control.imsg; state.image=null; return false};
        return true;
    }
    if (state.role=="VIEWER") {
      if ((page.attrs.control && page.attrs.control.images!="INHERITED") && (page.attrs.control.images=="ALL" || page.attrs.control.images=="VIEWERS")) return true;
      if ((page.attrs.control && page.attrs.control.images!="INHERITED") && (page.attrs.control.images!="ALL" && page.attrs.control.images!="VIEWERS")) {state.imsg=page.attrs.control.imsg; state.image=null; return false};
      if ((state.document.attrs.control && state.document.attrs.control.images!="INHERITED") && (state.document.attrs.control.images=="ALL" || state.document.attrs.control.images=="VIEWERS")) return true;
      if ((state.document.attrs.control && state.document.attrs.control.images!="INHERITED") && (state.document.attrs.control.images!="ALL" && state.document.attrs.control.images!="VIEWERS")) {state.imsg=state.document.attrs.control.imsg; state.image=null; return false};
      if (state.community.attrs.control && (state.community.attrs.control.images=="ALL" || state.community.attrs.control.images=="VIEWERS"))  return true;
      if (state.community.attrs.control && (state.community.attrs.control.images!="ALL" && state.community.attrs.control.images!="VIEWERS")) {state.imsg=state.community.attrs.control.imsg; state.image=null; return false};
      return true;
    }
    if (state.role=="MEMBER") {
      if ((page.attrs.control && page.attrs.control.images!="INHERITED") && (page.attrs.control.images=="ALL" || page.attrs.control.images=="VIEWERS" || page.attrs.control.images=="MEMBERS")) return true;
      if ((page.attrs.control && page.attrs.control.images!="INHERITED") && (page.attrs.control.images!="ALL" && page.attrs.control.images!="VIEWERS" && page.attrs.control.images!="MEMBERS")) {state.imsg=page.attrs.control.imsg; state.image=null; return false};
      if ((state.document.attrs.control && state.document.attrs.control.images!="INHERITED") && (state.document.attrs.control.images=="ALL" || state.document.attrs.control.images=="VIEWERS" || state.document.attrs.control.images=="MEMBERS")) return true;
      if ((state.document.attrs.control && state.document.attrs.control.images!="INHERITED") && (state.document.attrs.control.images!="ALL" && state.document.attrs.control.images!="VIEWERS" && state.document.attrs.control.images!="MEMBERS")) {state.imsg=state.document.attrs.control.imsg; state.image=null; return false};
      if (state.community.attrs.control && (state.community.attrs.control.images=="ALL" || state.community.attrs.control.images=="VIEWERS" || state.community.attrs.control.images=="MEMBERS"))  return true;
      if (state.community.attrs.control && (state.community.attrs.control.images!="ALL" && state.community.attrs.control.images!="VIEWERS" && state.community.attrs.control.images!="MEMBERS")) {state.imsg=state.community.attrs.control.imsg; state.image=null; return false};
      return true;
    }
    state.image=null;
    return(false);
  },
  isPageImageTranscriptLocked: function(doc, state) {
    if (doc.attrs=="dummy" || !state.document || state.document.attrs.requested) return false;  //not yet fully loaded
    if (!this.isImageViewable(doc, state)) {return true;}
    if (!this.isPageViewable(doc, state)) {doc.isPageITlocked=true; return true;}
    return(false);
  },
  isPageViewable:function(page, state) {
    if (state.role=="CREATOR" || state.role=="LEADER") return true;   //always veiwable
    if (state.role=="NONE") {
        if ((page.attrs.control && page.attrs.control.transcripts!="INHERITED") && page.attrs.control.transcripts=="ALL") return true;
        if ((page.attrs.control && page.attrs.control.transcripts!="INHERITED") && page.attrs.control.transcripts!="ALL") {state.tmsg=page.attrs.control.tmsg; return false};
        if ((state.document.attrs.control && state.document.attrs.control.transcripts!="INHERITED") && state.document.attrs.control.transcripts=="ALL") return true;
        if ((state.document.attrs.control && state.document.attrs.control.transcripts!="INHERITED") && state.document.attrs.control.transcripts!="ALL") {state.tmsg=state.document.attrs.control.tmsg; return false};
        if (state.community.attrs.control && state.community.attrs.control.transcripts=="ALL") return true;
        if (state.community.attrs.control && state.community.attrs.control.transcripts!="ALL") {state.tmsg=state.community.attrs.control.tmsg;  return false};
        return true;
    }
    if (state.role=="VIEWER") {
      if ((page.attrs.control && page.attrs.control.transcripts!="INHERITED") && (page.attrs.control.transcripts=="ALL" || page.attrs.control.transcripts=="VIEWERS")) return true;
      if ((page.attrs.control && page.attrs.control.transcripts!="INHERITED") && (page.attrs.control.transcripts!="ALL" && page.attrs.control.transcripts!="VIEWERS")) {state.tmsg=page.attrs.control.tmsg; return false};
      if ((state.document.attrs.control && state.document.attrs.control.transcripts!="INHERITED") && (state.document.attrs.control.transcripts=="ALL" || state.document.attrs.control.transcripts=="VIEWERS")) return true;
      if ((state.document.attrs.control && state.document.attrs.control.transcripts!="INHERITED") && (state.document.attrs.control.transcripts!="ALL" && state.document.attrs.control.transcripts!="VIEWERS")) {state.tmsg=state.document.attrs.control.tmsg;  return false};
      if (state.community.attrs.control && (state.community.attrs.control.transcripts=="ALL" || state.community.attrs.control.transcripts=="VIEWERS"))  return true;
      if (state.community.attrs.control && (state.community.attrs.control.transcripts!="ALL" && state.community.attrs.control.transcripts!="VIEWERS")) {state.tmsg=state.community.attrs.control.tmsg; return false};
      return true;
    }
    if (state.role=="MEMBER") {
      if ((page.attrs.control && page.attrs.control.transcripts!="INHERITED") && (page.attrs.control.transcripts=="ALL" || page.attrs.control.transcripts=="VIEWERS" || page.attrs.control.transcripts=="MEMBERS")) return true;
      if ((page.attrs.control && page.attrs.control.transcripts!="INHERITED") && (page.attrs.control.transcripts!="ALL" && page.attrs.control.transcripts!="VIEWERS" && page.attrs.control.transcripts!="MEMBERS")) {state.tmsg=page.attrs.control.tmsg; return false};
      if ((state.document.attrs.control && state.document.attrs.control.transcripts!="INHERITED") && (state.document.attrs.control.transcripts=="ALL" || state.document.attrs.control.transcripts=="VIEWERS" || state.document.attrs.control.transcripts=="MEMBERS")) return true;
      if ((state.document.attrs.control && state.document.attrs.control.transcripts!="INHERITED") && (state.document.attrs.control.transcripts!="ALL" && state.document.attrs.control.transcripts!="VIEWERS" && state.document.attrs.control.transcripts!="MEMBERS")) {state.tmsg=state.document.attrs.control.tmsg; return false};
      if (state.community.attrs.control && (state.community.attrs.control.transcripts=="ALL" || state.community.attrs.control.transcripts=="VIEWERS" || state.community.attrs.control.transcripts=="MEMBERS"))  return true;
      if (state.community.attrs.control && (state.community.attrs.control.transcripts!="ALL" && state.community.attrs.control.transcripts!="VIEWERS" && state.community.attrs.control.transcripts!="MEMBERS")) {state.tmsg=state.community.attrs.control.tmsg; return false};
      return true;
    }
  },
   getRole:function(state, community) {
    if (!state.authUser || Object.keys(state.authUser.attrs).length==0) {
    	return "none"
    } else {
    	var memberships = _.get(state.authUser, 'attrs.memberships');
		if (memberships.filter(member=>member.community.attrs._id==community.attrs._id).length==0) { 
			return "none";
	   } else {
			var role= memberships.filter(member=>member.community.attrs._id==community.attrs._id)[0].role;
			return role;
	   }
    }
  },
  canAddDocument:function(community, user) {
  	if (!community || !state) return false;
  	if (Object.keys(user.attrs).length==0) {
    	return false;
    } else {
    	var memberships = _.get(user, 'attrs.memberships');
		if (memberships.filter(member=>member.community.attrs._id==community.attrs._id).length==0) { 
			return false;
	   } else {
			var role= memberships.filter(member=>member.community.attrs._id==community.attrs._id)[0].role;
			if (role=="LEADER" || role=="CREATOR") {
				return true;
			} else {
				return false;
			}
	   }
    }
  },
  canJoin:function(state, community) {
  	var role=this.getRole(state, community);
  	if (role=="none" && _.get(community, 'attrs.accept', true)) {
  		return(true); 
  	} else {
  		return(false);
  	}
  }
}
module.exports = BrowserFunctionService;
