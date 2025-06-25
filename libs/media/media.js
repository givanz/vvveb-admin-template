function ucFirst(str) {
  if (!str) return str;

  return str[0].toUpperCase() + str.slice(1);
}


/*
var mediaPath = "/public/media/";
var mediaScanUrl = "scan.php";
var uploadUrl = "upload.php";
*/

function fileExtension(filename) {
	return filename.split('.').pop();
}

let videoExtensions = ['mp4', 'webm', 'mov', 'ogg', 'mkv', 'flv', 'avi', '3gp', 'mpg', 'mpeg'];

function isVideo(filename) {
	return videoExtensions.indexOf(fileExtension(filename)) != -1;
}

function clearMedia(id = "featured-image") {
	document.getElementById(id + "-input").value = "";
	document.getElementById(id + "-thumb").setAttribute("src", "../media/placeholder.svg");
}


class MediaModal {
	constructor (modal = true)
	{
		this.isInit = false;
		this.isModal = modal;
		
		this.modalHtml = 
		`
		<div class="modal fade modal-full" id="MediaModal" tabindex="-1" role="dialog" aria-labelledby="MediaModalLabel" aria-hidden="true">
		  <div class="modal-dialog modal-xl modal-dialog-scrollable" role="document">
			<div class="modal-content">
			  <div class="modal-header">
				<h5 class="modal-title fw-normal" id="MediaModalLabel">Media</h5>
                
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
				  <!-- <span aria-hidden="true"><i class="la la-times la-lg"></i></span> -->
				</button>
			  </div>
			  <div class="modal-body">
	
                      <div class="filemanager">

						<div class="top-right d-flex justify-content-between">
                             
							<div class="">          
								<div class="breadcrumbs"></div>
							</div>
                                       
                                   
							<div class="">                   
								<div class="search">
									<input type="search" id="media-search-input" placeholder="Find a file.." />
								</div>
								
								<button class="btn btn-outline-secondary btn-sm btn-icon me-5 float-end" 
								   data-bs-toggle="collapse" 
								   data-bs-target=".upload-collapse" 
								   aria-expanded="false" 
								   >
								   <i class="la la-upload la-lg"></i>
									Upload file
								</button>
							</div>
							
						</div>

						<div class="top-panel">

							<div class="upload-collapse collapse">

								<button id="upload-close" type="button" class="btn btn-sm btn-light" aria-label="Close" data-bs-toggle="collapse" data-bs-target=".upload-collapse" aria-expanded="true">
								   <span aria-hidden="true"><i class="la la-times la-lg"></i></span>
								</button>
								
							   <h3>Drop or choose files to upload</h3>
							   
							   <input type="file" multiple class=""> 
								
								<div class="status"></div>
							</div>


						</div>
						
						<div class="display-panel">
							
							<ul class="data" id="media-files"></ul>
						
							<div class="nothingfound" style="display:none">
								<div class="nofiles">
									<i class="la la-folder-open"></i>
								</div>
								<div>No files here.</div>
								<div class="mt-4">
									<button class="btn btn-outline-secondary btn-sm btn-icon" data-bs-toggle="collapse" data-bs-target=".upload-collapse" aria-expanded="false">
									<i class="la la-upload la-lg"></i>
									Upload file 
									</button>
								</div>
							</div>
						</div>
					</div>

			  </div>
			  <div class="modal-footer justify-content-between">
			  
				<div class="align-left">
			
				</div>
			  
				<div class="align-right">
					<button type="button" class="btn btn-secondary btn-icon me-1" data-bs-dismiss="modal">
						<i class="icon-close"></i>
						<span>Cancel</span>
					</button>
					<button type="button" class="btn btn-primary btn-icon save-btn">
						<i class="icon-add"></i>
						<span>Add selected</span>
					</button>
				</div>
			  </div>
			</div>
		  </div>
		</div>`;
		
		this.response = [],
		this.currentPath = '';
		this.breadcrumbsUrls = [];
		this.filemanager = null;
		this.breadcrumbs = null;
		this.fileList = null;
		this.mediaPath = mediaPath;
		this.type = "single";
		this.currentMedia;
	}
	
	addModalHtml() {
		if (this.isModal) document.body.append(generateElements(this.modalHtml)[0]);
		document.querySelector("#MediaModal .save-btn").addEventListener("click", () => this.save());
	}
	
