const dragcontainer = document.getElementById("dragcontainer");
const actions = document.getElementById("actions");
const addBtn = document.getElementById("add-btn");
const edit = document.getElementById("edit");
const fieldTypes = document.querySelector(".field-types");


dragcontainer.addEventListener('dragstart', dragStart);
dragcontainer.addEventListener('dragend', dragEnd);
dragcontainer.addEventListener('dragover', dragOver);
dragcontainer.addEventListener('dragenter', dragEnter);
dragcontainer.addEventListener('dragleave', dragLeave);
dragcontainer.addEventListener('drop', drop);
dragcontainer.addEventListener('mouseover', over);
//dragcontainer.addEventListener('mouseout', out);
actions.addEventListener('click', actionsClick);
edit.addEventListener('click', editClick);
edit.addEventListener('change', editChange);
addBtn.addEventListener('click', addRow);
fieldTypes.addEventListener('click', addRow);

let dragged = null;
let highlighted = null;
let editElement = null;

function addRow(event) {
	let type = event.target.closest("a")?.dataset.type ?? "text";
	let template = document.getElementById("template").firstElementChild.cloneNode(true);
	console.log(type);
	template =template.outerHTML;
	let newId = Math.floor(Math.random() * 10000);
	template = template.replaceAll(name + '[0]', name + '[' + newId + ']').
						replaceAll(name + '[#]', name + '[' + newId + ']').
						replaceAll(name + '#', name + newId ).
						replaceAll("[" + name +"][#]", "[" + name +"][" + newId + "]").
						replace('d-none', '');
	
	template = generateElements(template)[0];

	dragcontainer.querySelector(".dragzone").append(template);

	if (type != "text") {
		editElement = template.querySelector(".col");
		highlighted = editElement;
		highlighted.querySelector("[data-v-field-type]").value = type;
		renderField(template);
	}
}

function addCol(event) {
	const template = document.getElementById("template").firstElementChild.cloneNode(true);
	dragcontainer.querySelector(".dragzone").append(template);
}


function buildParams( prefix, obj,  add ) {
	let rbracket = /\[\]$/;

	if ( Array.isArray( obj ) ) {

		// Serialize array item.
		for(const key in obj) {
			let v = obj[key];
			if ( rbracket.test( prefix ) ) {

				// Treat each array item as a scalar.
				add( prefix, v );

			} else {

				// Item is non-scalar (array or object), encode its numeric index.
				buildParams(
					prefix + "[" + ( typeof v === "object" && v != null ? key : "" ) + "]",
					v,
					add
				);
			}
		}

	} else if ( typeof obj === "object" ) {

		// Serialize object item.
		for (const name in obj ) {
			buildParams( prefix + "[" + name + "]", obj[ name ],  add );
		}

	} else {

		// Serialize scalar item.
		add( prefix, obj );
	}
}

// Serialize an array of form elements or a set of
// key/values into a query string
function nestedFormData( a ) {
	let prefix,
		s = [],
		add = function( key, valueOrFunction ) {

			// If value is a function, invoke it and use its return value
			let value = typeof valueOrFunction === "function" ?
				valueOrFunction() :
				valueOrFunction;

			s[ s.length ] = encodeURIComponent( key ) + "=" +
				encodeURIComponent( value == null ? "" : value );
		};

	if ( a == null ) {
		return "";
	}

	// If an array was passed in, assume that it is an array of form elements.
	if ( Array.isArray( a ) || ( Object.is( a ) ) ) {

		// Serialize the form elements
		for(const key in object) {
			let v = object[key];
		//jQuery.each( a, function() {
			add( key, v );
		};

	} else {

		// If traditional, encode the "old" way (the way 1.3.2 or older
		// did it), otherwise encode params recursively.
		for (const prefix in a ) {
			buildParams( prefix, a[ prefix ], add );
		}
	}

	// Return the resulting serialization
	return s.join( "&" );
};


function serialize(parentElement, prefix) {
	let data = {}
	parentElement.querySelectorAll("input[type=text],input[type=number],input[type=hidden],input[type=checkbox]:checked,input[type=radio]:checked,input[name=image],select:not(:disabled), textarea").forEach( (el, i) => {
		//if (el.offsetParent) 
		let name = el.name;//.replace('field[', '[field][');
		prefix = "";
		data[prefix + name] = el.value;
	});			
	
	return data;
}

function editChange(event) {
	let element = event.target;
	let name = element.name;
	let value = element.value;
	let fieldName = name.replace(/.+\[|\]/g,'');
	
	if (fieldName == "cols") {
		highlighted.setAttribute("class", "col " + value);
	}
	
	renderField(edit);
}

function renderField(editContainer) {
	let data = {};

	editContainer.querySelectorAll('.tab-pane').forEach((e) => {
		let name = e.getAttribute('aria-labelledby');
		if (name == 'conditions') return;
		data = {...data, ...serialize(e, name)};
	});
	
	data["field_id"] = highlighted.dataset.id;//edit.querySelector("[data-v-field-id]")?.value;
	data["type"]     = editContainer.querySelector('[data-v-field-type]')?.value;//edit.querySelector("[data-v-field-id]")?.value;
	data["csrf"]     = document.querySelector('[data-v-csrf]')?.value;//edit.querySelector("[data-v-field-id]")?.value;

	fetch(window.location.pathname + "?module=field/field-group&action=field", {
		method: "POST",  
		headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
		//body: new URLSearchParams(data)
		body: nestedFormData(data)
	})
	.then((response) => {
		if (!response.ok) { throw new Error(response) }
		return response.json()
	})
	.then((data) => {
		let focusName = document.activeElement?.name ?? "";
		editElement.querySelector(".input").innerHTML = data['field'];
		
		editContainer.querySelectorAll(".tab-pane")?.forEach(e => {
			let name = e.getAttribute('aria-labelledby');
			if (name && data[name]) {
				e.innerHTML = data[name];
			}
		});

		if (focusName) editContainer.querySelector("[name='" + focusName + "']")?.focus();
		
	})
	.catch(error => {
		console.log(error);
		displayToast("danger", "Error", "Error loading translations!");
	});			

/*
	if (element.name == "type") {
		template = document.getElementById(value + "-field").cloneNode(true);
		highlighted.querySelector(".input").replaceChildren(...template.children); 
	}*/
	
}

