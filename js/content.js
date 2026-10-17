document.querySelectorAll('input.autocomplete').forEach(el => new _AutocompleteInput(el, el.dataset));
document.querySelectorAll('input.autocomplete-list').forEach(el => new _AutocompleteList(el, el.dataset));

document.querySelectorAll('.taxonomies input.tags-input').forEach(el => {
	new _TagsInput(el,{
		url: window.location.pathname + "?module=product/product&action=categoriesAutocomplete&type=tags&post_type=" + (window.postType ?? ''),
		parameters:el.dataset,
		listName:"tag",
		listId:el.dataset.taxonomy_id,
		allowFreeText:true
	});
});

//intialize tinyMce if loaded, some plugins may remove tinymce to load a different editor
if (typeof tinyMceOptions !== 'undefined' && typeof tinymce !== 'undefined') {
	window.dispatchEvent(new CustomEvent("tinymce.options", {detail: tinyMceOptions}));
	tinymce.init(tinyMceOptions);
}

if (window.bootstrap) {
	var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
	var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
	  return new bootstrap.Popover(popoverTriggerEl)
	});
}


document.querySelectorAll('#tab-general .tab-pane[data-v-language]').forEach(el => {
	let titleInput = el.querySelector('[data-v-' + contentType + '-content-name]');
	let slugInput = el.querySelector('[data-v-' + contentType + '-content-slug]');
	let urlInput = el.querySelector('[data-v-' + contentType + '-content-url]');
	if (!titleInput || !slugInput || !urlInput) return;
	let orig = slugify(titleInput.value);

	//change slug only if current value is the same as the text
	titleInput.addEventListener('input', function (e) {
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
			
			if (window.titleElement) window.titleElement.textContent = text;
		}, 500);
	});
	
	slugInput.addEventListener('input', function (e) {
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
		card?.remove();
	}
});	

document.getElementById("add-new-image")?.addEventListener("click", function (e) {
	let template = document.getElementById("add-new-image-template");
	let newImageCard = document.querySelector(".add-new-image-card");
	if (!template || !newImageCard) return;
	let count = document.querySelectorAll("[data-v-images] [data-v-image]").length;
	let newId = "gallery-image-" + count;
	let newImage = generateElements(template.innerHTML.replaceAll("gallery-image-0", newId).replace('disabled',''))?.[0];
	if (!newImage) return;
		
	newImageCard.parentNode.insertBefore(newImage, newImageCard);
	newImage.querySelector("img")?.click();
	
	e.preventDefault();
	return false;
});

//on form validation show tab with invalid element

document.addEventListener('invalid', function(e){
	//e.target.className += ' is-invalid';
	focusInvalidElement(e);
}, true);
	
function focusInvalidElement(e) {
		let form = e.target.closest("form");
		if (!form) return;
		document.querySelectorAll(".is-invalid").forEach(el => el.classList.remove("is-invalid"));
		//get first invalid input
		let element        = form.querySelector(':invalid');
		if (!element) return;
		let activeTab      = element.closest(".tab-pane");
		let activeCollapse = element.closest(".collapse:not(.show)");

		element.classList.add('is-invalid');
		//activate tab panel
		document.querySelectorAll(".tab-pane").forEach(el => el.classList.remove("show", "active"));
		//activate tab 
		document.querySelectorAll(".nav-link").forEach(el => el.classList.remove("active"));
		
		while (activeTab) {
			activeTab.classList.add("show", "active");
			document.querySelector("a[href='#" + activeTab.getAttribute("id") + "']")?.classList.add("active");
			document.getElementById(activeTab.getAttribute("id"))?.classList.add("show","active");
			activeTab = activeTab.parentNode?.closest(".tab-pane");
		}

		while (activeCollapse) {
			activeCollapse.classList.add("show");
			activeCollapse = activeCollapse.parentNode?.closest(".collapse:not(.show)");
		}
		
		element.focus();
}

document.getElementById('tab-general')?.addEventListener('click', function (e) {
	let element = e.target.closest(".copy-btn");

	if (element) {
		let currentLangPane = e.target.closest("[data-v-language].tab-pane");
		let firstLangPane = document.querySelector("[data-v-language].tab-pane");
		if (!currentLangPane || !firstLangPane) return;

		let content = {};
		firstLangPane.querySelectorAll("input, textarea").forEach(el => {
			let name = el.name;
			let index = name.lastIndexOf("[");
			if (index > -1) {
				name = name.substr(index + 1, name.length - index - 2);
			}
			if (!name || name == 'language_id') return;
			if (el.tagName == "TEXTAREA" && el.id && typeof tinymce !== 'undefined') {
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
			if (index > -1) {
				name = name.substr(index + 1, name.length - index - 2);
			}
			if (!name || name == 'language_id') return;
			if (el.tagName == "TEXTAREA" && el.id && typeof tinymce !== 'undefined') {
				let tiny = tinymce.get(el.id);
				if (tiny && content[name + "_mce"] !== undefined) {
					tiny.setContent(content[name + "_mce"]);
				}
			}
			if (content[name] !== undefined) {
				el.value = content[name];
			}
		});
		
		e.preventDefault();
	}
});