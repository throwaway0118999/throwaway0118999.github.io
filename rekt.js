window.onload = function() {
	for (int i = 0; i<100; i++){
		var data = {};

		data.title = "Title";
		data.type = "Proteção";
		data.severity = 3;
		data.description = "asdasdasdasd";
		data.privacy = false;
		data.lat = 38.65371863758288;
		data.lng = -9.170751571655273;
		data.mediaSize = 1;
		data.tokenID = "ub497aab1-1dfa-49a5-97b6-d2cff6d62713";
		data.address = "E1, 2810-354 Almada, Portugal";

		$.ajax({
			type : "POST",
			url : "https://almadaconsigo.appspot.com/rest/register/occurrence",
			contentType : "application/json; charset=utf-8",
			crossDomain : true,
			// dataType: "json",
			success : function(response) {
				console.log("Created issue "+i)
			},
			error : function(response) {
				
			},
			data : JSON.stringify(data)
		});
	}
}
