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