	showUploadLoading() {
		document.querySelector("#MediaModal .upload-collapse .status").innerHTML = `
		<div class="spinner-border" style="width: 5rem; height: 5rem;margin: 5rem auto; display:block" role="status">
		  <span class="visually-hidden">Loading...</span>
		</div>`;
	}

	hideUploadLoading() {
		document.querySelector("#MediaModal .upload-collapse .status").innerHTML = '';
	}
	
	save() {
		let files = [];
		let file = "";
		let src = "";

		if (this.type == "single") {
			file = document.querySelector("#MediaModal .files input:checked").value ?? false;
			
			if (!file) return;

			if (file.indexOf("//") == -1) {
				src = this.mediaPath + file;
			}

			files.push(file);

			if (this.targetThumb) {
				document.querySelector(this.targetThumb)?.setAttribute("src", src);
			}
		
		} else {
			document.querySelectorAll("#MediaModal .files input:checked").forEach(e => {
				files.push(e.value);
				src += this.mediaPath + e.value + ",";
				file += e.value + ",";
			});
		}
		
		if (this.callback) {
			this.callback(src, file, files);
		}

		if (this.targetInput) {
			let input = document.querySelector(this.targetInput);
			input.value = file;
			const e = new Event("change",{bubbles: true});
			input.dispatchEvent(e);
		}

		document.querySelectorAll("#MediaModal .files input:checked").forEach(e => e.checked = false);
		let modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('MediaModal'));
		if (this.isModal) modal.hide();
	}
	
	init() {
		if (!this.isInit) {
			if (this.isModal) this.addModalHtml();
			let self = this;

			this.initGallery();
			this.isInit = true;

			document.querySelector(".filemanager input[type=file]").addEventListener("change", this.onUpload);
			document.querySelector(".filemanager").addEventListener("click", function (e) {
				let element = e.target.closest(".btn-delete");
				if (element) {
					 self.deleteFile(element);
				} else {
					element = e.target.closest(".btn-rename");
					if (element) {
						 self.editMedia(element);
					} else {
						element = e.target.closest(".btn-new-folder");
						if (element) {
							 self.newFolder(element);
						}
					}
				}
			});

			let offcanvas = document.querySelector("#media-offcanvas");
			offcanvas?.addEventListener("click", function (e) {
				let element = e.target.closest(".save-btn");
				if (element) {
					 self.saveMediaContent(element);
				} else {
					element = e.target.closest("#next-media");
					if (element) {
						 self.nextMedia(element);
					} else {
						element = e.target.closest("#prev-media");
						if (element) {
							 self.prevMedia(element);
						}
					}
				}
			});

			const event = new CustomEvent( "mediaModal:init", {detail: { type:this.type, targetInput:this.targetInput, targetThumb:this.targetThumb, callback:this.callback} });
			window.dispatchEvent(event);			
		}
	}
	
	open(element, callback) {
		if (element instanceof Element) {
			this.targetInput = element.dataset.targetInput;
			this.targetThumb = element.dataset.targetThumb;
			if (element.dataset.type) {
				this.type = element.dataset.type;
			}
		} else if (element) {
			this.targetInput = element.targetInput;
			this.targetThumb = element.targetThumb;
			if (element.type) {
				this.type = element.type;
			}
		}
		
		this.callback = callback;
		this.init();
		
		if (this.type == "single") {
			document.querySelectorAll("#MediaModal .files input[type=checkbox]").forEach(e => e.setAttribute("type", "radio"));
		} else {
			document.querySelectorAll("#MediaModal .files input[type=radio]").forEach(e => e.setAttribute("type", "checkbox"));
		}

		let modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('MediaModal'));
		if (this.isModal) modal.show();
	}


	initGallery() {
		this.filemanager = document.querySelector('.filemanager'),
		this.breadcrumbs = document.querySelector('.breadcrumbs'),
		this.fileList = this.filemanager.querySelector('.data');
		let _this = this;

		// Start by fetching the file data from scan.php with an AJAX request
		fetch(mediaScanUrl)
		.then((response) => {
			if (!response.ok) { throw new Error(response) }
			return response.json();
		})
		.then((data) => {
			 _this.response = [data],
			 _this.currentPath = '',
			 _this.breadcrumbsUrls = [];

			let folders = [],
				files = [];
				
			window.dispatchEvent(new HashChangeEvent("hashchange"));
		})
		.catch(error => {
			console.log(error.statusText);
			displayToast("danger", "Error", "Error loading media!", "top");
		});

		// This event listener monitors changes on the URL. We use it to
		// capture back/forward navigation in the browser.

		window.addEventListener('hashchange', function(){

			_this.goto(window.location.hash);

			// We are triggering the event. This will execute 
			// this function on page load, so that we show the correct folder:

		});


		// Hiding and showing the search box
		let search = this.filemanager.querySelector('input[type=search]');

		this.filemanager.querySelector('.search').addEventListener("click", function(e) {
			let _search = this;

			_search.querySelectorAll('span').forEach(function (el,i) { el.style.display = "none";});
			search.style.display = "block";
			search.focus();

		});


		// Listening for keyboard input on the search field.
		// We are using the "input" event which detects cut and paste
		// in addition to keyboard input.

		search.addEventListener('input', function(e) {

			let folders = [];
			let files = [];

			let value = this.value.trim();

			if(value.length) {

				_this.filemanager.classList.add('searching');

				// Update the hash on every key stroke
				window.location.hash = 'search=' + value.trim();

			}

			else {

				_this.filemanager.classList.remove('searching');
				window.location.hash = encodeURIComponent(_this.currentPath);

			}

		});
		
		search.addEventListener('keyup', function(e) {

			// Clicking 'ESC' button triggers focusout and cancels the search

			let search = this;

			if(e.keyCode == 27) {

				search.trigger('focusout');

			}

		});
		
		search.addEventListener("focusout", function(e) {

			// Cancel the search

			let search = this;

			if(!search.value.trim().length) {

				window.location.hash = encodeURIComponent(_this.currentPath);
				search.style.display = 'none';
				search.parentNode.querySelectorAll('span').style.display = '';

			}

		});

		// Clicking on folders

		this.fileList.addEventListener('click', function(e) {
			let el = event.target.closest('li.folders');
			if (el) {
				e.preventDefault();

				let nextDir = el.querySelector('a').getAttribute('href');

				if(_this.filemanager.classList.contains('searching')) {

					// Building the this.breadcrumbs

					_this.breadcrumbsUrls = _this.generateBreadcrumbs(nextDir);

					_this.filemanager.classList.remove('searching');
					let search = _this.filemanager.querySelector('input[type=search]');
					search.val('')
					search.style.display = 'none';
					_this.filemanager.querySelectorAll('span').forEach(e => e.style.display = '');
				}
				else {
					_this.breadcrumbsUrls.push(nextDir);
				}

				window.location.hash = encodeURIComponent(nextDir);
				_this.currentPath = nextDir;
			}
		});


		// Clicking on this.breadcrumbs

		this.breadcrumbs.addEventListener('click', function(e){
			let el = event.target.closest('a');
			if (el) {
				e.preventDefault();

				let index = [...el.parentNode.children].indexOf(el),
					nextDir = _this.breadcrumbsUrls[index];
					nextDir = el.getAttribute("href");

				_this.breadcrumbsUrls.length = Number(index);

				window.location.hash = encodeURIComponent(nextDir);
			}
		});
	}


		// Navigates to the given hash (path)

		goto(hash) {

			hash = decodeURIComponent(hash).slice(1).split('=');
			let _this = this;

			if (hash.length) {
				let rendered = '';

				// if hash has search in it

				if (hash[0] === 'search') {

					this.filemanager.classList.add('searching');
					rendered = _this.searchData(_this.response, hash[1].toLowerCase());

					if (rendered.length) {
						this.currentPath = hash[0];
						this.render(rendered);
					}
					else {
						this.render(rendered);
					}

				}

				// if hash is some path

				else if (hash[0].trim().length) {

					rendered = this.searchByPath(hash[0]);

					if (rendered.length) {

						this.currentPath = hash[0];
						this.breadcrumbsUrls = this.generateBreadcrumbs(hash[0]);
						this.render(rendered);

					}
					else {
						this.currentPath = hash[0];
						this.breadcrumbsUrls = this.generateBreadcrumbs(hash[0]);
						this.render(rendered);
					}

				}

				// if there is no hash

				else {
					this.currentPath = this.response[0].path;
					this.breadcrumbsUrls.push(this.response[0].path);
					this.render(this.searchByPath(this.response[0].path));
				}
			}
		}

		// Splits a file path and turns it into clickable breadcrumbs
