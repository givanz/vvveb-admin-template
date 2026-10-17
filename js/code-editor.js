var codemirror = false;

var editFiles = [];

var CODE_MODE_MAP = {
	js: 'javascript',
	php: 'php',
	css: 'css',
	html: 'htmlmixed'
};

function getCodeModal() {
	return document.getElementById('codeEditorModal');
}

function setButtonLoading(btn, loading) {
	if (!btn) return;

	btn.querySelector(".loading")?.classList.toggle("d-none", !loading);
	btn.querySelector(".button-text")?.classList.toggle("d-none", loading);
}

function showError(error, fallback) {
	if (error && typeof error.text === "function") {
		error.text().then((errorMessage) => {
			displayToast("danger", "Error", errorMessage.substr(0, 200));
		}).catch(() => {
			displayToast("danger", "Error", error?.statusText ?? fallback);
		});
	} else {
		displayToast("danger", "Error", error?.statusText ?? fallback);
	}
}

function saveCodeEditor() {
	let codeModal = getCodeModal();
	let fileInput = codeModal?.querySelector("input[name=file]");
	let typeInput = codeModal?.querySelector("input[name=type]");
	let btn = codeModal?.querySelector(".save-btn");
	let content = "";

	if (typeof saveUrl === "undefined" || !codeModal || !fileInput) {
		displayToast("danger", "Error", "Error saving!");
		return;
	}

	let url = saveUrl + "&file=" + encodeURIComponent(fileInput.value);
	if (typeInput?.value) {
		url += "&type=" + encodeURIComponent(typeInput.value);
	}

	if (codemirror) {
		content = codemirror.getValue();
	} else {
		let textarea = codeModal.querySelector("textarea");
		if (!textarea) return;
		content = textarea.value;
	}

	setButtonLoading(btn, true);

	let formData = new FormData();
	formData.append("content", content);
	formData.append("csrf", document.querySelector('input[name=csrf]')?.value);

	fetch(url, {method: "POST", body: formData}).
	then((response) => {
		if (!response.ok) { throw response; }
		return response.json();
	}).then((data) => {
		displayToast(data.success ? "success" : "danger", "Save", data.message);

		if (data.success) {
			bootstrap.Modal.getOrCreateInstance(codeModal)?.hide();
		}

		setButtonLoading(btn, false);
	}).catch((error) => {
		showError(error, "Error saving!");
		setButtonLoading(btn, false);
	});
}

function openCodeEditorModal(file = '', name = null, fileType = 'html', type = null) {
	if (typeof loadFileUrl === "undefined") {
		displayToast("danger", "Error", "Error loading!");
		return;
	}

	let url = loadFileUrl + "&file=" + encodeURIComponent(file);
	if (type) {
		url += "&type=" + encodeURIComponent(type);
	}

	fetch(url).
	then((response) => {
		if (!response.ok) { throw response; }
		return response.text();
	}).then((data) => {
		let codeModal = getCodeModal();
		if (!codeModal) return;

		codeModal.querySelector(".modal-title .name").textContent = name ?? file;
		codeModal.querySelector(".modal-title .file").textContent = file;
		codeModal.querySelector("input[name=file]").value = file;
		let typeInput = codeModal.querySelector("input[name=type]");
		if (typeInput) typeInput.value = type;

		if (codemirror) {
			let scrollInfo = codemirror.getScrollInfo();
			codemirror.setOption("mode", CODE_MODE_MAP[fileType] ?? null);
			codemirror.setValue(data);
			codemirror.scrollTo(scrollInfo.left, scrollInfo.top);
			setTimeout(function() {
				codemirror.refresh();
			}, 300);
		} else {
			let textarea = codeModal.querySelector("textarea");
			if (textarea) textarea.value = data;
		}

		bootstrap.Modal.getOrCreateInstance(codeModal)?.show();
	}).catch((error) => {
		showError(error, "Error loading!");
	});
}

window.addEventListener("mediaModal:fileActions", function(e) {
	let data = e.detail;
	if (!data.isImage) {
		let index = editFiles.push({file: data.file, name: data.name, fileType: data.fileType}) - 1;
		e.detail.actions = '<a href="javascript:void(0);" data-edit-file="' + index + '" title="Edit" class="btn btn-outline-primary btn-sm border-0"><i class="la la-edit"> Edit</i></a>';
	}
});

document.addEventListener("click", function(e) {
	let editLink = e.target.closest?.("[data-edit-file]");
	if (!editLink) return;

	let entry = editFiles[editLink.getAttribute("data-edit-file")];
	if (!entry) return;

	let li = editLink.closest("li.files");
	let name = li?.querySelector(".info .name")?.textContent ?? entry.name;

	openCodeEditorModal(entry.file, name, entry.fileType);
});

var codeEditorTextarea = document.querySelector("#codeEditorModal textarea");
if (codeEditorTextarea && !codemirror) {
	codemirror = CodeMirror.fromTextArea(codeEditorTextarea, {
		mode: 'htmlmixed',
		matchBrackets: true,
		lineNumbers: true,
		autofocus: true,
		lineWrapping: true,
		indentUnit: 4,
		indentWithTabs: true,
		viewportMargin: Infinity,
		theme: 'duotone-dark'
	});
}
