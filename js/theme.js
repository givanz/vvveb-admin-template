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
/*
function displayToast(bg, title, message, id = "top-toast") {
	document.querySelector("#" + id + " .toast-body .message").innerHTML = message;
	let header = document.querySelector("#" + id + " .toast-header");
	header.classList.remove(["bg-danger", "bg-success"])
	header.classList.add(bg);
	header.querySelector("strong").innerHTML = title;
	let toast = document.querySelector("#" + id + " .toast").cloneNode();
	toast.classList.add("show");
	delay(() => toast.remove(), 5000);
}	
*/		
//ajax url
function loadAjax(url, selector, callback = null, params = {}, method = "get") {
	let options = {method};
	if (params) {
		let p = new URLSearchParams(params);
		if (method == "post") {
			options.body = p;
		} else {
			url += (url.indexOf('?') > 0 ? '&' :'?') + p.toString();
		}
	}
	
	fetch(url, options).
	then((response) => {
		if (!response.ok) { throw new Error(response) }
		return response.text()
	}).then(function (data) {
		if (selector) {
			let response = new DOMParser().parseFromString(data, "text/html");
			if (!Array.isArray (selector) ) {
				selector = [selector];
			}
			
			for (const k in selector) {
				let elementSelector = selector[k];
				let currentElements = document.querySelectorAll(elementSelector);
				let newElements = response.querySelectorAll(elementSelector);
				
				if (currentElements && newElements) {
					currentElements.forEach( (e, i) => {
						let newElement = newElements[i] ?? document.createElement("null");
						e.replaceWith(newElement);
						newElement.querySelectorAll('script').forEach(oldScriptEl => {
							  const newScriptEl = document.createElement("script");
							  
							  Array.from(oldScriptEl.attributes).forEach( attr => {
								newScriptEl.setAttribute(attr.name, attr.value) 
							  });
							  
							  const scriptText = document.createTextNode(oldScriptEl.innerHTML);
							  newScriptEl.appendChild(scriptText);
							  oldScriptEl.replaceChildren();
							  oldScriptEl.parentNode.replaceChild(newScriptEl, oldScriptEl);
							  oldScriptEl.remove();
							  
						});
					});
				} /*if (currentElements) {
					currentElements.forEach(e => e.remove());
				} else if (newElements) {
					//new elements don't  have corresponding elements on the page, reload hole page
					response = new DOMParser().parseFromString(data, "text/html")
					document.querySelector("body").replaceWith(response.querySelector("body"));
					break;
				}*/
			}
			if (callback) callback();
		}		

		window.dispatchEvent(new CustomEvent("vvveb.loadUrl", {detail: {url, selector}}));
	}).catch(error => {
		console.log(error.statusText);
	});
}

var VvvebTheme = {};

VvvebTheme.ajax = {
	selector:"a",
	//selector:"a[data-url], a[data-page-url], a[data-v-url]",
	siteContainer:["body"],
	scrollContainer:"body",
	skipUrl:[]
}