function editClick(event) {
	let element;
	
	if (element = event.target.closest(".btn-edit")) {
	}

	if (element = event.target.closest(".nav-item > .nav-link")) {
		let id = element.getAttribute("aria-controls");
		let tab = edit.querySelector('[aria-labelledby="' + id + '"]');
		console.log("[aria-labelledby=" + id + "]");
		element.closest(".nav-tabs")?.querySelectorAll(".nav-link")?.forEach(e => e.classList.remove("active"));
		element?.classList.add("active");
		tab?.parentNode.querySelectorAll(".tab-pane")?.forEach(e => e.classList.remove("active"));
		tab?.classList.add("active");
	}
}

function actionsClick(event) {
	let element;
	
	if (element = event.target.closest(".btn-edit")) {
		let editContainer = highlighted.querySelector(".edit");
		if (edit.classList.contains("show")) {
			element.querySelector("i").setAttribute("class", "la la-angle-down");
			edit.classList.remove("show");
			/*
			editContainer.replaceWith(edit.cloneNode(true));
			editContainer.removeAttribute("id");
			*/
			//editContainer.querySelectorAll(".tab-pane").forEach(e => editContainer.replaceChildren(...edit.children); 
			editContainer.replaceChildren(...edit.children); 

			editElement = null;
		} else {
			element.querySelector("i").setAttribute("class", "la la-angle-up");
			edit.classList.add("show")
			edit.replaceChildren(...editContainer.children); 
			/*
			edit.replaceWith(editContainer.cloneNode(true));
			edit.setAttribute("id", "edit");
			*/
			
			editElement = highlighted;
		}
		
		event.preventDefault();
	}

	if (element = event.target.closest(".btn-add")) {
		let template = document.getElementById("template").firstElementChild.cloneNode(true);
		if (highlighted.classList.contains("col")) {
			template = template.querySelector(".col");
			console.log("col");
		}
		highlighted.after(template);
	}

	if (element = event.target.closest(".btn-clone")) {
		if (highlighted.classList.contains("col")) {
			
		}
		
		let template = highlighted.cloneNode(true);
		highlighted.after(template);
	}

	if (element = event.target.closest(".btn-remove")) {
		if (confirm("Are you sure?")) {

			if (highlighted) {
				let form = document.getElementById('field-form');
				console.log(form);
				form.append(generateElements('<input type="hidden" name="delete[field_id][]" value="' + highlighted.dataset.id + '">')[0]);
			}

			highlighted.remove();
			highlighted = null;
			actions.style.display = "none";
		}
	}
}

function out(event) {
}

function over(event) {
	//if (event.target.parentNode == actions) return; 
	let classList = event.target.classList;
	//if (! (classList.contains("row") || classList.contains("col")) ) {
	if (! (classList.contains("col")) ) {
		return;
	} 
	
	if (edit.classList.contains("show")) {	
		return;
	}

	highlighted = event.target;
	const rect = highlighted.getBoundingClientRect();
	actions.style.opacity = "0";
	actions.style.top  = (rect.top + window.scrollY) + "px";
	actions.style.left = (rect.x + rect.width - actions.clientWidth + window.scrollX - 1 ) + "px";
	if (!edit.classList.contains("show")) {
		edit.style.top = (rect.bottom + window.scrollY) + "px";
	}

	if (rect.top < 80) {
		actions.style.display = "none";
		highlighted = null;
	} else {
		actions.style.display = "block";
		actions.style.opacity = "1";
	}
}

function dragStart(event) {
  event.target.classList.add("dragstart");
  dragged = event.target;
  actions.style.display = "none";
}

function dragEnd(event) {
  event.target.classList.remove("dragstart");
}

function dragEnter(event) {
  event.target.classList.add("drop");
}

function dragLeave(event) {
  event.target.classList.remove("drop");
}

function dragOver(event) {
  event.preventDefault();
}

function drop(event) {
  let container = event.target;	
  let element = event.currentTarget;	
  event.target.classList.remove("drop");
//console.log("drop", dragged, container, element);

  let parentRow = dragged.parentNode;

  if (dragged.classList.contains("row")) {//row
	if (container.classList.contains("container-fluid")) {//container
		container.appendChild(dragged); 
    } else if (container.classList.contains("row")) {//row
		container.after(dragged); 
	} else if (container.classList.contains("col")) {//col
		//if row dragged inside a col create a parent col and add after
		let col = generateElements('<div class="col" draggable="true"></div>')[0];
		col.append(dragged); 
		container.after(col); 
		//container.append(dragged); 
	}
  } else
  if (dragged.classList.contains("col")) {//col

	if (container.classList.contains("row")) {
		container.appendChild(dragged); 
    } else 	if (container.classList.contains("col")) {
		container.after(dragged); 
	} else if (container.classList.contains("container-fluid")) {//container
		//if col dragged outiside a row (container) create a parent row
		let row = generateElements('<div class="row" draggable="true"></div>')[0];
		row.append(dragged); 
		container.append(row); 
	}

  }

	//remove empty rows/cols
	if (!parentRow.childElementCount) {
		parentRow.remove();
	}

  //event.dataTransfer.clearData();
}

