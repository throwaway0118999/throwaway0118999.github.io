var time = 386;
var dory = 0;

window.onload = function init() {
	nohope();
}

function nohope() {
	var txt = document.getElementById("dory");

	if(dory%10 == 0) {
		txt.innerHTML += "<b>hi im dory!</b> ";
	}

	txt.innerHTML += "help me find my family ";

	if(time < 50 && dory%25 == 0) {
		txt.innerHTML += "<h4>there is no escape from this hell</h4>";
	}

	time /= 1.01;
        ++dory;
	window.scrollTo(0, document.body.scrollHeight);
	setTimeout(nohope, time);
}