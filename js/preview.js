let hasSmallNav = false;
let containerWidth = document.getElementById("container").clientWidth - 40;//subtract small nav
let main = document.querySelector(".main");
let preview = document.getElementById("preview");
let previewIframe = preview?.querySelector("iframe");
let previewSeparator = document.getElementById("preview-separator");
let featuredImage = document.getElementById("featured-image-thumb");
let previewResponsive = document.querySelector(".preview-responsive");
let previewUrl = document.querySelector("[data-v-post-content-url], [data-v-product-content-url]")?.getAttribute("href");
let titleElement;
let contentElement;
let imageElement;

document.getElementById("btn-preview")?.addEventListener("change", function(e) {
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

featuredImage?.addEventListener('load', function(e) {
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

document.getElementById("zoom")?.addEventListener('change', function(e) {
	let scale = "";
	let height = "";
	if (this.value != "100") {
		scale = "scale(" + this.value + "%)";
		height = ((100 / this.value) * 100) + "%";
	}
	preview.style.transform = scale;
	preview.style.height = height;
});

previewIframe?.addEventListener('load', function(e) {
	titleElement = previewIframe.contentDocument.querySelector("[data-v-component-post] [data-v-post-name], [data-v-component-product] [data-v-product-name]");
	contentElement = previewIframe.contentDocument.querySelector("[data-v-component-post] [data-v-post-content], [data-v-component-product] [data-v-product-content]");
	imageElement = previewIframe.contentDocument.querySelector("[data-v-component-post] [data-v-post-image], [data-v-component-product] [data-v-product-main-image]");
});

let isDown = false;
previewSeparator?.addEventListener('mousedown', function(e) {
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
