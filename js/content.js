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
		url: "/admin/?module=product/product&action=categoriesAutocomplete&type=tags&post_type=" + postType,
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
			if (orig == slug || !slug) {
				orig = slugify(text);
				slugInput.value = slug = orig;
			}			

			let url = urlInput.textContent.replace(/[^\/]+$/,'') + slug
			urlInput.textContent = url;
			urlInput.setAttribute("href", url);		
		}, 500);
	});
	
	slugInput.addEventListener('keyup', function (e) {
		let slug = this.value;
		urlInput.textContent = "/" + slug;
		urlInput.setAttribute("href", "/" + slug);
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
	console.log(e);
	focusInvalidElement(e);
}, true);
	
function focusInvalidElement(e) {
	//if (Form.checkValidity() == false) {
		let form = e.target.closest("form");
		document.querySelectorAll(".is-invalid").forEach(e => e.classList.remove("is-invalid"));
		//get first invalid input
		let element = form.querySelector(':invalid');
		let activeTab = element.closest(".tab-pane");
		
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
		
		element.focus();
}