let codemirror = false;

function saveCodeEditor() {
	let codeModal = document.getElementById('codeEditorModal');
	let file = codeModal.querySelector("input[name=file]").value;
	let type = codeModal.querySelector("input[name=type]").value;
	let btn = codeModal.querySelector(".save-btn");
	let content = "";
	let url = `${saveUrl}&file=${file}`;
	if (type) {
		url += "&type=" + type;
	}

	if (codemirror) {
		content = codemirror.getValue();
	} else {
		content = codeModal.querySelector("textarea").value;
	}

	btn.querySelector(".loading").classList.toggle("d-none");
	btn.querySelector(".button-text").classList.toggle("d-none");
	
	let formData = new FormData();
	formData.append("content", content);
					
	fetch(url, {method:"POST", body:formData}).
	then((response) => {
		if (!response.ok) { throw new Error(response) }
		return response.json();
	}).then(function (data) {
		console.log(data);
		let bg = "success";
		if (data.success) {		
		} else {
			bg = "danger";
		}
		
		displayToast(bg, "Save", data.message);

		if (data.success) {		
			bootstrap.Modal.getOrCreateInstance(codeModal)?.hide();
		}

		btn.querySelector(".loading").classList.toggle("d-none");
		btn.querySelector(".button-text", btn).classList.toggle("d-none");
	}).catch(error => {
		console.log(error);
		let message = error?.statusText ?? "Error saving!";
		displayToast("danger", "Error", message);

		if (error.hasOwnProperty('text')) error.text().then( errorMessage => {
			let message = errorMessage.substr(0, 200);
			displayToast("danger", "Error", message);
		});

		btn.querySelector(".loading").classList.toggle("d-none");
		btn.querySelector(".button-text").classList.toggle("d-none");
	});
}

function openCodeEditorModal(file = '', name = null, fileType = 'html', type = null) {
	let url = `${loadFileUrl}&file=${file}`;
	if (type) {
		url += "&type=" + type;
	}

	fetch(url).
	then((response) => {
		if (!response.ok) { throw new Error(response) }
		return response.text();
	}).then(function (data) {
		let codeModal = document.getElementById('codeEditorModal');
		codeModal.querySelector(".modal-title .name").innerHTML = name ?? file;
		codeModal.querySelector(".modal-title .file").innerHTML = file;
		codeModal.querySelector("input[name=file]").value = file;
		codeModal.querySelector("input[name=type]").value = type;
		
		if (fileType == 'js') {
			fileType = 'javascript';
		} else if (fileType == 'php') { 
			fileType = 'php';
		} else if (fileType == 'css') { 
			fileType = 'css';
		} else if (fileType == 'html') { 
			fileType = 'htmlmixed';
		} else { 
			fileType = 'null';
		}

		if (codemirror) {
			var scrollInfo = codemirror.getScrollInfo();
			codemirror.setOption("mode", fileType);
			codemirror.setValue(data);
			codemirror.scrollTo(scrollInfo.left, scrollInfo.top);
			setTimeout(function() {
				codemirror.refresh();
			},300);

		} else {
			codeModal.querySelector("textarea").value = data;
		}
		
		bootstrap.Modal.getOrCreateInstance(codeModal)?.show();
	}).catch(error => {
		let message = error?.statusText ?? "Error loading!";
		displayToast("danger", "Error", message);

		if (error.hasOwnProperty('text')) error.text().then( errorMessage => {
			let message = errorMessage.substr(0, 200);
			displayToast("danger", "Error", message);
		});
	});
}


window.addEventListener("mediaModal:fileActions", function(e) { 
	let data = e.detail;
	if (!data.isImage) {
		e.detail.actions = '<a href="javascript:void(0);" class="btn btn-outline-primary btn-sm border-0" onclick="openCodeEditorModal(\'' + data.file + '\', \'' + data.name + '\', \'' + data.fileType + '\')"><i class="la la-edit"> Edit</i></a>';
	}
});


if (codemirror == false) {
	codemirror = CodeMirror.fromTextArea(document.querySelector("#codeEditorModal textarea"), {
		mode: 'htmlmixed',
		matchBrackets: true,
		lineNumbers: true,
		autofocus: true,
		lineWrapping: true,
		indentUnit: 4,
        indentWithTabs: true,
		viewportMargin:Infinity,
		theme: 'material'
	});
	
	this.isActive = true;
	codemirror.getDoc().on("change", function (e, v) { 
		//delay(Vvveb.Builder.setinnerHTML = e.getValue()), 1000);
	});
}