function initIndex () {
	$("#page-head").load(universalBannerLocation, function (){
		if (ssSearch) {
			$("#staticSearch").html("<script xmlns='http://www.w3.org/1999/xhtml' src='staticSearch/ssSearch.js'></script>\n<script xmlns='http://www.w3.org/1999/xhtml' src='staticSearch/ssInitialize.js'>\n</script><script xmlns='http://www.w3.org/1999/xhtml' src='staticSearch/ssHighlight.js'></script>\n<form xmlns='http://www.w3.org/1999/xhtml' accept-charset='UTF-8' id='ssForm'  data-allowphrasal='yes' data-allowwildcards='yes' data-minwordlength='2'  data-scrolltotextfragment='no' data-maxkwicstoshow='5' data-resultsperpage='5'  onsubmit='return false;' data-versionstring='' data-ssfolder='staticSearch' data-kwictruncatestring='...' data-resultslimit='2000'><span class='ssQueryAndButton'><input type='text' id='ssQuery' style='height: 25px' aria-label='Search'/><button id='ssDoSearch' style='background-image: url(\"common/core/images/searchicon.png\")');>Search</button></span></form>\n<div xmlns='http://www.w3.org/1999/xhtml' id='ssSearching'></div>")
		}
		let attrs=$("[src]");
		for (let i=0; i<attrs.length; i++) {
			if ($(attrs[i]).attr("src").indexOf("../")>-1) {
				let src=$(attrs[i]).attr("src");
				$(attrs[i]).attr("src", src.replace("../../../",""));
			}
		}
		attrs=$("[href]");
		for (let i=0; i<attrs.length; i++) {
			if ($(attrs[i]).attr("href").indexOf("../")>-1) {
				let href=$(attrs[i]).attr("href");
				$(attrs[i]).attr("href", href.replace("../../../",""));
			}
		}
		resizeRTable();  

	});
}


