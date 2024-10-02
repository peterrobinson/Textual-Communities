function initEditorial () {
	$("#page-head").load(universalBannerLocation, function (){
		$("#staticSearch").html("<script xmlns='http://www.w3.org/1999/xhtml' src='../../../staticSearch/ssSearch.js'></script>\n<script xmlns='http://www.w3.org/1999/xhtml' src='../../../staticSearch/ssInitialize.js'>\n</script><script xmlns='http://www.w3.org/1999/xhtml' src='../../../staticSearch/ssHighlight.js'></script>\n<form xmlns='http://www.w3.org/1999/xhtml' accept-charset='UTF-8' id='ssForm'  data-allowphrasal='yes' data-allowwildcards='yes' data-minwordlength='2'  data-scrolltotextfragment='no' data-maxkwicstoshow='5' data-resultsperpage='5'  onsubmit='return false;' data-versionstring='' data-ssfolder='../../../staticSearch' data-kwictruncatestring='...' data-resultslimit='2000'><span class='ssQueryAndButton'><input type='text' id='ssQuery' style='height: 23px' aria-label='Search'/><button id='ssDoSearch' style='background-image: url(\"../../../common/core/images/searchicon.png\")');>Search</button></span></form>\n<div xmlns='http://www.w3.org/1999/xhtml' id='ssSearching'></div>")
	
	});
	$("#rTable").show();
	$("#panel-left").hide();
	$("#editorial").show();
	var panelRight = new Clay('#panel-right');
	panelRight.on('resize', function(size) {
		resizeRTable();
	});
	resizeRTable();  
}


