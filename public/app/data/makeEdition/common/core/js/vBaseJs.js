const varnums=[0,1,2,3,4,5,6,7,8,9,"a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"]
var transcripts=[];
		
function createVBase(){ //ok so this is where it happens
	$.get(universalBannerLocation, function (data, status){
		$("#editorialMenu").html($(data).find("#editorialMenu").html());
		$("#entityMenu").html($(data).find("#entityMenu").html());
		$("#entityMenu").html(initializeEntityChoice(currEntity));
		$("#MS").val(currMS);
 		resizeRTable();
  		if (window.location.search=="") {
  			writeConditions(vBase, 1);
  			$($("input[name=presetVB]")[0]).prop( "checked", true );
  			doSearch();
  		} else {
   			startVBfromURL()
  		}
	});
}

//everything else in vBaseUtilsJs file