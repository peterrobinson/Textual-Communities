function initEditorial () {
	$.get(universalBannerLocation, function (data, status){
		$("#editorialMenu").html($(data).find("#editorialMenu").html());
		$("#entityMenu").html($(data).find("#entityMenu").html());
		$("#entityMenu").html(initializeEntityChoice(currEntity, currMS));
		$("#rTable").show();
		$("#panel-left").hide();
		$("#editorial").show();
		var panelRight = new Clay('#panel-right');
		panelRight.on('resize', function(size) {
			resizeRTable();
		});
		resizeRTable();  
	});
}