_
		generateBreadcrumbs(nextDir){
			let path = nextDir.split('/').slice(0);
			for(let i=1;i<path.length;i++){
				path[i] = path[i-1]+ '/' +path[i];
			}
			return path;
		}


		// Locates a file by path

		searchByPath(dir) {
			let path = dir.split('/'),
				demo = this.response,
				flag = 0;

			for(let i=0;i<path.length;i++){
				for(let j=0;j<demo.length;j++){
					if(demo[j].name === path[i]){
						flag = 1;
						demo = demo[j].items;
						break;
					}
				}
			}

			//demo = flag ? demo : [];
			return demo;
		}


		// Recursively search through the file tree

		searchData(data, searchTerms) {

			let _this = this;
			let folders = [];
			let files = [];

			let _searchData = function (data, searchTerms) { 
			data.forEach(function(d){
				if(d.type === 'folder') {

						_searchData(d.items,searchTerms);

						if(d.name.toLowerCase().indexOf(searchTerms) >= 0) {
						folders.push(d);
					}
				}
				else if(d.type === 'file') {
						if(d.name.toLowerCase().indexOf(searchTerms) >= 0) {
						files.push(d);
					}
				}
			});
			};
			
			_searchData(data, searchTerms);
			
			return {folders: folders, files: files};
		}


		onUpload(event) {
					
		 const data = new FormData();
		 let size = 0;
		 
		  for (const file of this.files) {
			data.append("files[]", file, file.name);
			size += file.size;
		  }
		  
		  data.append("mediaPath", Vvveb.MediaModal.mediaPath + Vvveb.MediaModal.currentPath);
		  data.append("onlyFilename", true);
		  data.append("size", size);

		  if (typeof uploadMaxFilesize !== "undefined" && uploadMaxFilesize && (size > parseInt(uploadMaxFilesize))) {
			  displayToast("danger", "Error", "File size bigger than upload max file size!", "top");
		  }
		  
		  if (typeof postMaxSize !== "undefined" && postMaxSize && (size > parseInt(postMaxSize))) {
			  displayToast("danger", "Error", "File size bigger than post max size!", "top");
		  }

		  return fetch(uploadUrl, {
			method: "POST",
			body: data,      
		  }).then((response) => {
			if (!response.ok) { return Promise.reject(response); }
			return response.json()
		}).then((response) => {
			  for (const data of response) {
				Vvveb.MediaModal.hideUploadLoading();

				if (data.success) {
					displayToast("success", "Success", data.message, "top");			
				} else {
					displayToast("danger", "Error", data.message, "top");
				}

				if (!data.file) continue;  
				let fileElement = Vvveb.MediaModal.addFile({
					name:data.file,
					size:data.size ?? 0,
					type:"file",
					path: Vvveb.MediaModal.currentPath + "/" + data.file,
				},true);
				
				fileElement.scrollIntoView({behavior: "smooth", block: "center", inline: "center"});
			  }
			  document.querySelector(".nothingfound").style.display = "none";
			})
			.catch(error => {
				let message = error.statusText ?? "Error uploading!";
				Vvveb.MediaModal.hideUploadLoading();						
				displayToast("danger", "Error", message, "top");
				error.text().then( errorMessage => {
					let message = errorMessage.substr(0, 200);
					displayToast("danger", "Error", message, "top");
				});						
			});		
/*
		
			if (this.files && this.files[0]) {
				Vvveb.MediaModal.showUploadLoading();
				let file;
				for (file of this.files) { 
					let reader = new FileReader();
					reader.onload = (e) => imageIsLoaded(e, file);
					reader.readAsDataURL(file);
				}
			}
*/
			function imageIsLoaded(e, file) {
					
					let image = e.target.result;
					
					let formData = new FormData();
					formData.append("file", file);
					formData.append("mediaPath", Vvveb.MediaModal.mediaPath + Vvveb.MediaModal.currentPath);
					formData.append("onlyFilename", true);

					fetch(uploadUrl, {method: "POST",  body: formData})
					.then((response) => {
						if (!response.ok) {
							return Promise.resolve(response.text()).then((responseInText) => {
								return Promise.reject([response, responseInText]);
							});
						}
						return response.json();
					})
					.then((data) => {
						let fileElement = Vvveb.MediaModal.addFile({
							name:data.file,
							type:"file",
							path: Vvveb.MediaModal.currentPath + "/" + data.file,
							size:1
						},true);
						
						fileElement.scrollIntoView({behavior: "smooth", block: "center", inline: "center"});
						
						Vvveb.MediaModal.hideUploadLoading();
	
						if (data.success) {
							displayToast("success", "Success", data.message, "top");			
						} else {
							displayToast("danger", "Error", data.message, "top");
						}
					})
					.catch(error => {
						let [response, responseInText] = error;
						let message = response.statusText ?? "Error uploading!";
						Vvveb.MediaModal.hideUploadLoading();						
						displayToast("danger", "Error uploading!", message.substr(0, 200), "top");
					});		
			}
		}	
	
		deleteFile(el) {
			let parent = el.closest("li");
			let file = parent.querySelector('input[type="hidden"]').value;
			if (confirm(`Are you sure you want to delete "${file}"template?`)) {
				
			fetch(deleteUrl, {method: "POST",  body: new URLSearchParams({file})})
				.then((response) => {
					if (!response.ok) {  return Promise.reject(response);  }
					return response.json();
				})
				.then((data) => {
					let bg = "success";
					if (data.success) {		
					} else {
						//bg = "danger";
					}
					
					displayToast(bg, "Delete", data.message, "top");
					
					parent.remove();	
				})
				.catch(error => {
					console.log(error);
					let message = error.statusText ?? "Error deleting file!";
					displayToast("danger", "Error", message, "top");
					error.text().then( errorMessage => {
						let message = errorMessage.substr(0, 200);
						displayToast("danger", "Error", message, "top");
					});	
				});	
			}
		}

		enableNavigateBtns(media) {
			let nextMedia = media?.nextElementSibling?.closest(".files") ?? false;
			let prevMedia = media?.previousElementSibling?.closest(".files") ?? false; 

			let nextBtn = document.getElementById("next-media");
			let prevBtn = document.getElementById("prev-media");

			if (nextMedia) {
				nextBtn.disabled = false;
			} else {
				nextBtn.disabled = true;
				nextMedia = false;
			}

			if (prevMedia) {
				prevBtn.disabled = false;
			} else {
				prevBtn.disabled = true;
				prevMedia = false;
			}
		}
		
		navigateMedia(media, next = true) {
			let nextMedia = media?.nextElementSibling?.closest(".files") ?? false;
			let prevMedia = media?.previousElementSibling?.closest(".files") ?? false; 

			if (next && nextMedia) {
				this.currentMedia = nextMedia;
			} else if (prevMedia) {
				this.currentMedia = prevMedia;
			}

			this.editMedia(this.currentMedia);
		}
		
		nextMedia(el) {
			this.navigateMedia(this.currentMedia);
		}

		prevMedia(el) {
			this.navigateMedia(this.currentMedia, false);
		}
		
		newFolder(el) {
			let hash = decodeURIComponent(window.location.hash).slice(1).split('=');
			let rendered = this.response;

			if (hash[0].trim().length) {
				rendered = this.searchByPath(hash[0]);
			} else {
				rendered = this.searchByPath(this.response[0].path);
			}
			
			let folder = prompt('Folder name');			
			if (folder) {
				fetch(mediaUrl + "&action=newFolder", {method: "POST",  body: new URLSearchParams({folder, path:Vvveb.MediaModal.currentPath})})
				.then((response) => {
					if (!response.ok) { throw new Error(response) }
					return response.json();
				})
				.then((data) => {
					let bg = "success";
					if (data.success) {		
					} else {
						bg = "danger";
					}
					
					rendered.push({
							name: folder, 
							type: 'folder', 
							path: Vvveb.MediaModal.currentPath + "/" + folder, 
							items: []});
							
					this.render(rendered);
					displayToast(bg, "Save", data.message, "top");
				})
				.catch(error => {
					displayToast("danger", "Error", "Error saving!", "top");
				});	
			}
		}
		
		editMedia(el) {
			let parent = el.closest("li");
			let offcanvas = document.getElementById("media-offcanvas");
			let file = parent.querySelector('input[type="hidden"]').value;
			//if (this.currentMedia == parent) return;
			this.currentMedia = parent;
			this.enableNavigateBtns(parent);

			//let image = parent.querySelector('img.image').getAttribute("src");
			//let newfile = prompt(`Enter new file name for "${file}"`, file);
			
			let img = offcanvas.querySelector("img");
			let video = offcanvas.querySelector("video");
			offcanvas.querySelector("[name=file]").value = file;

			if (isVideo(file)) {
				video.setAttribute("src", mediaPath  + file);
				video.style.display = "";
				img.style.display = "none";
			} else {
				img.setAttribute("src", mediaPath  + file);
				img.style.display = "";
				video.style.display = "none";
			}

			//if (newfile) {
				fetch(mediaUrl + "&action=mediaContent&" + new URLSearchParams({file}))
				.then((response) => {
					if (!response.ok) { throw new Error(response) }
					return response.json();
				})
				.then((data) => {
					//clear previous text
					document.querySelectorAll("[data-v-languages] input[type=text], [data-v-languages] textarea").forEach(i => i.value = "");
					
					for (const lang of data) {
						let language_id = lang["language_id"];
						
						for (const field of ['name', 'caption', 'description', 'language_id']) {
							let name = `media_content[${language_id}][${field}]`;
							let input = offcanvas.querySelector(`[name="${name}"]`);
							if (input) {
								input.value = lang[field] ?? "";
							}
						}
					}
				})
				.catch(error => {
					displayToast("danger", "Error", "Error loading media content!", "top");
				});	
			//}
		}		
		
		saveMediaContent(el) {
			let offcanvas = document.getElementById("media-offcanvas");
			let saveBtn = offcanvas.querySelector('.save-btn');
			let loading = saveBtn.querySelector('.loading');
			let btnText = saveBtn.querySelector('.button-text');
			
			loading.classList.toggle("d-none");
			btnText.classList.toggle("d-none");

			fetch(mediaUrl + "&action=mediaContentSave", {method: "POST",  body:  new FormData(document.getElementById("media-content-form"))})
			.then((response) => {
				if (!response.ok) { throw new Error(response) }
				return response.json();
			})
			.then((data) => {
				let bg = "success";
				if (data.success) {		
				} else {
					bg = "danger";
				}
				
				displayToast(bg, "Save", data.message ?? data, "top");

				loading.classList.toggle("d-none");
				btnText.classList.toggle("d-none");
			})
			.catch(error => {
				displayToast("danger", "Error", "Error saving!", "top");
				loading.classList.toggle("d-none");
				btnText.classList.toggle("d-none");
			});	
		}
		
		addFile(f, selected) {
				let _this= this;
				let isImage = false;
				let actions = '';
				
				let fileSize = _this.bytesToSize(f.size),
						name = _this.escapeHTML(f.name),
						fileType = name.split('.').pop(),
						icon = '<span class="icon file"></span>';

					if (fileType == "jpg" || fileType == "jpeg" || fileType == "png" || fileType == "gif" || fileType == "svg" || fileType == "webp" || fileType == "heic" || fileType == "heif") {
						//icon = '<div class="image" style="background-image: url(' + _this.mediaPath + f.path + ');"></div>';
						icon = '<img class="image" loading="lazy" src="' + _this.mediaPath + f.path + '">';
						isImage = true;
					} else {
						icon = '<span class="icon file f-'+fileType+'">.'+fileType+'</span>';
					}
				
					if (!this.isModal) {
						actions = `<a href="javascript:void(0);" title="Rename" class="btn btn-outline-primary btn-sm btn-rename py-0 border-secondary border-opacity-25" 
								data-bs-toggle="offcanvas" aria-expanded="false" data-bs-target="#media-offcanvas" aria-controls="media-offcanvas" data-bs-reference="parent">
								  <i class="la la-pen"></i>
								</a>
								<a href="javascript:void(0);" title="Delete" class="btn btn-outline-danger btn-sm btn-delete py-0 border-secondary border-opacity-25">
								  <i class="la la-trash"></i>
								</a>`;
					} else {
					}

				let detail = { file: _this.mediaPath + f.path, name, fileType, fileSize, isImage, fileType, actions };
				const event = new CustomEvent("mediaModal:fileActions", {detail});
				window.dispatchEvent(event);			

				if (isImage && this.isModal) detail.actions += '<a href="javascript:void(0);" class="preview-link p-2"><i class="la la-search-plus"></i></a>';
				
				let file = generateElements('<li class="files">\
						<label class="form-check">\
						<input type="hidden" value="' + f.path + '" name="filename[]">\
						  <input type="' + ((_this.type == "single") ? "radio" : "checkbox") + '" class="form-check-input" value="' + f.path + '" name="file[]" ' + ((selected == "single") ? "checked" : "") + '><span class="form-check-label"></span>\
						  <div href="#\" class="files">'+icon+'<div class="info"><div class="name">'+ name +'</div><span class="details">'+fileSize+'</span>\
							' + detail.actions + '\
							 <div class="preview">\
								<img src="' + _this.mediaPath + f.path + '">\
								<div>\
									<span class="name">'+ name +'</span><span class="details">'+fileSize+'</span>\
								</div>\
							</div>\
						  </div>\
						</label>\
					</li>')[0];
				
				_this.fileList.append(file);

				if (selected) {
					file.querySelector("input[type='radio'], input[type='checkbox']").checked = true;
				}
				
				return file;
		}


		addFolder(f) {
			let itemsLength = f.items.length,
				name = this.escapeHTML(f.name),
				icon = '<span class="icon folder"></span>';

			if(itemsLength) {
				icon = '<span class="icon folder full"></span>';
			}

			if(itemsLength == 1) {
				itemsLength += ' item';
			}
			else if(itemsLength > 1) {
				itemsLength += ' items';
			}
			else {
				itemsLength = 'Empty';
			}

			let folder = generateElements('<li class="folders"><a href="'+ f.path +'" title="'+ f.path +'" class="folders">'+icon+'<div class="info"><span class="name">' + name + '</span> <span class="details">' + itemsLength + '</span></div></a></li>')[0];
			this.fileList.append(folder);
			
			return folder;
		}
		
		render(data) {

			let scannedFolders = [],
				scannedFiles = [];

			if(Array.isArray(data)) {

				data.forEach(function (d) {

					if (d.type === 'folder') {
						scannedFolders.push(d);
					}
					else if (d.type === 'file') {
						scannedFiles.push(d);
					}

				});

			}
			else if(typeof data === 'object') {

				scannedFolders = data.folders;
				scannedFiles = data.files;

			}


			// Empty the old result and make the new one

			this.fileList.replaceChildren();//.style.display = 'none';
			if(!scannedFolders.length && !scannedFiles.length) {
				this.filemanager.querySelector('.nothingfound').style.display = '';
			}
			else {
				this.filemanager.querySelector('.nothingfound').style.display = 'none';
			}

			let _this = this;
			
			if(scannedFolders.length) {

				scannedFolders.forEach(function(f) {
					_this.addFolder(f);
				});

			}

			if(scannedFiles.length) {

				scannedFiles.forEach(function(f) {

					_this.addFile(f);
					
				});

			}


			// Generate the breadcrumbs

			let url = '';

			if(this.filemanager.classList.contains('searching')){

				url = '<span>Search results: </span>';
				this.fileList.classList.remove('animated');

			}
			else {

				this.fileList.classList.add('animated');

				this.breadcrumbsUrls.forEach(function (u, i) {

					let name = u.split('/');

					if (i !== _this.breadcrumbsUrls.length - 1) {
						url += '<a href="'+u+'"><span class="folderName">' + name[name.length-1] + '</span></a> <span class="arrow">→</span> ';
					}
					else {
						url += '<span class="folderName">' + name[name.length-1] + '</span>';
					}

				});

			}

			this.breadcrumbs.replaceChildren();
			this.breadcrumbs.appendChild(generateElements('<a href="/"><i class="la la-home"></i><span class="folderName">&ensp;home</span></a>')[0]);
			this.breadcrumbs.appendChild(generateElements('<span>' + url + '</span>')[0]);
			
			// Show the generated elements

			this.fileList.animate({'display':'inline-block'});

		}


		// This function escapes special html characters in names

		escapeHTML(text) {
			return text.replace(/\&/g,'&amp;').replace(/\</g,'&lt;').replace(/\>/g,'&gt;');
		}


		// Convert file sizes from bytes to human readable units

		bytesToSize(bytes) {
			let sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
			if (bytes == 0) return '0 Bytes';
			let i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
			return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
		}	
}
/*
export {
  MediaModal
}
*/
