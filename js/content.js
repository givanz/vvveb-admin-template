document.querySelectorAll('input.autocomplete').forEach(el => new _AutocompleteInput(el, el.dataset));
document.querySelectorAll('input.autocomplete-list').forEach(el => new _AutocompleteList(el, el.dataset));

document.querySelectorAll('.taxonomies input.tags-input').forEach(el => {
	/*
	let params = "";
	
	for (name in element.dataset) { 
		if (name) {
			params += name + "=" + element.dataset[name];
		}
	}*/
	new _TagsInput(el,{
		url: window.location.pathname + "?module=product/product&action=categoriesAutocomplete&type=tags&post_type=" + postType,
		parameters:el.dataset,
		listName:"tag",
		//listName:"tag[]",
		listId:el.dataset.taxonomy_id, //element.dataset.taxonomy_id,
		allowFreeText:true
	});
});

//intialize tinyMce if loaded, some plugins may remove tinymce to load a different editor
if (typeof tinyMceOptions  !== 'undefined') {
	window.dispatchEvent(new CustomEvent("tinymce.options", {detail: tinyMceOptions}));
	tinymce.init(tinyMceOptions);
}

var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
  return new bootstrap.Popover(popoverTriggerEl)
});	


document.querySelectorAll('#tab-general .tab-pane[data-v-language]').forEach(el => {
	let titleInput = el.querySelector('[data-v-' + contentType + '-content-name]');
	let slugInput = el.querySelector('[data-v-' + contentType + '-content-slug]');
	let urlInput = el.querySelector('[data-v-' + contentType + '-content-url]');
	let orig = slugify(titleInput.value);

	//change slug only if current value is the same as the text
	titleInput.addEventListener('keyup', function (e) {
		let text = this.value;
		delay(() => {
			let slug = slugInput.value;

			if ((orig == slug) || !slug) {
				slug = orig = slugify(text);
				const detail = {text, slug};
				const event = new CustomEvent("content.slug", {detail});
				document.dispatchEvent(event);
				({text, slug} = detail);
				slugInput.value = orig = slug;
			}			

			let url = urlInput.textContent.replace(/[^\/]+$/,'');
			if (!url) {
				url = "/";
			}
			
			url += slug;
			urlInput.textContent = url;
			urlInput.setAttribute("href", url);		
			
			if (titleElement) titleElement.innerHTML = text;
		}, 500);
	});
	
	slugInput.addEventListener('keyup', function (e) {
		let slug = this.value;
		let url = urlInput.textContent.replace(/[^\/]+$/,'');
		if (!url) {
			url = "/";
		}
		
		url += slug;
		urlInput.textContent = url;
		urlInput.setAttribute("href", url);		
	});
	
});


document.querySelector("[data-v-images]")?.addEventListener("click", function (e) {
	let element = e.target.closest(".btn-outline-danger");
	if (element) {
		let card = element.closest("[data-v-image]");
		card.remove();
	}
});	
	
document.getElementById("add-new-image")?.addEventListener("click", function (e) {
	let id = "gallery-image-" + document.querySelectorAll("[data-v-images] [data-v-image]").length + "-input";
	let newImage = generateElements(document.getElementById("add-new-image-template").innerHTML.replaceAll("gallery-image-0", "gallery-image-" + id).replace('disabled',''))[0];
	let newImageCard = document.querySelector(".add-new-image-card");
	console.log(newImage);
		
	newImageCard.parentNode.insertBefore(newImage, newImageCard);
	newImage.querySelector("img").click();
	
	e.preventDefault();
	return false;
});

//on form validation show tab with invalid element

document.addEventListener('invalid', function(e){
	//e.target.className += ' is-invalid';
	focusInvalidElement(e);
}, true);
	
function focusInvalidElement(e) {
	//if (Form.checkValidity() == false) {
		let form = e.target.closest("form");
		document.querySelectorAll(".is-invalid").forEach(e => e.classList.remove("is-invalid"));
		//get first invalid input
		let element        = form.querySelector(':invalid');
		let activeTab      = element.closest(".tab-pane");
		let activeCollapse = element.closest(".collapse:not(.show)");

		element.className += ' is-invalid';
		//activate tab panel
		document.querySelectorAll(".tab-pane").forEach(e => e.classList.remove("show", "active"));
		//activate tab 
		document.querySelectorAll(".nav-link").forEach(e => e.classList.remove("active"));
		
		while (activeTab) {
			activeTab.classList.add("show", "active");
			document.querySelector("a[href='#" + activeTab.getAttribute("id") + "']")?.classList.add("active");
			document.getElementById(activeTab.getAttribute("id"))?.classList.add("show","active");
			activeTab = activeTab.parentNode.closest(".tab-pane");
		}

		while (activeCollapse) {
			activeCollapse.classList.add("show");
			activeCollapse = activeCollapse.parentNode.closest(".collapse:not(.show)");
		}
		
		element.focus();
}

