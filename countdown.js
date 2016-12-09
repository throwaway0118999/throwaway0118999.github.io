var target_rc = new Date(2016, 11, 10, 14);
var target_ia = new Date(2016, 11, 10);
var target_cgi = new Date(2016, 11, 11);
var target_mds = new Date(2016, 11, 12);

window.onload = function init() {
	updateTimes();
}

function updateTimes() {
	var d = new Date();

        var new_rc = new Date(target_rc - d);
	var rc_d = (Number(target_rc.getDate()) - Number(d.getDate()) - 1).toString();
	var rc_h = new_rc.getHours();
	var rc_m = new_rc.getMinutes();
	var rc_s = new_rc.getSeconds();

	var rc_str = rc_d + " dia" + (rc_d != "1" ? "s" : "") + ", " +
		     rc_h + " hora" + (rc_h != "1" ? "s" : "") + ", " +
		     rc_m + " minuto" + (rc_m != "1" ? "s" : "") + " e " +
   		     rc_s + " segundo" + (rc_s != "1" ? "s" : "");
	
	document.getElementById("rc_clock").textContent = rc_str;

        var new_ia = new Date(target_ia - d);
	var ia_d = (Number(target_ia.getDate()) - Number(d.getDate()) - 1).toString();
	var ia_h = new_ia.getHours();
	var ia_m = new_ia.getMinutes();
	var ia_s = new_ia.getSeconds();


	var ia_str = ia_d + " dia" + (ia_d != "1" ? "s" : "") + ", " +
		     ia_h + " hora" + (ia_h != "1" ? "s" : "") + ", " +
		     ia_m + " minuto" + (ia_m != "1" ? "s" : "") + " e " +
   		     ia_s + " segundo" + (ia_s != "1" ? "s" : "");
	
	document.getElementById("ia_clock").textContent = ia_str;

	var new_cgi = new Date(target_cgi - d);
	var cgi_d = (Number(target_cgi.getDate()) - Number(d.getDate()) - 1).toString();
	var cgi_h = new_cgi.getHours();
	var cgi_m = new_cgi.getMinutes();
	var cgi_s = new_cgi.getSeconds();


	var cgi_str = cgi_d + " dia" + (cgi_d != "1" ? "s" : "") + ", " +
		     cgi_h + " hora" + (cgi_h != "1" ? "s" : "") + ", " +
		     cgi_m + " minuto" + (cgi_m != "1" ? "s" : "") + " e " +
   		     cgi_s + " segundo" + (cgi_s != "1" ? "s" : "");
	
	document.getElementById("cgi_clock").textContent = cgi_str;

        var new_mds = new Date(target_mds - d);
	var mds_d = (Number(target_mds.getDate()) - Number(d.getDate()) - 1).toString();
	var mds_h = new_mds.getHours();
	var mds_m = new_mds.getMinutes();
	var mds_s = new_mds.getSeconds();


	var mds_str = mds_d + " dia" + (mds_d != "1" ? "s" : "") + ", " +
		     mds_h + " hora" + (mds_h != "1" ? "s" : "") + ", " +
		     mds_m + " minuto" + (mds_m != "1" ? "s" : "") + " e " +
   		     mds_s + " segundo" + (mds_s != "1" ? "s" : "");
	
	document.getElementById("mds_clock").textContent = mds_str;

	setTimeout(updateTimes, 1000);
}