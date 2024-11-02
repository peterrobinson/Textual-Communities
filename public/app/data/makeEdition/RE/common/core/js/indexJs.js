function initIndex () {
	$.get(universalBannerLocation, function (data, status){
		$("#editorialMenu").html($(data).find("#editorialMenu").html());
		$("#entityMenu").html($(data).find("#entityMenu").html());
		$("#entityMenu").html(initializeEntityChoice(currEntity, currMS));
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


