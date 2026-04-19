document.querySelectorAll("input[type=radio][name='settings[date_format]']")?.forEach(e => e.addEventListener("click", function (e) {
	let custom_date_format = document.getElementById("custom_date_format");
	custom_date_format.value = this.value
	custom_date_format.dispatchEvent(new KeyboardEvent('change', {bubbles:true}));
}));

document.querySelectorAll("input[type=radio][name='settings[time_format]']")?.forEach(e => e.addEventListener("click", function (e) {
	let custom_time_format = document.getElementById("custom_time_format");
	custom_time_format.value = this.value
	custom_time_format.dispatchEvent(new KeyboardEvent('change', {bubbles:true}));//new Event("input", { bubbles: true});
}));

document.getElementById("custom_time_format")?.addEventListener("keypress", function (e) {
	let url = window.location.pathname + "?" + (new URL(document.location.toString()).searchParams) + "&action=dateFormat&format=" + encodeURI(this.value);
	delay(() =>	{
			fetch(url)
			 .then(response => {
				if (!response.ok) { throw new Error(response) }
				return response.text()
			 })
			.then(data => {
				document.querySelector(".time-example").innerHTML = data;
			})
			.catch(error => {
				console.log(error.statusText);
			});		
	}, 500);	
});

document.getElementById("custom_date_format")?.addEventListener("keypress", function (e) {
	let url = window.location.pathname + "?" + (new URL(document.location.toString()).searchParams) + "&action=dateFormat&format=" + encodeURI(this.value);
	delay(() =>	{
			fetch(url)
			 .then(response => {
				if (!response.ok) { throw new Error(response) }
				return response.text()
			 })
			.then(data => {
				document.querySelector(".date-example").innerHTML = data;
			})
			.catch(error => {
				console.log(error.statusText);
			});		
	}, 500);	
});

document.getElementById("input-invoice-format")?.addEventListener("change", function (e) {
	let url = window.location.pathname + "?" + (new URL(document.location.toString()).searchParams) + "&action=invoiceFormat&format=" + encodeURI(this.value);
	delay(() =>	{
			fetch(url)
			 .then(response => {
				if (!response.ok) { throw new Error(response) }
				return response.text()
			 })
			.then(data => {
				document.getElementById("invoice-format-preview").innerHTML = data;
			})
			.catch(error => {
				console.log(error.statusText);
			});		
	}, 500);	
});

document.getElementById("input-order-id-format")?.addEventListener("change", function (e) {
	let url = window.location.pathname + "?" + (new URL(document.location.toString()).searchParams) + "&action=orderIdFormat&format=" + encodeURI(this.value);
	delay(() =>	{
			fetch(url)
			 .then(response => {
				if (!response.ok) { throw new Error(response) }
				return response.text()
			 })
			.then(data => {
				document.getElementById("order-id-format-preview").innerHTML = data;
			})
			.catch(error => {
				console.log(error.statusText);
			});		
	}, 500);	
});

function insertInvoiceFormat(inputName, variable) {
	let input = document.getElementById("input-" + inputName);
	input.value = input.value + '-' + variable;
	input.dispatchEvent(new Event('change', {bubbles:true}));
	return false;
}



let name    = document.getElementById("input-site-name");
//let key = document.getElementById("input-site-key");
let host    = document.getElementById("input-site-host");
let path    = document.getElementById("input-site-path");
let fullUrl = document.querySelector("[data-v-site-full-url]");
let url     = fullUrl.querySelector("span");

//let keyTextOrig = nameToKey(key.value);
let hostTextOrig = host.value || nameToHost(host.value.replace(domain, ''));
let pathTextOrig = path.value ?? '';

function nameToKey(name) {
	//return (slugify(name) + " " + domain).replaceAll("."," "); 
	return (slugify(name) + " *").replaceAll("."," "); 
}

function nameToHost(name) {
	if (name.indexOf(".") > 0) {
		return "*." + name;
	} else {
		return (slugify(name) + "." + domain); 
	}
}

let updateDomain = function(e) {
	let text = name.value;
	delay(() => {
		let hostText = host.value;
		let pathText = path.value;

		if ((hostTextOrig == hostText) || !hostText) {
			hostTextOrig = nameToHost(text);
			host.value   = hostTextOrig;
		}		
		
		if ((pathTextOrig == pathText) || !pathText) {
			pathTextOrig = slugify(text);
			path.value  = pathTextOrig;
		}
		
		url.textContent = host.value + (subdir ? '/' + subdir : "") + (path.value ? '/' + path.value : "");
		fullUrl.href    = "//" + url.textContent;
		
		document.querySelectorAll(".domain")?.forEach(e => e.innerHTML = domain);
		document.querySelectorAll(".subdomain")?.forEach(e => e.innerHTML = host.value);
		document.querySelectorAll(".subfolder")?.forEach(e => e.innerHTML = path.value);
		
	}, 500);
}

name.addEventListener('keyup', updateDomain);
host.addEventListener('keyup', updateDomain);
path.addEventListener('keyup', updateDomain);
	
document.getElementById("site-type")?.addEventListener("change", function (e) {
	let host     = document.getElementById('input-site-host');
	let path     = document.getElementById('input-site-path');
	let pathText = document.getElementById('input-site-path-text');

	switch (e.target.value) {
		case 'subfolder':
			host.classList.add("d-none");
			path.classList.remove("d-none");
			pathText.classList.remove("d-none");

			if (!path.value || path.value == '/') {
				pathTextOrig = slugify(name.value);
				updateDomain();
			}
		break;		
		case 'subdomain':
			host.classList.remove("d-none");
			path.classList.add("d-none");
			pathText.classList.add("d-none");

			if (!host.value || host.value == '*.*.*') {
				hostTextOrig = nameToHost(name.value);
				updateDomain();
			}
		break;
		case 'both':
			host.classList.remove("d-none");
			path.classList.remove("d-none");
			pathText.classList.remove("d-none");

			if (!path.value || path.value == '/') {
				pathTextOrig = slugify(name.value);
				updateDomain();
			}
		break;
	}
});	

let siteType = 'subdomain';
if (path.value) {
	siteType = 'subfolder';
	if (host.value != '*.*.*') {
		siteType = 'both';
	}
} 	

document.querySelector('[name="site-type"][value="' + siteType + '"]')?.click();
	
let regions = [];

function addRegionsToSelect(regionSelect, data) {
	regionSelect.replaceChildren();
	for (i in data) {
		let region = data[i];
		regionSelect.append(new Option(region.name, region.region_id));
	}
}

document.getElementById("input-country")?.addEventListener("change", function (e) {
	fetch(window.location.pathname + "?" + (new URL(document.location.toString()).searchParams) + "&action=regions&country_id=" + this.value)
	 .then(response => {
		if (!response.ok) { throw new Error(response) }
		return response.json();
	 })
	.then(data => {
		addRegionsToSelect(document.getElementById("input-region"), data);
	})
	.catch(error => {
		console.log(error.statusText);
	});	
});
