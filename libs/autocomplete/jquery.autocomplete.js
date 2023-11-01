/**
*    Json key/value autocomplete for jQuery 
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
*    Examples 
* 
*	 $("input#example").autocomplete("autocomplete.php");//using default parameters
* 
*	 $("input#example").autocomplete("autocomplete.php",{minChars:3,timeout:3000,validSelection:false,parameters:{'myparam':'myvalue'},before : function(input,text) {},after : function(input,text) {}});
* 
*    minChars = Minimum characters the input must have for the ajax request to be made
*	 timeOut = Number of miliseconds passed after user entered text to make the ajax request   
*    validSelection = If set to true then will invalidate (set to empty) the value field if the text is not selected (or modified) from the list of items.
*    parameters = Custom parameters to be passed
*    after, before = a function that will be caled before/after the ajax request
*/
(function ($) {

$.fn.autocomplete = function(options) {
	
	return this.each( function() {//apply for each matched element
		let textInput = $(this);
		let name = textInput.attr("name");
		let text = textInput.data("text");
		let textName = name;
		let index = 0;
		
		//check if name is array[name]
		if ((index = textName.lastIndexOf(']')) > 0) {
			textName = textName.substring(0, index) + "_text" + textName.substring(index, this.length);
		} else {
			textName += "_text";
		}
		
		textInput.attr("name", textName);
		
		//create a new hidden input that will be used for holding the return value when posting the form, then swap names with the original input
		let hiddenInput = $('<input type=hidden name="' + name + '"/>');
		hiddenInput.val( textInput.val() );
		textInput.after(hiddenInput);

		if (text) {
			textInput.val(text);
		}
		
		let valueInput = $(this).next();
		//create the ul that will hold the text and values
		valueInput.after('<ul class="autocomplete"></ul><button class="btn-close"></button>');
		let list = valueInput.next();
		let btnClose = list.next();
		
		let oldText = '';
		let typingTimeout;
		let size = 0;
		let selected = -1;
		let self = this;

		let settings = $.extend({//provide default settings
			minChars : 1,
			timeout: 1000,
			after : null,
			before : null,
			validSelection : true,
			allowFreeText:false,
			url : this.dataset.url,
			listName : this.dataset.listName ?? "list",
			parameters : {'inputName' : valueInput.attr('name'), 'inputId' : textInput.attr('id')}
		} , options);


		function selectOption(value, text) {
			valueInput.val( value ); 
			textInput.val( text ); 
			textInput.trigger("autocomplete.change", [ value, text ]);
			clear(); 
		}

		

		function getData(text){
			window.clearInterval(typingTimeout);
			if (text != oldText && (settings.minChars != null && text.length >= settings.minChars)) {
				clear();
				if (settings.before == "function")  {
					settings.before(textInput,text);
				}
				textInput.addClass('autocomplete-loading');
				settings.parameters.text = text;
				
				$.getJSON(settings.url, settings.parameters, function(data) {
					
					let items = '';
					if (data) {
						size = 0;

						  for ( key in data )//get key => value
						  {	
								let txt = $("<span>" + data[key] + "<span>").text();
								let replace = txt.replace(text, "<strong>" + text + "</strong>");
								items += '<li value="' + key + '">' + data[key].replace(txt, replace) + '</li>';
								size++;
						  }
						list.css({/*top: textInput.offset().top + textInput.outerHeight(), left: textInput.offset().left,*/ width: Math.max(100, textInput.outerWidth())}).html(items);
						//on mouse hover over elements set selected class and on click set the selected value and close list
						list.show().children().
							hover(function() { 
								$(this).addClass("selected").siblings().removeClass("selected");
							}, function() { 
								$(this).removeClass("selected") 
							}).click(function () { 
								value = $(this).attr('value'); 
								text = $(this).text();
								selectOption(value, text);
							});

						if (settings.after == "function")  {
							settings.after(textInput,text);
						}
						textInput.addClass('autocomplete-open');
					}
					textInput.removeClass('autocomplete-loading');
				});
				oldText = text;
			}
		}
		
		function clear() {
			textInput.removeClass('autocomplete-open');
			textInput.removeClass('autocomplete-loading');
			list.hide();
			size = 0;
			selected = -1;
		}	
		
		btnClose.click(function (e) {
			clear();
			e.preventDefault();
			return false;
		});

		textInput.keydown(function(e) {
			
			window.clearInterval(typingTimeout);
			if(e.which == 27) {//escape
				clear();
			} else if (e.which == 46 || e.which == 8) {//delete and backspace
				clear();
				//invalidate previous selection
				if (settings.validSelection) valueInput.val('');
			}
			else if(e.which == 13) {//enter 
				if ( list.css("display") == "none") {//if the list is not visible then make a new request, otherwise hide the list
					getData(textInput.val());
				} else {
					clear();
				}
				
				if (settings.allowFreeText) {
					selectOption(textInput.val(), textInput.val());
					clear();
				}
				e.preventDefault();
				return false;
			}
			else if(e.which == 40 || e.which == 9 || e.which == 38) {//move up, down 

			  switch(e.which) 
			  {
				case 40: //down
				case 9:
				  selected = (selected >= size - 1) ? 0 : selected + 1; break;
				case 38://up
				  selected = (selected < 0) ? size -1 : selected - 1; break;
				default: break;
			  }
			  //set selected item and input values
			  textInput.val( list.children().removeClass('selected').eq(selected).addClass('selected').text() );	        
			  valueInput.val( list.children().eq(selected).attr('value') );
			} else  { 
				//invalidate previous selection
				if (settings.validSelection) valueInput.val('');
				typingTimeout = window.setTimeout(function() { getData(textInput.val()) },settings.timeout);
			}
		});
	});
};

$.autocompleteList = function(el, options) {
	
		let autocomplete = $(el).autocomplete(options);
		let values = {};

		let settings = $.extend({//provide default settings
			listName : el.dataset.listName ?? "list",
		} , options);

		let list = $('~ .autocomplete-list', autocomplete);
		if (!list.length) {
			list = $('<div class="autocomplete-list card border-top-0"></div>');
		}
		
		let autocomplete_hidden = autocomplete.next();
		
		let name =  autocomplete_hidden.attr("name");
		
		autocomplete_hidden.next().next().after(list);
		let autocomplete_list_hidden = $('<input type=hidden name="' + name + '_list"  value="' + autocomplete_hidden.val() + '"/>');
		
		list.after(autocomplete_list_hidden.next());//add list after btn-close

		function addItem(value, text) {
			
			list.append($('<div>\
				<button type="button" class="btn-close remove-btn" aria-label="Remove"></button>\
				<span>' + text + '</span>\
				<input name="' + settings.listName + '[' + value + ']" value="' + value + '" type="hidden">\
			 </div>'));
			 autocomplete.val("");
		};
	
		function setList() {
			
			values = {};
			$('input[type="hidden"]', list).each(function(i, el) {
				values[this.value] = $("span", this.parentNode).text();
			});

			autocomplete_list_hidden.val( JSON.stringify(values) );
			
			return values;
		};

		
		function setValue(value) { 
			
			if (value == "" || value == undefined) return false;
//			value = decodeURIComponent(value);
			values = JSON.parse(value);
			
			for (key in values) {
				addItem(key, values[key]);
			}
			
			setList();
		};

		autocomplete.on("autocomplete.change", function(event, value, text) { 
				autocomplete.addItem(value, text);
				values = autocomplete.setList();
				autocomplete.trigger("autocompletelist.change", [ JSON.stringify(values) ]);
		 });

		list.on("click", ".remove-btn", function (event, value, text)  {
			this.parentNode.remove();
			setList();
			autocomplete.trigger("autocompletelist.change", [ JSON.stringify(values) ]);

			event.preventDefault();
			return false;
		});		 

		autocomplete.setValue = setValue;
		autocomplete.addItem = addItem;
		autocomplete.setList = setList;

		$.data(el, "autocompleteList", autocomplete);
		
		return autocomplete;
}

$.fn.autocompleteList = function(options)  {
	
	return this.each( function() {
		$.autocompleteList(this, options);
	});
};

$.tagsInput = function(el, options)  {
		let autocomplete = $(el).autocomplete(options);

		let settings = $.extend({//provide default settings
			listName : el.dataset.listName ?? "list",
		} , options);

		let list = autocomplete.parent();//$('<div class="form-control autocomplete-list" style="min-height: 100px;height: 100px; overflow: auto;"></div>');
		
		let autocomplete_hidden = autocomplete.next();
		
		let name =  autocomplete_hidden.attr("name");
		
		autocomplete_hidden.next();//.after(list);
		let autocomplete_list_hidden = $('<input type=hidden name="' + name + '_list" value="' + autocomplete_hidden.val() + '"/>');
		
		list.append(autocomplete_list_hidden);

		function addItem(value, text) {
			let attributes = ';'
			let name = '';
			//if name is array set value otherwise set value as array key
			if (settings.listName.lastIndexOf('[') > 0) {
				name = settings.listName + '[' + value + ']';
				attributes = 'name="' + name + '" value="' + text + '"';
			} else {
				name = settings.listName + '[' + settings.listId + '][' + value + ']';
				attributes = 'name="' + name + '" value="' + text + '"';
			}
			
			autocomplete.before($('<div class="tag"><span>' + text + '</span>\
				<a href="#" class="remove-btn"><i class="la la-times"></i></a>\
				<input ' + attributes + ' type="hidden">\
			 </div>'));
			 autocomplete.val("");
		};
	
		function setList() {
			
			let values = {};
			//console.log($('input[name="list[]"]', list).serialize());
			$('input[name="list[]"]', list).each(function(i, el) {
				values[this.value] = $("span", this.parentNode).text();
			});

			//values = encodeURIComponent(JSON.stringify(values));
			values = JSON.stringify(values);//.replace('"', '\"');
			autocomplete_list_hidden.val( values );
			return values;
		};

		
		function setValue(value) { 
			if (value == "" || value == undefined) return false;
			values = JSON.parse(value);
			
			for (key in values){
				addItem(key, values[key]);
			}
			
			setList();
		};

		let self = this;

		autocomplete.on("autocomplete.change", function(event, value, text) { 
				addItem(value, text);
				let values = autocomplete.setList();
				autocomplete.trigger("tagsinput.change", [ values ]);
		 });

		list.on("click", ".remove-btn", function (event, value, text)  {
			this.parentNode.remove();
			
			let values = setList();
			autocomplete.trigger("tagsinput.change", [ values ]);

			event.preventDefault();
			return false;
		});		 

		autocomplete.setValue = setValue;
		autocomplete.addItem = addItem;
		autocomplete.setList = setList;

		$.data(el, "tagsInput", autocomplete);
		
		return autocomplete;
}

$.fn.tagsInput = function(options)  {
	
	return this.each( function() {//do it for each matched element
		$.tagsInput(this, options);
	});
};

})(jQuery);