document.getElementById('tab-general')?.addEventListener('click', function (e) {
	let element = e.target.closest(".copy-btn");

	if (element) {
		let currentLangPane = e.target.closest("[data-v-language].tab-pane");
		let firstLangPane = document.querySelector("[data-v-language].tab-pane");

		let content = {};
		firstLangPane.querySelectorAll("input, textarea").forEach(el => {
			let name = el.name;
			let index = name.lastIndexOf("[");
			if (index) {
				name = name.substr(index + 1, name.length - index - 2);
			}
			if (name == 'language_id') return;
			if (el.tagName == "TEXTAREA" && el.id) {
				let tiny = tinymce.get(el.id);
				if (tiny) {
					content[name + "_mce"] = tiny.getContent();
				}
			}
			content[name] = el.value;
		});

		currentLangPane.querySelectorAll("input, textarea").forEach(el => {
			let name = el.name;
			let index = name.lastIndexOf("[");
			if (index) {
				name = name.substr(index + 1, name.length - index - 2);
			}
			if (name == 'language_id') return;
			if (el.tagName == "TEXTAREA" && el.id) {
				let tiny = tinymce.get(el.id);
				if (tiny) {
					tiny.setContent(content[name + "_mce"]);
				}
			}
			el.value = content[name];
		});
		
		e.preventDefault();
	}
});

//preview
let hasSmallNav = false;
let containerWidth = document.getElementById("container").clientWidth - 40;//subtract small nav
let main = document.querySelector(".main");
let preview = document.getElementById("preview");
let previewIframe = preview.querySelector("iframe");
let previewSeparator = document.getElementById("preview-separator");
let featuredImage = document.getElementById("featured-image-thumb");
let previewResponsive = document.querySelector(".preview-responsive");
let previewUrl = document.querySelector("[data-v-post-content-url], [data-v-product-content-url]").getAttribute("href");
let titleElement;
let contentElement;
let imageElement;

document.getElementById("btn-preview").addEventListener("change", function(e) {
	main.style.width    = "";
	preview.style.width = "";
	previewSeparator.style.left = "";
	let icon = this.labels.item(0);
	icon.classList.toggle("close");
	icon = icon.querySelector("i");
	previewResponsive.classList.toggle("d-none");

	if (document.getElementById("container").classList.contains("preview")) {
		document.getElementById("container").classList.remove("preview");
		if (!hasSmallNav) {
			document.getElementById("container").classList.remove("small-nav");
		}
		
		icon.setAttribute("class", "icon-eye-outline");
	} else {
		if (!previewIframe.src) previewIframe.src = previewUrl + "?r=true&preview=true";
		document.getElementById("container").classList.add("preview");
		hasSmallNav = document.getElementById("container").classList.contains("small-nav");
		document.getElementById("container").classList.add("small-nav");
		
		
		icon.setAttribute("class", "icon-close-outline");

	}
});

featuredImage.addEventListener('load', function(e) {
	if (imageElement) {
		let src = featuredImage.getAttribute("src");
		if (src.indexOf("placeholder.svg") > 0) {
			src = "";
		}
		imageElement.src = src;
	}
});

function previewViewport(btn) {
	preview.setAttribute("class", btn.dataset.view);
}

document.getElementById("zoom").addEventListener('change', function(e) {
	let scale = "";
	let height = "";
	if (this.value != "100") {
		scale = "scale(" + this.value + "%)";
		height = ((100 / this.value) * 100) + "%";
	}
	preview.style.transform = scale;
	preview.style.height = height;
});

previewIframe.addEventListener('load', function(e) {
	titleElement = previewIframe.contentDocument.querySelector("[data-v-component-post] [data-v-post-name], [data-v-component-product] [data-v-product-name]");
	contentElement = previewIframe.contentDocument.querySelector("[data-v-component-post] [data-v-post-content], [data-v-component-product] [data-v-product-content]");
	imageElement = previewIframe.contentDocument.querySelector("[data-v-component-post] [data-v-post-image], [data-v-component-product] [data-v-product-main-image]");
});

let isDown = false;
previewSeparator.addEventListener('mousedown', function(e) {
	if (e.which == 1) {//left click
		isDown = true;
		previewSeparator.classList.add("active");
	}
}, true);

document.addEventListener('mouseup', function() {
	isDown = false;
	previewSeparator.classList.remove("active");
}, true);

document.addEventListener('mousemove', function(e) {
	if (isDown) {
		previewSeparator.style.left = (e.clientX - 6) + "px";
		delay(function () {
			let width = (containerWidth - e.clientX);
			main.style.width = (e.clientX - 40) + "px"
			preview.style.width = (width + 40) + "px"
		}, 100);
	}
});
