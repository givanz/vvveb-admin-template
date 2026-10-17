var container = document.getElementById("container");
var main = document.querySelector(".main");
var preview = document.getElementById("preview");
var previewIframe = preview?.querySelector("iframe");
var previewSeparator = document.getElementById("preview-separator");
var featuredImage = document.getElementById("featured-image-thumb");
var previewResponsive = document.querySelector(".preview-responsive");
var urlElement = document.querySelector("[data-v-post-content-url], [data-v-product-content-url]");
var titleElement;
var contentElement;
var imageElement;
var isDown = false;
var hasSmallNav = false;

function getContainerWidth() {
	return (container?.clientWidth || 0) - 40;//subtract small nav
}

document.getElementById("btn-preview")?.addEventListener("change", function() {
	main && (main.style.width = "");
	preview && (preview.style.width = "");
	previewSeparator && (previewSeparator.style.left = "");

	let icon = this.labels?.[0] || this.closest("label");
	icon?.classList.toggle("close");
	previewResponsive?.classList.toggle("d-none");

	if (container?.classList.contains("preview")) {
		container.classList.remove("preview");
		if (!hasSmallNav) {
			container.classList.remove("small-nav");
		}

		icon?.querySelector("i")?.setAttribute("class", "icon-eye-outline");
	} else {
		if (previewIframe && urlElement) {
			let url = urlElement.getAttribute("href") || "";
			if (!previewIframe.src && url) {
				previewIframe.src = url + (url.includes("?") ? "&" : "?") + "r=true&preview=true";
			}
		}

		container?.classList.add("preview");
		hasSmallNav = !!container?.classList.contains("small-nav");
		container?.classList.add("small-nav");

		icon?.querySelector("i")?.setAttribute("class", "icon-close-outline");
	}
});

featuredImage?.addEventListener("load", function() {
	if (imageElement) {
		let src = featuredImage.getAttribute("src") || "";
		if (src.indexOf("placeholder.svg") > 0) {
			src = "";
		}
		imageElement.src = src;
	}
});

function previewViewport(btn) {
	preview?.setAttribute("class", btn.dataset.view || "");
}

document.getElementById("zoom")?.addEventListener("change", function() {
	if (!preview) return;

	let scale = "";
	let height = "";
	let value = Number(this.value);
	if (value && value != 100) {
		scale = "scale(" + value + "%)";
		height = ((100 / value) * 100) + "%";
	}
	preview.style.transform = scale;
	preview.style.height = height;
});

previewIframe?.addEventListener("load", function() {
	let doc = previewIframe.contentDocument;
	if (!doc) return;

	titleElement = doc.querySelector("[data-v-component-post] [data-v-post-name], [data-v-component-product] [data-v-product-name]");
	contentElement = doc.querySelector("[data-v-component-post] [data-v-post-content], [data-v-component-product] [data-v-product-content]");
	imageElement = doc.querySelector("[data-v-component-post] [data-v-post-image], [data-v-component-product] [data-v-product-main-image]");

	let body = doc.querySelector("body");
	if (body) {
		body.style.pointerEvents = "none";
		body.style.userSelect = "none";
	}
});

previewSeparator?.addEventListener("mousedown", function(e) {
	if (e.which == 1) {//left click
		isDown = true;
		previewSeparator.classList.add("active");
	}
}, true);

document.addEventListener("mouseup", function() {
	isDown = false;
	previewSeparator?.classList.remove("active");
}, true);

document.addEventListener("mousemove", function(e) {
	if (isDown && previewSeparator) {
		previewSeparator.style.left = (e.clientX - 6) + "px";
		delay(function() {
			let containerWidth = getContainerWidth();
			let width = containerWidth - e.clientX;
			main && (main.style.width = (e.clientX - 40) + "px");
			preview && (preview.style.width = (width + 40) + "px");
		}, 100);
	}
});
