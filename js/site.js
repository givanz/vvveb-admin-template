document.querySelectorAll("input[type=radio][name='settings[date_format]']")?.forEach(e => e.addEventListener("click", function () {
	let custom_date_format = document.getElementById("custom_date_format");
	if (custom_date_format && this.value != "custom") {
		custom_date_format.value = this.value;
		custom_date_format.dispatchEvent(new Event('input', {bubbles:true}));
	}
}));

document.querySelectorAll("input[type=radio][name='settings[time_format]']")?.forEach(e => e.addEventListener("click", function () {
	let custom_time_format = document.getElementById("custom_time_format");
	if (custom_time_format && this.value != "custom") {
		custom_time_format.value = this.value;
		custom_time_format.dispatchEvent(new Event('input', {bubbles:true}));
	}
}));

function fetchFormatPreview(action, format, targetSelector) {
	let searchParams = new URLSearchParams(window.location.search);
	searchParams.set('action', action);
	searchParams.set('format', format);

	let url = window.location.pathname + "?" + searchParams.toString();
	delay(() => {
		fetch(url)
			.then(response => {
				if (!response.ok) { throw new Error(response.statusText) }
				return response.text()
			})
			.then(data => {
				let target = document.querySelector(targetSelector);
				if (target) {
					target.innerHTML = data;
				}
			})
			.catch(error => {
				console.error(error);
			});
	}, 500);
}

document.getElementById("custom_time_format")?.addEventListener("input", function () {
	fetchFormatPreview('dateFormat', this.value, ".time-example");
});

document.getElementById("custom_date_format")?.addEventListener("input", function () {
	fetchFormatPreview('dateFormat', this.value, ".date-example");
});

document.getElementById("input-invoice-format")?.addEventListener("input", function () {
	fetchFormatPreview('invoiceFormat', this.value, "#invoice-format-preview");
});

document.getElementById("input-order-id-format")?.addEventListener("input", function () {
	fetchFormatPreview('orderIdFormat', this.value, "#order-id-format-preview");
});

function insertInvoiceFormat(inputName, variable) {
	let input = document.getElementById("input-" + inputName);
	if (input) {
		input.value = (input.value ? input.value + '-' : '') + variable;
		input.dispatchEvent(new Event('input', {bubbles:true}));
	}
	return false;
}

var siteName = document.getElementById("input-site-name");
var host     = document.getElementById("input-site-host");
var path     = document.getElementById("input-site-path");
var fullUrl  = document.querySelector("[data-v-site-full-url]");
var url      = fullUrl?.querySelector("span");

var hostTextOrig = host?.value || '';
var pathTextOrig = path?.value ?? '';

function nameToHost(name) {
	if (name.indexOf(".") > 0) {
		return "*." + name;
	} else {
		return (slugify(name) + "." + domain);
	}
}

var updateDomain = function() {
	let text = siteName?.value || '';
	delay(() => {
		let hostText = host?.value;
		let pathText = path?.value;
		let siteType = document.querySelector('[name="site-type"]:checked')?.value

		if (hostTextOrig == hostText || !hostText) {
			hostTextOrig = nameToHost(text);
			if (host) {
				host.value = hostTextOrig;
			}
		}

		if (pathTextOrig == pathText || !pathText) {
			pathTextOrig = slugify(text);
			if (path) {
				path.value = pathTextOrig;
			}
		}

		if (url) {
			if (siteType == "subdomain" || siteType == "both") {
				url.textContent = host?.value
			} else {
				url.textContent = domain
			}
			
			url.textContent +=  (subdir ? '/' + subdir : "") + (((siteType === "subfolder" || siteType === "both") && path?.value) ? '/' + path.value : "");
			if (fullUrl) {
				fullUrl.href = "//" + url.textContent;
			}
		}

		document.querySelectorAll(".domain")?.forEach(e => e.textContent = domain);
		if (host) {
			document.querySelectorAll(".subdomain")?.forEach(e => e.textContent = host.value);
		}
		if (path) {
			document.querySelectorAll(".subfolder")?.forEach(e => e.textContent = path.value);
		}
	}, 500);
}

siteName?.addEventListener('input', updateDomain);
host?.addEventListener('input', updateDomain);
path?.addEventListener('input', updateDomain);

document.getElementById("site-type")?.addEventListener("change", function (e) {
	let host     = document.getElementById('input-site-host');
	let path     = document.getElementById('input-site-path');
	let pathText = document.getElementById('input-site-path-text');

	switch (e.target.value) {
		case 'subfolder':
			host?.classList.add("d-none");
			path?.classList.remove("d-none");
			pathText?.classList.remove("d-none");

			if (!path?.value || path.value == '/') {
				pathTextOrig = slugify(siteName?.value || '');
			}
		break;
		case 'subdomain':
			host?.classList.remove("d-none");
			path?.classList.add("d-none");
			pathText?.classList.add("d-none");

			if (!host?.value || host.value == '*.*.*') {
				hostTextOrig = nameToHost(siteName?.value || '');
			}
		break;
		case 'both':
			host?.classList.remove("d-none");
			path?.classList.remove("d-none");
			pathText?.classList.remove("d-none");

			if (!path?.value || path.value == '/') {
				pathTextOrig = slugify(siteName?.value || '');
			}
		break;
	}
	
	updateDomain();
});

var siteType = 'subdomain';
if (path?.value) {
	siteType = 'subfolder';
	if (host?.value != '*.*.*') {
		siteType = 'both';
	}
}

document.querySelector('[name="site-type"][value="' + siteType + '"]')?.click();

var regions = [];

function addRegionsToSelect(regionSelect, data) {
	regionSelect.replaceChildren();
	for (const region of data) {
		regionSelect.append(new Option(region.name, region.region_id));
	}
}

document.getElementById("input-country")?.addEventListener("change", function () {
	let searchParams = new URLSearchParams(window.location.search);
	searchParams.set('action', 'regions');
	searchParams.set('country_id', this.value);

	fetch(window.location.pathname + "?" + searchParams.toString())
		.then(response => {
			if (!response.ok) { throw new Error(response.statusText) }
			return response.json();
		})
		.then(data => {
			addRegionsToSelect(document.getElementById("input-region"), data);
		})
		.catch(error => {
			console.error(error);
		});
});
