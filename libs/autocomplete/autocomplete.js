/**
*    Json key/value autocomplete
*    Provides a transparent way to have key/value autocomplete
*    Copyright (C) 2008 Ziadin Givan
*
*    This program is free software: you can redistribute it and/or modify
*    it under the terms of the GNU Lesser General Public License as published by
*    the Free Software Foundation, either version 3 of the License, or
*    (at your option) any later version.
*
*    This program is distributed in the hope that it will be useful,
*    but WITHOUT ANY WARRANTY; without even the implied warranty of
*    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*    GNU General Public License for more details.
*
*    You should have received a copy of the GNU Lesser General Public License
*    along with this program.  If not, see http://www.gnu.org/licenses/
*
*    Usage:
*        new _AutocompleteInput(el, el.dataset);                          // single value input
*        new _AutocompleteInput(el, {url, onSelect});                     // single value with callback
*        new _AutocompleteList(el, el.dataset);                           // multiple values list
*        new _TagsInput(el, el.dataset);                                  // tags input
*
*    minChars = Minimum characters the input must have for the ajax request to be made
*    timeout  = Number of miliseconds passed after user entered text to make the ajax request
*    validSelection = If set to true then will invalidate (set to empty) the value field if the text is not selected (or modified) from the list of items.
*    parameters = Custom parameters to be passed
*    after, before = a function that will be called before/after the ajax request
*/

function autocompleteEscapeHtml(str) {
	return String(str ?? '').replace(/[&<>"']/g, m => ({
		'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
	})[m]);
}

