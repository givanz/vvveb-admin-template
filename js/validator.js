/*

rules = [
			[{"name":"post_title", title: "Post title"}, {"rule":"not_empty","message":"%s is empty"},{"rule":"max_length", "parameters":100,"message":"%s is longer than %d"}],
			[{"name":"post_content"}, {"rule":"not_empty","message":"%s is empty"}],
			[{"name":"post_tags"}, {"rule":"not_empty","message":"%s is empty"}],
			[{"name":"post_status", "element" : null}, {"rule":"allowed_values", "parameters":["publish","draft","pending"],"message":"%s is invalid, valid options are %s"}],
			[{"name":"post_visibility"}, {"rule":"allowed_values", "parameters":["public","private","password"],"message":"%s is invalid, valid options are %s"}]
		];

validator(rules);
*/
function validator(rules)
{
	this.default_message_max_length = "%s is longer than %d";
	this.default_message_not_empty = "%s is empty";
	this.default_message_allowed_values = "%s is invalid, valid options are %s";
	
	this.human_readable = function (text)
	{
		if (!text) return "";
		patt = new RegExp("[a-zA-Z-0-9-_ ]*");
		text = patt.exec(text)[0];
		text = text.replace(/[_-]/gi, ' ');
		return text.charAt(0).toUpperCase() + text.slice(1);
	}
	
	this.printf = function()
	{
		printf_arguments = arguments;
		text = printf_arguments[0];
		if (printf_arguments.length <= 1) return text;

		i = 1;
		
		
		text = text.replace(/%[a-z]/gi, 
		function myFunction(x)
		{
			if (i < printf_arguments.length) return printf_arguments[i++]; else return x;
		});
		
		return text;
	}
	
	this.not_empty = function(input_name, rule_options, message, value)
	{
		if (!message) message = this.default_message_not_empty;
		if (!value || value == "") return printf(message, human_readable(input_name));
		
		return false;
	}

	this.max_length = function(input_name, rule_options, message, value)
	{
		if (!message) message = this.default_message_max_length;
		if (value.length > rule_options) return  printf(message, human_readable(input_name), rule_options);
		
		return false;
	}

	this.allowed_values = function(input_name, rule_options, message, value)
	{
		if (!message) message = this.default_message_allowed_values;
		if (value.length > rule_options) return  printf(message, human_readable(input_name), rule_options.join(', '));
		
		return false;
	}
	

	//if no rules array is provided then search for [validate-data] elements inside provided selector and construct rules array
	if (typeof rules == "string") 
	{

		rules_form = [];
		i = 0;
		$("[data-validate]",rules).each(function () {

				rules_form[i] =JSON.parse(this.dataset.validate);
				rules_form[i].unshift({"element" : $(this)});

				i++;

		});	
		
		rules = rules_form;
	}
	
	has_error = true;
	
	for (i in rules)
	{
		rule_name = '';
		input = rules[i][0];

		if (input['element']) form_input = input['element'];
			else
		if (input['name'] == "string") 
			form_input = jQuery("[name=" + input + "]");
			else break;		

		options = rules[i].splice(1);
		for (j in options) 
		{
		
			rule_name  = options[j]["rule"];
			parameters  = options[j]["parameters"];
			message  = options[j]["message"];
			input = (form_input.prop("title") ? form_input.prop("title") : (form_input.prop("placeholder")  ? form_input.prop("placeholder") : form_input.prop("name"))) ;
			value = form_input.val();
			
			
			form_input.remove("form-control-danger");
			form_group = form_input.parents(".form-group");
			form_group.removeClass("has-danger");
			jQuery(".invalid-feedback", form_group).remove();

			error = this[rule_name](input, parameters, message, value);
			$("[data-validation-errors]").hide();
			$("[data-validation-error]").remove();


			if (error != false)
			{
					
				form_group.addClass("has-danger").append('<div class="invalid-feedback" style="display:block;">' + error + '</div>');
				form_input.addClass("form-control-danger");
				$(".validation-errors").append('<div class="alert alert-danger alert-dismissable" role="alert" data-validation-error>\
					  <button type="button" class="close" data-dismiss="alert" aria-label="Close">\
						<span aria-hidden="true">&times;</span>\
					  </button>\
					<div data-validation-error>\
						<i class="ion-alert-circled"></i>\
						<span data-validation-error-text>' + error + '</span>\
					</div></div>');
					
				$("[data-validation-errors]").show();
				//$(".validation-errors")
				
				return has_error = false;
			}
		}
	}
	
	return has_error;
}
