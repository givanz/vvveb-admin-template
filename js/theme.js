window.delay = (function(){
  var timer = 0;
  return function(callback, ms){
    clearTimeout (timer);
    timer = setTimeout(callback, ms);
  };
})();

//let theme = localStorage.getItem("theme", "dark");
let theme = document.documentElement.dataset.bsTheme;
if (theme) {
	if (theme == "dark") {
		let themeSwitch = document.querySelector("#color-theme-switch i");
		themeSwitch.classList.remove("la-sun")
		themeSwitch.classList.add("la-moon");
	}
}

//let smallNav = localStorage.getItem("sidebar-size", "small-nav");
let smallNav = document.cookie.indexOf("sidebar-size=small-nav") > 0;
if (smallNav) {
	document.getElementById("container").classList.add(smallNav);
}

function setCookie(name, value) {
	//try to set cookie to all subdomains
	document.cookie = name + "=" + value + ";path=/;domain=." + window.location.host.replace(/^.*?\./, '') + ";";
	document.cookie = name + "=" + value + ";";
}

let onReady = function() {
	
	 document.querySelector(".menu-toggle")?.addEventListener("click", function(event) {  
		let container = document.getElementById("container");
		if (container.classList.contains("small-nav")) {
			container.classList.remove("small-nav");
			smallNav = ""; 
		} else {
			smallNav = "small-nav";
			container.classList.add(smallNav);
		}
		
		//localStorage.setItem('sidebar-size', smallNav);
		setCookie('sidebar-size', smallNav);
	});
	
	let themeSwitch = document.querySelector("#color-theme-switch i");
	
	themeSwitch.addEventListener("click", function (event) {
		
		let theme = document.documentElement.dataset.bsTheme;
		
		if (theme == "dark") {
			theme = "light";
			themeSwitch.classList.remove("la-moon")
			themeSwitch.classList.add("la-sun");
		} else if (theme == "light" || theme == "auto" || !theme) {
			theme = "dark";
			themeSwitch.classList.remove("la-sun")
			themeSwitch.classList.add("la-moon");
		} else {
			theme = "auto";
		}
		
		document.documentElement.dataset.bsTheme = theme;
		//localStorage.setItem("theme", theme);
		setCookie("theme", theme);
		//serverStorage.setItem();
	});
};

if (document.readyState !== "loading") {
	onReady();
} else {
	document.addEventListener('DOMContentLoaded', onReady);
}



function generateElements(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.children;
}

		
//ajax url
function loadAjax(url, selector, callback = null, params = {}, method = "get") {
	let options = {method};
	if (method == "post" && params) {
		options.body = new URLSearchParams(params);
	}
	
	fetch(url, options).
	then((response) => {
		if (!response.ok) { throw new Error(response) }
		return response.text()
	}).then(function (data) {
		if (selector) {
			let response = new DOMParser().parseFromString(data, "text/html");

			if (Array.isArray (selector) ) {
				for (const k in selector) {
					let elementSelector = selector[k];
					let currentElement = document.querySelector(elementSelector);
					let newElement = response.querySelector(elementSelector);
					if (currentElement && newElement) {
						currentElement.replaceWith(newElement);
					}
				}
			} else {
				let currentElement = document.querySelector(selector);
				let newElement = response.querySelector(selector);

				if (currentElement && newElement) {
					currentElement.replaceWith(newElement);
				}
			}
			
			if (callback) callback();
		}		

		window.dispatchEvent(new CustomEvent("vvveb.loadUrl", {detail: {url, selector}}));
	}).catch(error => {
		console.log(error.statusText);
	});
}