// Strip executable content from server-provided HTML (thumbnails are rendered
// via innerHTML, and names come from user content): whole script/iframe/etc
// elements, on* event handlers and javascript: URLs.
function autocompleteSanitizeHtml(html) {
	return String(html ?? '')
		.replace(/<\s*\/?\s*(script|iframe|object|embed|svg|math|link|meta|style|form|input|button|textarea|select|base)[^>]*>/gi, '')
		.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
		.replace(/\s+(?:href|src)\s*=\s*(?:"\s*javascript:[^"]*"|'\s*javascript:[^']*'|javascript:[^\s>]+)/gi, '');
}

function _AutocompleteInput(el, params) {
	let textInput = el;
	let name = textInput.getAttribute("name");
	let text = textInput.dataset.text;
	let textName = name;
	let index = 0;
	
	//check if name is array[name]
	if ((index = textName.lastIndexOf(']')) > 0) {
		textName = textName.substring(0, index) + "_text" + textName.substring(index);
	} else {
		textName += "_text";
	}
	
	textInput.setAttribute("name", textName);
	
	//create a new hidden input that will be used for holding the return value when posting the form, then swap names with the original input
	let hiddenInput = generateElements('<input type=hidden name="' + name + '"/>')[0];
	hiddenInput.value = textInput.value;
	textInput.after(hiddenInput);

	if (text) {
		textInput.value = text;
	}
	
	let valueInput = el.nextElementSibling;
	//create the ul that will hold the text and values
	valueInput.before(generateElements('<ul class="autocomplete"></ul>')[0]);
	let list = valueInput.previousElementSibling;
	list.after(generateElements('<button class="btn-close"></button>')[0]);
	let btnClose = list.nextElementSibling;

	let oldText = '';
	let typingTimeout;
	let size = 0;
	let selected = -1;

	
	let settings = { ...{//provide default settings
		minChars : 1,
		timeout: 1000,
		after : null,
		before : null,
		onSelect : null,
		validSelection : true,
		allowFreeText : false,
		searchOnFocus : true,
		useKeyAsValue : false,
		url : el.dataset.url,
		listName : el.dataset.listName ?? "list",
		parameters : {'inputName' : valueInput.getAttribute('name'), 'inputId' : textInput.getAttribute('id')}
	}, ...params};


	function selectOption(value, text) {
		valueInput.value = value; 
		textInput.value = text; 

		const e = new CustomEvent("autocomplete.change", {bubbles: true, detail: { value, text, name, listName: settings.listName } });
		textInput.dispatchEvent(e);				

		if (typeof settings.onSelect == "function")  {
				settings.onSelect(value, text, name, settings.listName);
		}			
		clear(); 
	}

	list.addEventListener("click", function (e) {
		let item = e.target.closest("li"); 
		if (item) {
			const value = item.getAttribute('value'); 
			const text = item.textContent;
			if (settings.useKeyAsValue) {
				selectOption(value, value);
			} else {
				selectOption(value, text);
			}
		}
	});	

	function getData(text){
		window.clearTimeout(typingTimeout);
		if (text != oldText && (settings.minChars != null && text.length >= settings.minChars)) {
			clear();
			if (typeof settings.before == "function")  {
				settings.before(textInput,text);
			}

			textInput.classList.add('autocomplete-loading');
			settings.parameters.text = text.trim();
			
			
			let results = (data) => {
				let items = '';
				if (data) {
					size = 0;

					  for ( let key in data ) {//get key => value
							const html = autocompleteSanitizeHtml(data[key]);
							const txt = generateElements("<span>" + html + "</span>")[0].textContent;
							const replace = txt.replace(text, "<strong>" + autocompleteEscapeHtml(text) + "</strong>");
							const value = html.replace(txt, replace);
							
							items += '<li value="' + autocompleteEscapeHtml(key) + '">' + value + '</li>';
							size++;
					  }

					list.style.width = (Math.max(100, textInput.clientWidth)) + "px";
					list.innerHTML = items;
					//on mouse hover over elements set selected class and on click set the selected value and close list
					list.style.display = "block";

					if (typeof settings.after == "function")  {
						settings.after(textInput,text);
					}
					textInput.classList.add('autocomplete-open');
				}
				textInput.classList.remove('autocomplete-loading');
			};
			
			if (settings.url) {
				const separator = settings.url.includes("?") ? "&" : "?";
				fetch(settings.url + separator + new URLSearchParams(settings.parameters))
				.then((response) => {
					if (!response.ok) { throw response; }
					return response.json();
				})
				.then(results)
				.catch(error => {
					console.error(error.statusText || error);
					textInput.classList.remove('autocomplete-loading');
					clear();
				});			
			}
			
			if (settings.data) {
				results(settings.data.filter((search) => search.indexOf(text) !== -1));
			}
			
			oldText = text;
		}
	}
	
	function clear() {
		textInput.classList.remove('autocomplete-open');
		textInput.classList.remove('autocomplete-loading');
		list.style.display = "none";
		size = 0;
		selected = -1;
	}	
	
	btnClose.addEventListener("click", function (e) {
		clear();
		e.preventDefault();
		return false;
	});

	if (settings.searchOnFocus) {
		textInput.addEventListener("focusin", function() {
			getData(textInput.value);
		});	
	}
	
	textInput.addEventListener("focusout", function() {
		//if no valid selection empty input
		setTimeout(() => {
			if (!hiddenInput.value && !settings.allowFreeText) {
				textInput.value = "";
			}
			clear();
		}, 500);
	});	
	
	textInput.addEventListener("keydown", function(e) {
		window.clearTimeout(typingTimeout);

		if (e.key == "Escape") {//escape
			clear();
		} else if (e.key == "Delete" || e.key == "Backspace") {//delete and backspace
			clear();
			//invalidate previous selection
			if (settings.validSelection) valueInput.value = "";
		}
		else if (e.key == "Enter") {//enter 
			if ( list.style.display == "none") {//if the list is not visible then make a new request, otherwise hide the list
				getData(textInput.value);
			} else {
				clear();
			}
			
			if (settings.allowFreeText) {
				selectOption(textInput.value, textInput.value);
				clear();
			} else {
				const selectedItem = list.querySelector("li.selected");
				if (selectedItem) {
					if (settings.useKeyAsValue) {
						selectOption(selectedItem.getAttribute('value'), selectedItem.getAttribute('value'));
					} else {
						selectOption(selectedItem.getAttribute('value'), selectedItem.textContent);
					}
					clear();
				}
			}
			e.preventDefault();
			return false;
		}
		else if (e.key == "ArrowDown" || e.key == "ArrowUp" || e.key == "Tab") {//move up, down 

		  switch(e.key) 
		  {
			case "ArrowDown": //down
			case "Tab":
			  selected = (selected >= size - 1) ? 0 : selected + 1; break;
			case "ArrowUp"://up
			  selected = (selected < 0) ? size -1 : selected - 1; break;
			default: break;
		  }
		  //set selected item and input values
		  list.querySelectorAll("li").forEach((e, i) => {
			  if (i == selected) {
				  e.classList.add("selected");
			  } else {
				  e.classList.remove("selected");
			  }
		  });
		} else  { 
			//invalidate previous selection
			if (settings.validSelection) valueInput.value = '';
			typingTimeout = window.setTimeout(function() { getData(textInput.value) }, settings.timeout);
		}
	});
	
	return textInput;
}
	
function _AutocompleteList(el, options) {
	
		let autocomplete = _AutocompleteInput(el, options);
		let settings = { ...{//provide default settings
			listName : el.dataset.listName ?? "list",
		}, ...options};

		//look ahead if autocomplete-list element is already in the page and reuse
		//useful to populate the autocomplete list from db
		let list;
		let sibling = autocomplete;
		while (sibling = sibling.nextElementSibling) {
			if (sibling.classList.contains("autocomplete-list")) {
				if (sibling.tagName != "input") {
					list = sibling;
				}
				break;
			}
		}

		if (!list) {
			list = generateElements('<div class="autocomplete-list card border-top-0"></div>')[0];
		}
		
		//the hidden input is the last sibling _AutocompleteInput created (text, ul, btn-close, hidden)
		let autocomplete_hidden = autocomplete;
		while ((autocomplete_hidden = autocomplete_hidden.nextElementSibling) && !autocomplete_hidden.matches('input[type="hidden"]')) {}
		let name = autocomplete_hidden ? autocomplete_hidden.getAttribute("name") : "list";
		
		autocomplete_hidden.after(list);
		let autocomplete_list_hidden = generateElements('<input type=hidden name="' + name + '_list"  value="' + autocompleteEscapeHtml(autocomplete_hidden.value) + '"/>')[0];
		
		list.after(autocomplete_list_hidden);//add hidden list value input after the list

		function addItem(value, text) {
			
			list.append(generateElements('<div>\
				<span>' + autocompleteEscapeHtml(text) + '</span>\
				<button type="button" class="btn-close remove-btn" aria-label="Remove"></button>\
				<input name="' + autocompleteEscapeHtml(settings.listName) + '[' + autocompleteEscapeHtml(value) + ']" value="' + autocompleteEscapeHtml(value) + '" type="hidden">\
			 </div>')[0]);
			 autocomplete.value = "";
		};
	
		function setList() {
			const values = {};
			list.querySelectorAll('div > input[type="hidden"]').forEach(el => {
				values[el.value] = el.parentNode.querySelector("span").textContent;
			});

			autocomplete_list_hidden.value = JSON.stringify(values);
			
			return values;
		};

		
		function setValue(value) { 
			if (value === "" || value == null) return false;
			let values = [];

			if (typeof value == "string") {
				values = JSON.parse(value);
			} else {
				values = value;
			}
			
			for (const key in values) {
				addItem(key, values[key]);
			}
			
			setList();
		};

		autocomplete.addEventListener("autocomplete.change", function (event) {
				autocomplete.addItem(event.detail.value, event.detail.text);
				const values = autocomplete.setList();
				const e = new CustomEvent('autocompletelist.change', {bubbles: true, detail: [ JSON.stringify(values) ] });
				event.currentTarget.dispatchEvent(e);				
		  }
		);		

		list.addEventListener("click", function (event)  {
			const item = event.target.closest(".remove-btn"); 
			if (item) {
				item.parentNode.remove();
				const values = setList();
				const e = new CustomEvent('autocompletelist.change', {bubbles: true, detail: [ values ] });
				autocomplete.dispatchEvent(e);				
				event.preventDefault();
				return false;
			}
		});		 

		autocomplete.setValue = setValue;
		autocomplete.addItem = addItem;
		autocomplete.setList = setList;

		el.autocompleteList = autocomplete;
		
		return autocomplete;
}

 function _TagsInput(el, options)  {
		let autocomplete = _AutocompleteInput(el, options);

		let settings = { ...{//provide default settings
			listName : el.dataset.listName ?? "list",
			listId : el.dataset.listId ?? '',
		}, ...options};

		let list = autocomplete.parentNode;
		
		//the hidden input is the last sibling _AutocompleteInput created (text, ul, btn-close, hidden)
		let autocomplete_hidden = autocomplete;
		while ((autocomplete_hidden = autocomplete_hidden.nextElementSibling) && !autocomplete_hidden.matches('input[type="hidden"]')) {}
		let name = autocomplete_hidden ? autocomplete_hidden.getAttribute("name") : "list";
		
		let autocomplete_list_hidden = generateElements('<input type=hidden name="' + name + '_list" value="' + autocompleteEscapeHtml(autocomplete_hidden.value) + '"/>')[0];
		
		list.appendChild(autocomplete_list_hidden);

		function addItem(value, text) {
			let inputName = '';
			//if name is array set value otherwise set value as array key
			if (settings.listName.lastIndexOf('[') > 0) {
				inputName = settings.listName + '[' + value + ']';
			} else {
				inputName = settings.listName + '[' + settings.listId + '][' + value + ']';
			}
			let attributes = 'name="' + autocompleteEscapeHtml(inputName) + '" value="' + autocompleteEscapeHtml(text) + '"';
			
			autocomplete.before(generateElements('<div class="tag"><span>' + autocompleteEscapeHtml(text) + `</span>
				<a href="#" class="remove-btn">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M18 6l-12 12" />
						<path d="M6 6l12 12" />
					</svg>
				</a>
				<input ${attributes} type="hidden">
			 </div>`)[0]);
			 autocomplete.value = "";
		};
	
		function setList() {
			
			const values = {};
			list.querySelectorAll('.tag input[type="hidden"]').forEach(el => {
				values[el.value] = el.parentNode.querySelector("span").textContent;
			});

			autocomplete_list_hidden.value = JSON.stringify(values);
			return values;
		};

		
		function setValue(value) { 
			if (value === "" || value == null) return false;
			let values = [];

			if (typeof value == "string") {
				values = JSON.parse(value);
			} else {
				values = value;
			}
			
			for (const key in values) {
				addItem(key, values[key]);
			}
			
			setList();
		};

		autocomplete.addEventListener("autocomplete.change", function(event) { 
				addItem(event.detail.value, event.detail.text);
				const values = autocomplete.setList();
				const e = new CustomEvent("tagsinput.change", {bubbles: true, detail: [ values ] });
				autocomplete.dispatchEvent(e);				
		 });

		list.addEventListener("click", function (event)  {
			const item = event.target.closest(".remove-btn"); 
			if (item) {
				item.parentNode.remove();

				const values = setList();
				const e = new CustomEvent('tagsinput.change', {bubbles: true, detail: [ values ] });
				autocomplete.dispatchEvent(e);				
				
				event.preventDefault();
				return false;
			}
		});		 

		autocomplete.setValue = setValue;
		autocomplete.addItem = addItem;
		autocomplete.setList = setList;

		el.tagsInput = autocomplete;
		
		return autocomplete;
}
