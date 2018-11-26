jQuery(".menu-toggle").click(function() {jQuery("#container").toggleClass("small-nav"); return false;});

/*

var storage  = Storages.localStorage;
//storage.removeAll();

$('.collapse').on('hide.bs.collapse', function () {
	console.log('hide - ' + this.id);
	if (this.id) storage.remove('collapse_' + this.id);
});

$('.collapse').on('show.bs.collapse', function () {
	console.log('show - ' + this.id);
	if (this.id) storage.set('collapse_' + this.id, true);
});



$('.collapse').each(function () {
	// Default close unless saved as open
	if (storage.get('collapse_' + this.id) == true) {
		$(this).collapse('show');
	}
});
*/
