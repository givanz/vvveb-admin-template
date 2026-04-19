let fields = [];

function addFieldsToSelect(fieldSelect, data, field_id = 0) {
	fieldSelect.html('<option value="0">All Fields</option>');
	for (i in data) {
		let field = data[i];
		fieldSelect.append('<option value="' + field.field_id + '">' + field.name + '</option>');
	}
	fieldSelect.val(field_id);
	//fieldSelect.removeAttribute("disabled");
	
}
/*
document.querySelectorAll("body").on("change", "[data-v-countries]", function () {
	let fieldGroup = this.closest("tr");
	let fieldSelect = $("[data-v-field-field_id]", fieldGroup);
	let country_id = this.value;
	let field_id = this.dataset.vFieldId;
	this.disabled = false;

	if (fields[country_id]) {
		addFieldsToSelect(fieldSelect, fields[country_id], field_id);
		document.querySelectorAll("[data-v-field] [data-v-countries]:disabled:first").change();
	} else {
		$.get(fieldsUrl + "&country_id=" + country_id).done(function( data ) {
			fields[country_id] = data;
			addFieldsToSelect(fieldSelect, data, field_id);
			document.querySelectorAll("[data-v-field] [data-v-countries]:disabled:first").change();
		});
	}
	
	this.dataset.vFieldId = 0;
});
*/
/*
document.querySelector(".fields").addEventListener("click", function (event) {
	let element;
	if (element = event.target.closest(".btn-remove")) {
		if (confirm("Are you sure?")) {
			element.closest('.accordion-item').remove();
		}
	}
	
	if (element = event.target.closest(".btn-clone")) {
		let currentItem = element.closest('.accordion-item');
		let newItem = currentItem.cloneNode(true);
		currentItem.after(newItem);
	}
	
	if (element) {
		event.stopPropagation();
		event.stopImmediatePropagation();
		event.preventDefault();
	}
	
	return false;
});
*/
document.getElementById("group-conditionals").addEventListener("click", function (e) {
	let element;

	if (element = event.target.closest(".btn-remove")) {
		let rule = element.closest(".rule");
		if (rule) {
			let group = rule.closest(".group");
			rule.remove();
			
			//if group empty remove it
			if (!group.querySelector(".rule")) {
				group.remove();
			}
		}
		
		e.preventDefault();
	}
	
	if (element = event.target.closest(".btn-add")) {
		let rule = element.closest(".rule");
		if (rule) {
			let template = document.getElementById("field-group-rule-template").innerHTML;
			let id = Math.floor(Math.random() * 10000);
			template = template.replaceAll('field-id-1',"field-id-" + id)
						.replaceAll('field[1]',"field[" + id + "]");
						
			rule.after(generateElements(template)[0]);	
		}
		
		e.preventDefault();
	}

	if (element = event.target.closest("#btn-rule-group-add")) {
		let template = document.getElementById("field-group-rule-group-template").innerHTML;
		let id = Math.floor(Math.random() * 10000);
		template = template.replaceAll('field-id-1',"field-id-" + id)
					.replaceAll('field[1]',"field[" + id + "]");
					
		element.before(generateElements(template)[0]);	
		
		
		e.preventDefault();
	}
});	
/*	
	
document.getElementById("add-field-group-btn").addEventListener("click", function (e) {
	
	let template = document.getElementById("field-group-template").innerHTML;
	let id = Math.floor(Math.random() * 10000);
	template = template.replaceAll('field-id-1',"field-id-" + id)
				.replaceAll('field[1]',"field[" + id + "]");
				
	document.querySelector("[data-v-fields]").appendChild(generateElements(template)[0]);
	
	e.preventDefault();
});
*/