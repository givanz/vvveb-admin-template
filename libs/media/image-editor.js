const { TABS, TOOLS } = FilerobotImageEditor;

const config = {
	source: '/media/biglogo.png',
	closeAfterSave: true,
	annotationsCommon: {
		fill: '#333333',
	},
	Text: {
		text: 'Vvveb',
		fontFamily: 'Inter',
		fontSize: 36,
		fonts: [
			{ label: 'Arial', value: 'Arial' },
			{ label: 'Inter', value: 'Inter' },
			{ label: 'Inter Variable', value: 'InterVariable' },
			{ label: 'Tahoma', value: 'Sans-serif' },
			{ label: 'Roboto', value: 'Roboto' },
			{ label: 'Helvetica Neue', value: 'Helvetica Neue' },
			{ label: 'Noto Sans', value: 'Noto Sans' },
			{ label: 'Liberation Sans', value: 'Liberation Sans' },
			{ label: 'Segoe UI', value: 'Segoe UI' },
			{ label: 'Comic Sans', value: 'Comic-sans' },
		],
	},
	Rotate: { angle: 90, componentType: 'slider' },
	translations: {
		profile: 'Profile',
		coverPhoto: 'Cover photo',
		facebook: 'Facebook',
		socialMedia: 'Social Media',
		fbProfileSize: '180x180px',
		fbCoverPhotoSize: '820x312px',
	},
	Crop: {
		presetsItems: [
			{
				titleKey: 'classicTv',
				descriptionKey: '4:3',
				ratio: 4 / 3,
				// icon: CropClassicTv, // optional, CropClassicTv is a React Function component. Possible (React Function component, string or HTML Element)
			},
			{
				titleKey: 'cinemascope',
				descriptionKey: '21:9',
				ratio: 21 / 9,
				// icon: CropCinemaScope, // optional, CropCinemaScope is a React Function component.  Possible (React Function component, string or HTML Element)
			},
		],
		presetsFolders: [
			{
        titleKey: 'socialMedia', // will be translated into Social Media as backend contains this translation key
        // icon: Social, // optional, Social is a React Function component. Possible (React Function component, string or HTML Element)
				groups: [
					{
						titleKey: 'facebook',
						items: [
							{
								titleKey: 'profile',
								width: 180,
								height: 180,
								descriptionKey: 'fbProfileSize',
							},
							{
								titleKey: 'coverPhoto',
								width: 820,
								height: 312,
								descriptionKey: 'fbCoverPhotoSize',
							},
						],
					},
				],
			},
		],
	},
	tabsIds: [
		TABS.ADJUST,
		TABS.FINETUNE,
		TABS.FILTERS,
		TABS.WATERMARK,
		TABS.ANNOTATE,
		TABS.RESIZE,
  ], // or ['Adjust', 'Annotate', 'Watermark']
  defaultTabId: TABS.ADJUST, // or 'Annotate'
  defaultToolId: TOOLS.TEXT, // or 'Text'
};

const editorContainer = document.getElementById('editor-container');
const currentImage = document.getElementById('current-image');
const editImageBtn = document.getElementById('edit-image-btn');

function DataURIToBlob(dataURI) {
	const splitDataURI = dataURI.split(',');
	const byteString = splitDataURI[0].indexOf('base64') >= 0
		? atob(splitDataURI[1])
		: decodeURI(splitDataURI[1]);
	const mimeString = splitDataURI[0].split(':')[1].split(';')[0];

	const bytes = new Uint8Array(byteString.length);
	for (let i = 0; i < byteString.length; i++) {
		bytes[i] = byteString.charCodeAt(i);
	}

	return new Blob([bytes], { type: mimeString });
}

function notify(type, title, message) {
	if (typeof displayToast === "function") {
		displayToast(type, title, message);
	}
}

function toggleEditor(showEditor) {
	editorContainer?.classList.toggle("d-none", !showEditor);
	currentImage?.classList.toggle("d-none", showEditor);
}

async function onSave(imageInfo) {
	const mediaPath = Vvveb.MediaModal.mediaPath + Vvveb.MediaModal.currentPath;
	const file = DataURIToBlob(imageInfo.imageBase64);

	const formData = new FormData();
	formData.append("file", file, imageInfo.fullName);
	formData.append("mediaPath", mediaPath);
	formData.append("onlyFilename", true);
	formData.append("overwrite", true);

	toggleEditor(false);

	try {
		const response = await fetch(uploadUrl, { method: "POST", body: formData });
		if (!response.ok) { throw response; }

		const results = await response.json();
		const result = Array.isArray(results) ? results[0] : results;

		if (result?.success) {
			const fileName = result.file || imageInfo.fullName;

			const img = document.getElementById("current-image");
			if (img) { img.src = mediaPath + "/" + fileName + "?" + Date.now(); }

			const nameInput = document.getElementById("input-file-name");
			if (nameInput) { nameInput.value = fileName; }

			notify("success", "Success", result.message);
		} else {
			notify("danger", "Error", result?.message ?? "Error saving image!");
		}
	} catch (error) {
		notify("danger", "Error", error?.statusText ?? "Error uploading!");
		if (typeof error?.text === "function") {
			error.text().then(body => {
				if (body) notify("danger", "Error", String(body).substr(0, 200));
			}).catch(() => {});
		}
	} finally {
		Vvveb.MediaModal?.hideUploadLoading?.();
	}
}

if (editorContainer && currentImage && editImageBtn) {
	const filerobotImageEditor = new FilerobotImageEditor(editorContainer, config);

	editImageBtn.addEventListener('click', () => {
		filerobotImageEditor.config.source = currentImage.src + "?" + Date.now();

		filerobotImageEditor.render({
			onSave,
			avoidChangesNotSavedAlertOnLeave: true,
			disableSaveIfNoChanges: true,
			useCloudimage: false,
			onClose: () => {
				toggleEditor(false);
				filerobotImageEditor.terminate();
			},
		});

		toggleEditor(true);
	});
}
