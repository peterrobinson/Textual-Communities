/**
 * @preserve
 *               ssInitialize.js              
 * Authors: Martin Holmes and Joey Takeda.
 * mholmes@uvic.ca, joey.takeda@gmail.com.
 *       University of Victoria.          
 *
 * This file is part of the projectEndings staticSearch
 * project. 

 * Free to anyone for any purpose, but acknowledgement 
 * would be appreciated. The code is licensed under 
 * both MPL and BSD.
 *
 * WARNING:
 * This lib has "use strict" defined. You may
 * need to remove that if you are mixing this
 * code with non-strict JavaScript.
 * 
 * This file creates the global Sch variable and 
 * assigns an instance of the StaticSearch object to it.
 * This is the initialization process for the search 
 * page functionality. You may want to replace or remove
 * this file after the build process if you want to have
 * more control over how the object is initialized.
*/

"use strict";

var Sch;
window.addEventListener('load', function(){Sch = new StaticSearch();
	Sch.searchFinishedHook = function (num) {
		$("#splash").hide();
		$("#rTable").hide();
		$("#editorial").hide();
		$("#compareFrame").hide();
		$("#searchContainer").html($("#ssResults").html());
		rewriteLinks();
		$("#searchContainer").show();
		resizeRTable();
   }
});

function rewriteLinks() {
	let links=$("#searchContainer").find("a")
	if (window.location.pathname.indexOf("html/transcripts")>-1 || window.location.pathname.indexOf("html/compare")>-1) {
		for (let i=0; i<links.length; i++) {
			if ($(links[i]).attr("href").indexOf("html/transcripts")>-1) {
				$(links[i]).attr("href", "../../../"+$(links[i]).attr("href"));
			}
			if ($(links[i]).attr("href").indexOf("html/compare")>-1) {
				$(links[i]).attr("href", "../../../"+$(links[i]).attr("href"));
			}
			if ($(links[i]).attr("href").indexOf("html/editorial")>-1) {
				$(links[i]).attr("href", "../../../"+$(links[i]).attr("href"));
			}
		}
	}
}