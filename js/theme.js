var Vvveb = {};

window.delay = (function(){
  var timer = 0;
  return function(callback, ms){
    clearTimeout (timer);
    timer = setTimeout(callback, ms);
  };
})();

//Paints the theme switch icon for the given theme
//by swapping the svg sprite reference between #sun and #moon.
function paintThemeIcon(theme) {
	let button = document.querySelector("#color-theme-switch");
	if (!button || typeof button.querySelector !== "function") return;
	let use = button.querySelector("use");
	if (!use || typeof use.getAttribute !== "function") return;
	let href = use.getAttribute("href") || "";
	use.setAttribute("href", href.split("#")[0] + (theme == "dark" ? "#moon" : "#sun"));
}

//let theme = localStorage.getItem("theme", "dark");
var theme = document.documentElement.dataset.bsTheme;
if (theme) {
	paintThemeIcon(theme);
}

//let smallNav = localStorage.getItem("sidebar-size", "small-nav");
var smallNav = document.cookie.indexOf("sidebar-size=small-nav") > -1;
if (smallNav) {
	document.getElementById("container").classList.add(smallNav);
}

var aiAssistant = document.cookie.indexOf("ai-assistant=true") > -1;
if (aiAssistant) {
	document.getElementById("container").classList.add("ai-assistant");
}

function setCookie(name, value) {
	//try to set cookie to all subdomains
	document.cookie = name + "=" + value + ";path=/;domain=." + window.location.host.replace(/^.*?\./, '') + ";";
	document.cookie = name + "=" + value + ";";
}

var onReady = function() {
	const bindOnce = (el, type, fn) => {
		if (!el || el.dataset.vvvebBound) return;
		el.dataset.vvvebBound = "1";
		el.addEventListener(type, fn);
	};

	 bindOnce(document.querySelector(".menu-toggle"), "click", function(event) {  
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

	bindOnce(document.querySelector("#ai-btn"), "click", function(event) {  
		let container = document.getElementById("container");
		if (container.classList.contains("ai-assistant")) {
			container.classList.remove("ai-assistant");
			aiAssistant = "";
		} else {
			aiAssistant = "true"
			container.classList.add("ai-assistant");
		}
		
		//localStorage.setItem('sidebar-size', smallNav);
		setCookie('ai-assistant', aiAssistant);
	});

	let themeButton = document.querySelector("#color-theme-switch");
	bindOnce(themeButton, "click", function (event) {
		
		let theme = document.documentElement.dataset.bsTheme;
		
		if (theme == "dark") {
			theme = "light";
		} else if (theme == "light" || theme == "auto" || !theme) {
			theme = "dark";
		} else {
			theme = "auto";
		}
		
		document.documentElement.dataset.bsTheme = theme;
		paintThemeIcon(theme);
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
	siteContainer:["main"],
	scrollContainer:"body",
	skipUrl:[]
}
