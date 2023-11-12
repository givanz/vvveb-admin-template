window.delay = (function(){
  var timer = 0;
  return function(callback, ms){
    clearTimeout (timer);
    timer = setTimeout(callback, ms);
  };
})();

//let theme = localStorage.getItem("theme", "dark");
let theme = $("html").attr("data-bs-theme");
if (theme) {
	if (theme == "dark") {
		$("#color-theme-switch i").removeClass("la-sun").addClass("la-moon");
	}
	//$("html").attr("data-bs-theme", theme);
}

//let smallNav = localStorage.getItem("sidebar-size", "small-nav");
let smallNav = document.cookie.indexOf("sidebar-size=small-nav") > 0;
if (smallNav) {
	$("#container").addClass(smallNav);
}

function setCookie(name, value) {
	//try to set cookie to all subdomains
	document.cookie = name + "=" + value + ";path=/;domain=." + window.location.host.replace(/^.*?\./, '') + ";";
	document.cookie = name + "=" + value + ";";
}

jQuery(document).ready(function() {
	
	jQuery(".menu-toggle").click(function() {  
		if ($("#container").hasClass("small-nav")) {
			$("#container").removeClass("small-nav");
			smallNav = ""; 
		} else {
			smallNav = "small-nav";
			$("#container").addClass(smallNav);
		}
		
		//localStorage.setItem('sidebar-size', smallNav);
		setCookie('sidebar-size', smallNav);
	});
	
	$("#color-theme-switch").click(function () {
		
		let theme = $("html").attr("data-bs-theme");
		
		if (theme == "dark") {
			theme = "light";
			$("i",this).removeClass("la-moon").addClass("la-sun");
		} else if (theme == "light" || theme == "auto" || !theme) {
			theme = "dark";
			$("i", this).removeClass("la-sun").addClass("la-moon");
		} else {
			theme = "auto";
		}
		
		$("html").attr("data-bs-theme", theme);
		//localStorage.setItem("theme", theme);
		setCookie("theme", theme);
		//serverStorage.setItem();
	});
});