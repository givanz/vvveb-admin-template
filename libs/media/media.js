/**
 * Media library browser / uploader.
 *
 * Used in two modes:
 *  - modal      : media picker dialog injected into any admin page (`new MediaModal(true)`)
 *  - non-modal  : standalone media page (`new MediaModal(false)`), adds per-file
 *                 rename/delete actions and an editing offcanvas.
 *
 * Global functions exposed (plain script, no bundler):
 *   ucFirst, fileExtension, isVideo, clearMedia, videoExtensions, MediaModal
 *
 * Globals expected to be defined by the host page before this file loads:
 *   mediaPath, mediaScanUrl, uploadUrl, deleteUrl, renameUrl, mediaUrl
 *   uploadMaxFilesize, postMaxSize (optional size limits in bytes)
 *
 * Also relies on generateElements(), displayToast() and Bootstrap 5.
 */
(function () {
	'use strict';

	function ucFirst(str) {
		if (!str) return str;

		return str[0].toUpperCase() + str.slice(1);
	}

	function fileExtension(filename) {
		return filename.split('.').pop();
	}

	let videoExtensions = ['mp4', 'webm', 'mov', 'ogg', 'mkv', 'flv', 'avi', '3gp', 'mpg', 'mpeg'];

	function isVideo(filename) {
		return videoExtensions.includes(fileExtension(filename));
	}

	const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'heic', 'heif'];

	// items per folder page: every listing response stays bounded,
	// further pages append via infinite scroll (setupPaging/loadMore)
	const MEDIA_PAGE_SIZE = 100;

	function clearMedia(id = "featured-image") {
		document.getElementById(id + "-input").value = "";
		document.getElementById(id + "-thumb").setAttribute("src", "../media/placeholder.svg");
	}

	class MediaModal {
		constructor(modal = true) {
			this.isInit = false;
			this.isModal = modal;

			this.modalHtml =
				`
		<div class="modal fade modal-full" id="MediaModal" tabindex="-1" role="dialog" aria-labelledby="MediaModalLabel" aria-hidden="true">
		  <div class="modal-dialog modal-xl modal-dialog-scrollable" role="document">
			<div class="modal-content">
			  <div class="modal-header">
				<h6 class="modal-title fw-normal" id="MediaModalLabel">Media</h6>

				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
				  <!-- <span aria-hidden="true"><svg class="svg-icon la-lg" aria-hidden="true"><use href="/admin/default/img/icons.svg#x"></use></svg></span> -->
				</button>
			  </div>
			  <div class="modal-body">

                      <div class="filemanager">

						<div class="top-right d-flex justify-content-between">

                            <div class="align-left">          
								<div class="breadcrumbs"></div>
							</div>


							<div class="align-right">  
								<div class="search">
									<input type="search" class="form-control" id="media-search-input" placeholder="Find a file.." />
								</div>

								<button class="btn btn-outline-secondary btn-sm btn-icon me-1" 
								   data-bs-toggle="collapse"
								   data-bs-target=".upload-collapse"
								   aria-expanded="false"
								   >
								   <svg class="svg-icon la-lg" aria-hidden="true"><use href="/admin/default/img/icons.svg#upload"></use></svg>
									Upload file
								</button>								
								
								<button class="btn btn-outline-secondary btn-sm btn-icon btn-new-folder">
								   <svg class="svg-icon la-lg" aria-hidden="true" style="transform: rotate(270deg);"><use href="/admin/default/img/icons.svg#folder"></use></svg>
									New folder
								</button>
							</div>

						</div>

						<div class="top-panel">

							<div class="upload-collapse collapse">

								<button id="upload-close" type="button" class="btn btn-sm" aria-label="Close" data-bs-toggle="collapse" data-bs-target=".upload-collapse" aria-expanded="true">
								   <span aria-hidden="true"><svg class="svg-icon la-lg" aria-hidden="true"><use href="/admin/default/img/icons.svg#x"></use></svg></span>
								</button>

							   <h4>Drop or choose files to upload</h4>

							   <input type="file" multiple> 

								<div class="status"></div>
							</div>


						</div>

						<div class="display-panel">

							<ul class="data" id="media-files"></ul>

							<div class="nothingfound" style="display:none">
								<div class="nofiles">
									<svg class="svg-icon" aria-hidden="true"><use href="/admin/default/img/icons.svg#folder-open"></use></svg>
								</div>
								<div>No files here.</div>
								<div class="mt-4">
									<button class="btn btn-outline-secondary btn-sm btn-icon" data-bs-toggle="collapse" data-bs-target=".upload-collapse" aria-expanded="false">
									<svg class="svg-icon la-lg" aria-hidden="true"><use href="/admin/default/img/icons.svg#upload"></use></svg>
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
						<svg class="svg-icon" aria-hidden="true"><use href="/admin/default/img/icons.svg#x"></use></svg>
						<span>Cancel</span>
					</button>
					<button type="button" class="btn btn-primary btn-icon save-btn">
						<svg class="svg-icon" aria-hidden="true"><use href="/admin/default/img/icons.svg#plus"></use></svg>
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
			mediaPath = mediaPath + "/";
			this.mediaPath = mediaPath;
			this.type = "single";
			this.currentMedia;

			// Cached element lookups, populated in initGallery()
			this.searchInput = null;
			this.nothingFound = null;
		}

		getResponse() {
			return this.response;
		}

		setResponse(response) {
			this.response = response;
			this.currentPath = '',
			this.breadcrumbsUrls = [];
		}

		/* ------------------------------------------------------------------
		 * Helpers
		 * ------------------------------------------------------------------ */

		/**
		 * POST a FormData object and parse the JSON response.
		 * Rejects with an Error whose message is extracted from the response body
		 * when the server answers with a non-2xx status.
		 */
		request(url, options = {}) {
			return fetch(url, options)
				.then((response) => {
					if (!response.ok) {
						return response.text().then((text) => {
							let message = text.trim() || response.statusText || 'Request error';

							return Promise.reject(new Error(message.slice(0, 200)));
						});
					}

					return response.json();
				});
		}

		postForm(url, formData) {
			formData.append("csrf", document.querySelector("[name='csrf']")?.value);

			return this.request(url, {method: "POST", body: formData});
		}

		toastError(error, fallbackMessage) {
			displayToast("danger", "Error", error?.message ?? fallbackMessage, "top");
		}

		csrfToken() {
			return document.querySelector("[name='csrf']")?.value;
		}

		addModalHtml() {
			if (this.isModal) {
				document.body.append(generateElements(this.modalHtml)[0]);
				document.querySelector("#MediaModal .save-btn").addEventListener("click", () => this.save());
			}
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

		hideModal() {
			if (this.isModal) {
				bootstrap.Modal.getOrCreateInstance(document.getElementById('MediaModal')).hide();
			}
		}

		/* ------------------------------------------------------------------
		 * Selection (modal footer "Add selected")
		 * ------------------------------------------------------------------ */

		save() {
			let files = [];
			let file = "";
			let src = "";

			if (this.type == "single") {
				file = document.querySelector("#MediaModal .files input:checked")?.value ?? false;

				if (!file) return;

				src = this.absolutePath(file);
				files.push(file);

				if (this.targetThumb) {
					document.querySelector(this.targetThumb)?.setAttribute("src", src);
				}
			} else {
				document.querySelectorAll("#MediaModal .files input:checked").forEach((e) => {
					files.push(e.value);
					file += e.value + ",";
					src += this.absolutePath(e.value) + ",";
				});
			}

			if (this.callback) {
				this.callback(src, file, files);
			}

			if (this.targetInput) {
				let input = document.querySelector(this.targetInput);

				if (input) {
					input.value = file;

					input.dispatchEvent(new Event("change", {bubbles: true}));
				}
			}

			document.querySelectorAll("#MediaModal .files input:checked").forEach((e) => e.checked = false);

			this.hideModal();
		}

		absolutePath(file) {
			return (file.indexOf("//") == -1) ? this.mediaPath + file : file;
		}

		/* ------------------------------------------------------------------
		 * Init / open
		 * ------------------------------------------------------------------ */

		init() {
			if (this.isInit) return;

			if (this.isModal) this.addModalHtml();

			this.initGallery();

			this.isInit = true;

			document.querySelector(".filemanager input[type=file]").addEventListener("change", (e) => this.onUpload(e));

			document.getElementById("bulk-delete")?.addEventListener("click", () => this.deleteFile());

			// Delegated handler for the toolbar buttons rendered on the media page
			// (.btn-new-folder lives in the top bar, outside the file list).
			document.querySelector(".filemanager").addEventListener("click", (e) => {
				let element = e.target.closest(".btn-new-folder");

				if (element) {
					e.preventDefault();

					this.newFolder(element);
				}
			});

			// Delegated handler for the media editing offcanvas (non-modal mode).
			document.querySelector("#media-offcanvas")?.addEventListener("click", (e) => {
				let element = e.target.closest(".save-btn");

				if (element) {
					this.saveMediaContent(element);

					return;
				}

				element = e.target.closest("#next-media");

				if (element) {
					this.nextMedia(element);

					return;
				}

				element = e.target.closest("#prev-media");

				if (element) {
					this.prevMedia(element);
				}
			});

			const event = new CustomEvent("mediaModal:init", {detail: {type: this.type, targetInput: this.targetInput, targetThumb: this.targetThumb, callback: this.callback}});
			window.dispatchEvent(event);
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
				document.querySelectorAll("#MediaModal .files input[type=checkbox]").forEach((e) => e.setAttribute("type", "radio"));
			} else {
				document.querySelectorAll("#MediaModal .files input[type=radio]").forEach((e) => e.setAttribute("type", "checkbox"));
			}

			if (this.isModal) {
				bootstrap.Modal.getOrCreateInstance(document.getElementById('MediaModal')).show();
			}
		}

		/* ------------------------------------------------------------------
		 * Gallery browsing
		 * ------------------------------------------------------------------ */

		initGallery() {
			this.filemanager = document.querySelector('.filemanager');
			this.breadcrumbs = document.querySelector('.breadcrumbs');
			this.fileList = this.filemanager.querySelector('.data');
			this.searchInput = this.filemanager.querySelector('input[type=search]');
			this.nothingFound = this.filemanager.querySelector('.nothingfound');

			// Fetch just the root level, then render the folder matching the
			// current hash (deeper levels lazy-load on navigation).
			fetch(this.scanUrl('', 1))
				.then((response) => {
					if (!response.ok) {
						throw new Error(response.statusText);
					}

					return response.json();
				})
				.then((data) => {
					this.setResponse([data]);

					// Render the correct folder on page load.
					this.goto(window.location.hash);
				})
				.catch(() => {
					displayToast("danger", "Error", "Error loading media!", "top");
				});

			// Monitor URL hash changes to capture back/forward navigation.
			window.addEventListener('hashchange', () => this.goto(window.location.hash));

			this.initSearch();
			this.initListNavigation();
			this.initBreadcrumbsNavigation();
		}

		initSearch() {
			let search = this.searchInput;
			let spans = this.filemanager.querySelectorAll('.search span');

			// Hiding and showing the search box
			this.filemanager.querySelector('.search').addEventListener("click", function(e) {
				spans.forEach(function(el) {
					el.style.display = "none";
				});
				search.style.display = "block";
				search.focus();
			});

			// Listening for keyboard input on the search field.
			// We are using the "input" event which detects cut and paste
			// in addition to keyboard input.
			search.addEventListener('input', function(e) {
				let value = this.value.trim();

				if (value.length) {
					this.filemanager.classList.add('searching');

					// Update the hash on every key stroke
					window.location.hash = 'search=' + value;
				} else {
					this.filemanager.classList.remove('searching');
					window.location.hash = encodeURIComponent(this.currentPath);
				}
			});

			search.addEventListener('keyup', function(e) {
				// Pressing 'ESC' cancels the search
				if (e.key === 'Escape') {
					search.dispatchEvent(new FocusEvent('focusout'));
				}
			});

			search.addEventListener("focusout", () => {
				// Cancel the search
				if (!search.value.trim().length) {
					window.location.hash = encodeURIComponent(this.currentPath);
					search.style.display = 'none';
					spans.forEach((el) => el.style.display = '');
				}
			});
		}

		initListNavigation() {
			// Clicking on files / folders / their action buttons
			this.fileList.addEventListener('click', (e) => {
				let el = e.target.closest(".btn-delete");

				if (el) {
					e.preventDefault();

					this.deleteFile(el);

					return;
				}

				el = e.target.closest(".btn-rename");

				if (el) {
					this.editMedia(el);
					e.preventDefault();
					e.stopImmediatePropagation();

					return;
				}

				el = e.target.closest('li.folders');

				if (el) {
					e.preventDefault();

					let nextDir = el.querySelector('a').getAttribute('href');

					if (this.filemanager.classList.contains('searching')) {

						// Rebuild the breadcrumbs and leave search mode
						this.breadcrumbsUrls = this.generateBreadcrumbs(nextDir);
						this.filemanager.classList.remove('searching');

						let search = this.searchInput;
						search.value = '';
						search.style.display = 'none';
						this.filemanager.querySelectorAll('.search span').forEach((el) => el.style.display = '');
					} else {
						this.breadcrumbsUrls.push(nextDir);
					}

					window.location.hash = encodeURIComponent(nextDir);
					this.currentPath = nextDir;
				}
			});
		}

		initBreadcrumbsNavigation() {
			// Clicking on breadcrumbs
			this.breadcrumbs.addEventListener('click', (e) => {
				let el = e.target.closest('a');

				if (!el) return;

				e.preventDefault();

				let nextDir = el.getAttribute("href");
				let index = [...el.parentNode.children].indexOf(el);

				this.breadcrumbsUrls.length = Number(index);
				window.location.hash = encodeURIComponent(nextDir);
			});
		}

		/* ------------------------------------------------------------------
		 * Hash routing
		 * ------------------------------------------------------------------ */

		// Navigates to the given hash (path or search term). Folder levels
		// fetch on demand - only the current path's ancestors are loaded.
		goto(hash) {
			hash = decodeURIComponent(hash ?? '').slice(1).split('=');

			if (!hash.length) return;

			// hash contains a search term (debounced server-side search)
			if (hash[0] === 'search') {
				this.filemanager.classList.add('searching');

				let searchTerm = (hash[1] ?? '').trim();

				clearTimeout(this._searchTimer);
				this._searchTimer = setTimeout(() => {
					const token = (this._navToken = (this._navToken || 0) + 1);
					this.showListLoading();

					this.fetchSearch(searchTerm).then((data) => {
						if (token !== this._navToken) return;
						this.render(data);
						this.currentPath = searchTerm ? hash[0] : '';
					}).catch((error) => {
						if (token !== this._navToken) return;
						this.toastError(error, 'Error searching media!');
					});
				}, searchTerm ? 250 : 0);

				return;
			}

			// hash contains a path - fetch unloaded levels, then render
			if (hash[0].trim().length) {
				const token = (this._navToken = (this._navToken || 0) + 1);
				this.showListLoading();

				this.ensurePathLoaded(hash[0]).then((items) => {
					if (token !== this._navToken) return;
					this.currentPath = hash[0];
					this.breadcrumbsUrls = this.generateBreadcrumbs(hash[0]);
					this.render(items);
					const node = this.findNode(hash[0]);
					this.setupPaging(hash[0], items.length, node && node.total);
				}).catch((error) => {
					if (token !== this._navToken) return;
					this.toastError(error, 'Error loading folder!');
				});

				return;
			}

			// empty hash, show the root folder (fetched at init)
			if (this.response[0]) {
				this.currentPath = this.response[0].path;
				this.breadcrumbsUrls.push(this.response[0].path);
				const rootItems = Array.isArray(this.response[0].items) ? this.response[0].items : [];
				this.render(rootItems);
				this.setupPaging('', rootItems.length, this.response[0].total);
			}
		}

		// Build a scan url: levels=1 lists one folder, deeper folders arrive
		// with items=null; extra carries search or other list params.
		scanUrl(path, levels, extra = {}) {
			let url = mediaScanUrl + '&levels=' + levels + '&path=' + encodeURIComponent(path);
			for (const [k, v] of Object.entries(extra)) url += '&' + k + '=' + encodeURIComponent(v);
			return url;
		}

		fetchPath(path, levels = 1, start = 0, limit = MEDIA_PAGE_SIZE) {
			return this.request(this.scanUrl(path, levels, {start, limit}));
		}

		fetchSearch(term) {
			return this.request(this.scanUrl('', 1, {search: term}));
		}

		// Find a cached folder node by root-relative path ('/a/b'), or null.
		findNode(path) {
			const segs = String(path || '').split('/').filter(Boolean);
			let node = this.response[0];
			if (!node) return null;
			for (const seg of segs) {
				const kids = Array.isArray(node.items) ? node.items : [];
				node = kids.find(d => d && d.type === 'folder' && d.name === seg);
				if (!node) return null;
			}
			return node;
		}

		// Fetch every unloaded level along path, then return its items.
		// Levels already in cache cost no request.
		async ensurePathLoaded(path) {
			const segs = String(path || '').split('/').filter(Boolean);
			let node = this.response[0];
			if (!node) throw new Error('Media library not loaded');
			const acc = [];
			for (const seg of segs) {
				acc.push(seg);
				const kids = Array.isArray(node.items) ? node.items : [];
				const next = kids.find(d => d && d.type === 'folder' && d.name === seg);
				if (!next) throw new Error('Folder not found: /' + acc.join('/'));
				if (!Array.isArray(next.items)) {
					const data = await this.fetchPath('/' + acc.join('/'), 1);
					next.items = Array.isArray(data.items) ? data.items : [];
					if (typeof data.total === 'number') next.total = data.total;
				}
				node = next;
			}
			return Array.isArray(node.items) ? node.items : [];
		}

		showListLoading() {
			try { this.disconnectPaging(); } catch (e) {}
			this.nothingFound.style.display = 'none';
			this.fileList.innerHTML = '<li class="w-100 text-center py-5"><span class="spinner-border" role="status"></span></li>';
		}

		// Drop a folder's cached children so the next visit re-fetches server
		// truth (used after upload/rename/delete/new-folder). Also drops its
		// paging state: counts after a mutation are stale by definition.
		invalidatePath(path) {
			try {
				const node = this.findNode(path);
				if (node && node !== this.response[0]) node.items = null;
			} catch (e) {}
			try {
				if (this._pageState && this._pageState.path === path) this.disconnectPaging();
			} catch (e) {}
		}

		// Arm infinite scroll when the folder holds more than rendered.
		// Paging state is intentionally ephemeral (not in the hash): leaving
		// the folder restarts at page 1 from fresh server truth.
		setupPaging(path, offset, total) {
			this.disconnectPaging();
			if (!(typeof total === 'number' && total > offset)) return;
			this._pageState = {path, offset, total, loading: false};
			this.armSentinel();
		}

		armSentinel() {
			const st = this._pageState;
			if (!st || st.offset >= st.total) return;
			const btn = generateElements(`<li class="vv-page-more w-100 text-center py-3"><button type="button" class="btn btn-outline-secondary btn-sm">Show more (${st.offset} of ${st.total})</button></li>`)[0];
			btn.querySelector('button').addEventListener('click', () => this.loadMore());
			this.fileList.append(btn);
			if ('IntersectionObserver' in window) {
				try {
					this._pageObserver = new IntersectionObserver((entries) => {
						if (entries.some(e => e.isIntersecting)) this.loadMore();
					}, {rootMargin: '400px'});
					this._pageObserver.observe(btn);
				} catch (e) {}
			}
		}

		disconnectPaging() {
			try { this._pageObserver && this._pageObserver.disconnect(); } catch (e) {}
			this._pageObserver = null;
			try {
				const s = this.fileList && this.fileList.querySelector('.vv-page-more');
				if (s) s.remove();
			} catch (e) {}
			this._pageState = null;
		}

		async loadMore() {
			const st = this._pageState;
			if (!st || st.loading || st.offset >= st.total || st.path !== this.currentPath) return;
			st.loading = true;
			const oldBtn = this.fileList.querySelector('.vv-page-more');
			if (oldBtn) oldBtn.remove();
			try {
				const data = await this.fetchPath(st.path, 1, st.offset, MEDIA_PAGE_SIZE);
				if (this._pageState !== st || st.path !== this.currentPath) return;
				const items = Array.isArray(data.items) ? data.items : [];
				items.forEach(f => { f.type === 'folder' ? this.addFolder(f) : this.addFile(f); });
				if (typeof data.total === 'number') st.total = data.total;
				st.offset += items.length;
				st.loading = false;
				if (st.offset < st.total && items.length) this.armSentinel();
				else if (this._pageState === st) this._pageState = null;
			} catch (error) {
				st.loading = false;
				this.toastError(error, 'Error loading more files!');
				if (this._pageState === st) this.armSentinel();
			}
		}

		// Splits a file path and turns it into clickable breadcrumbs
		generateBreadcrumbs(nextDir) {
			let path = nextDir.split('/').slice(0);

			for (let i = 1; i < path.length; i++) {
				path[i] = path[i - 1] + '/' + path[i];
			}

			return path;
		}

		// Locates a folder/file list by path
		searchByPath(dir) {
			let path = dir.split('/'),
				items = this.response;

			for (let i = 0; i < path.length; i++) {
				for (let j = 0; j < (items || []).length; j++) {
					if (items[j].name === path[i]) {
						items = Array.isArray(items[j].items) ? items[j].items : [];

						break;
					}
				}
			}

			return items;
		}

		/* ------------------------------------------------------------------
		 * Upload
		 * ------------------------------------------------------------------ */

		onUpload(event) {
			const data = new FormData();
			let size = 0;

			for (const file of event.target.files) {
				data.append("files[]", file, file.name);
				size += file.size;
			}

			data.append("mediaPath", this.mediaPath + this.currentPath);
			data.append("onlyFilename", true);
			data.append("size", size);
			data.append("csrf", this.csrfToken());

			// Size limits arrive from the server as strings, skip when unset
			if (typeof uploadMaxFilesize !== "undefined" && uploadMaxFilesize && (size > parseInt(uploadMaxFilesize))) {
				displayToast("danger", "Error", "File size bigger than upload max file size!", "top");
			}

			if (typeof postMaxSize !== "undefined" && postMaxSize && (size > parseInt(postMaxSize))) {
				displayToast("danger", "Error", "File size bigger than post max size!", "top");
			}

			fetch(uploadUrl, {
				method: "POST",
				body: data,
			})
				.then((response) => {
					if (!response.ok) {
						return response.text().then((text) => Promise.reject(new Error(text.slice(0, 200) || response.statusText)));
					}

					return response.json();
				})
				.then((response) => {
					for (const data of response) {
						this.hideUploadLoading();

						if (data.success) {
							displayToast("success", "Success", data.message, "top");
						} else {
							displayToast("danger", "Error", data.message, "top");
						}

						if (!data.file) continue;

						let fileElement = this.addFile({
							name: data.file,
							size: data.size ?? 0,
							type: "file",
							path: this.currentPath + "/" + data.file,
						}, true);

						fileElement.scrollIntoView({behavior: "smooth", block: "center", inline: "center"});
					}

					this.nothingFound.style.display = "none";
					this.invalidatePath(this.currentPath);
				})
				.catch((error) => {
					this.hideUploadLoading();
					this.toastError(error, "Error uploading!");
				});
		}

		/* ------------------------------------------------------------------
		 * File operations
		 * ------------------------------------------------------------------ */

		deleteFile(el = null) {
			let parent, file, message;

			if (el) {
				parent = el.closest("li");
				file = parent.querySelector('input[type="hidden"]').value;
				message = `Are you sure you want to delete "${file}"?`;
			} else {
				file = [];
				parent = [];

				document.querySelectorAll('input[type="checkbox"][name="file[]"]:checked').forEach((e) => {
					file.push(e.value);
					parent.push(e.closest("li"));
				});

				if (!file.length) {
					alert("No files selected!");

					return;
				}

				message = "Are you sure you want to delete selected files?";
			}

			if (!confirm(message)) return;

			const data = new FormData();

			if (Array.isArray(parent)) {
				for (const f of file) data.append("file[]", f);
			} else {
				data.append("file", file);
			}

			this.postForm(deleteUrl, data)
				.then((data) => {
					let bg = "success";

					if (data.success) {
						if (Array.isArray(parent)) {
							for (const e of parent) e.remove();
						} else {
							parent.remove();
						}
						this.invalidatePath(this.currentPath);
					} else {
						bg = "danger";
					}

					displayToast(bg, "Delete", data.message, "top");
				})
				.catch((error) => {
					this.toastError(error, "Error deleting file!");
				});
		}

		newFolder(el) {
			let hash = decodeURIComponent(window.location.hash).slice(1).split('=');
			let rendered;

			if (hash[0].trim().length) {
				rendered = this.searchByPath(hash[0]);
			} else {
				rendered = this.searchByPath(this.response[0]?.path ?? '');
			}

			let folder = prompt('Folder name');

			if (!folder) return;

			const data = new FormData();
			data.append("folder", folder);
			data.append("path", this.currentPath);

			this.postForm(mediaUrl + "&action=newFolder", data)
				.then((data) => {
					let bg = data.success ? "success" : "danger";

					rendered.push({
						name: folder,
						type: 'folder',
						path: this.currentPath + "/" + folder,
						items: []
					});

					this.render(rendered);
					this.invalidatePath(this.currentPath);
					displayToast(bg, "Save", data.message, "top");
				})
				.catch(() => {
					displayToast("danger", "Error", "Error saving!", "top");
				});
		}

		renameFile(file, newName) {
			const data = new FormData();
			data.append("file", file);
			data.append("newname", newName);

			return this.postForm(renameUrl, data);
		}

		editMedia(el) {
			let parent = el.closest("li");
			let file = parent.querySelector('input[type="hidden"]').value;
			let name = parent.querySelector('.name');

			//folder - rename through a prompt
			if (parent.classList.contains("folders")) {
				let folder = prompt('Folder name', name.innerText);

				if (folder) {
					this.renameFile(file, folder)
						.then((data) => {
							if (data.success) {
								name.innerText = folder;
								this.invalidatePath(this.currentPath);

								displayToast("success", "Rename", data.message, "top");
							} else {
								displayToast("danger", "Rename", data.message, "top");
							}
						})
						.catch((error) => {
							this.toastError(error, "Error renaming file!");
						});
				}

				return;
			}

			//file - load it into the editing offcanvas
			let offcanvas = document.getElementById("media-offcanvas");

			if (!offcanvas) return;

			this.currentMedia = parent;
			this.enableNavigateBtns(parent);

			let img = offcanvas.querySelector("img");
			let video = offcanvas.querySelector("video");

			offcanvas.querySelector("[name=file]").value = file;

			if (isVideo(file)) {
				video.setAttribute("src", this.mediaPath + file);
				video.style.display = "";
				img.style.display = "none";
			} else {
				img.setAttribute("src", this.mediaPath + file);
				img.style.display = "";
				video.style.display = "none";
			}

			this.request(mediaUrl + "&action=mediaContent&" + new URLSearchParams({file}))
				.then((data) => {
					//clear previous text
					document.querySelectorAll("[data-v-languages] input[type=text], [data-v-languages] textarea").forEach((i) => i.value = "");

					for (const lang of data) {
						let language_id = lang["language_id"];

						for (const field of ['name', 'caption', 'description', 'language_id']) {
							let input = offcanvas.querySelector(`[name="media_content[${language_id}][${field}]"]`);

							if (input) {
								input.value = lang[field] ?? "";
							}
						}
					}
				})
				.catch(() => {
					displayToast("danger", "Error", "Error loading media content!", "top");
				});
		}

		saveMediaContent(el) {
			let offcanvas = document.getElementById("media-offcanvas");
			let saveBtn = offcanvas.querySelector('.save-btn');
			let loading = saveBtn.querySelector('.loading');
			let btnText = saveBtn.querySelector('.button-text');

			loading.classList.toggle("d-none");
			btnText.classList.toggle("d-none");

			const data = new FormData(document.getElementById("media-content-form"));

			this.postForm(mediaUrl + "&action=mediaContentSave", data)
				.then((data) => {
					let bg = data.success ? "success" : "danger";

					displayToast(bg, "Save", data.message ?? data, "top");

					loading.classList.toggle("d-none");
					btnText.classList.toggle("d-none");
				})
				.catch(() => {
					displayToast("danger", "Error", "Error saving!", "top");
					loading.classList.toggle("d-none");
					btnText.classList.toggle("d-none");
				});
		}

		/* ------------------------------------------------------------------
		 * Navigation between media items (offcanvas prev/next)
		 * ------------------------------------------------------------------ */

		setNavigateBtnState(btn, enabled) {
			if (btn) btn.disabled = !enabled;
		}

		navigateMedia(media, next = true) {
			let sibling = next
				? media?.nextElementSibling?.closest(".files")
				: media?.previousElementSibling?.closest(".files");

			if (sibling) {
				this.currentMedia = sibling;
				this.editMedia(this.currentMedia);
			}
		}

		nextMedia(el) {
			this.navigateMedia(this.currentMedia);
		}

		prevMedia(el) {
			this.navigateMedia(this.currentMedia, false);
		}

		updateNavigateBtns(media) {
			let hasNext = !!media?.nextElementSibling?.closest(".files");
			let hasPrev = !!media?.previousElementSibling?.closest(".files");

			this.setNavigateBtnState(document.getElementById("next-media"), hasNext);
			this.setNavigateBtnState(document.getElementById("prev-media"), hasPrev);
		}

		enableNavigateBtns(media) {
			this.updateNavigateBtns(media);
		}

		/* ------------------------------------------------------------------
		 * Rendering
		 * ------------------------------------------------------------------ */

		fileActionsHtml(f, fileType, isImage) {
			if (this.isModal) return '';

			return `<a href="javascript:void(0);" title="Rename" class="btn btn-outline-primary btn-sm btn-rename py-0 border-secondary border-opacity-25"
						data-bs-toggle="offcanvas" aria-expanded="false" data-bs-target="#media-offcanvas" aria-controls="media-offcanvas" data-bs-reference="parent">
						  <svg class="svg-icon" aria-hidden="true"><use href="/admin/default/img/icons.svg#ballpen"></use></svg>
						</a>
						<a href="javascript:void(0);" title="Delete" class="btn btn-outline-danger btn-sm btn-delete py-0 border-secondary border-opacity-25">
						  <svg class="svg-icon" aria-hidden="true"><use href="/admin/default/img/icons.svg#trash"></use></svg>
						</a>`;
		}

		addFile(f, selected) {
			let isImage = IMAGE_EXTENSIONS.includes(fileExtension(f.name));
			let fileSize = this.bytesToSize(f.size);
			let name = this.escapeHTML(f.name);
			let fileType = fileExtension(name);

			let icon = isImage
				? `<img class="image" loading="lazy" src="${this.escapeAttr(this.mediaPath + f.path)}">`
				: `<span class="icon file f-${fileType}">.${fileType}</span>`;

			let actions = this.fileActionsHtml(f, fileType, isImage);
			let detail = {file: this.mediaPath + f.path, name, fileType, fileSize, isImage, actions};
			const event = new CustomEvent("mediaModal:fileActions", {detail});

			// Listeners may replace detail.actions (e.g. add an Edit button)
			window.dispatchEvent(event);

			if (isImage && this.isModal) {
				detail.actions += '<a href="javascript:void(0);" class="preview-link p-2"><svg class="svg-icon" aria-hidden="true"><use href="/admin/default/img/icons.svg#zoom-in"></use></svg></i></a>';
			}

			let inputType = (this.type == "single") ? "radio" : "checkbox";
			let path = this.escapeAttr(f.path);
			name = this.escapeHTML(f.name);

			let file = generateElements(`<li class="files">
						<label class="form-check">
						<input type="hidden" value="${path}" name="filename[]">
						  <input type="${inputType}" class="form-check-input" value="${path}" name="file[]" ${selected ? "checked" : ""}><span class="form-check-label"></span>
						  <div href="#\\" class="files">${icon}<div class="info"><div class="name">${name}</div><span class="details">${fileSize}</span>
							${detail.actions}
							 <div class="preview">
								<img src="${this.escapeAttr(this.mediaPath + f.path)}">
								<div>
									<span class="name">${name}</span><span class="details">${fileSize}</span>
								</div>
							</div>
						  </div>
						</label>
					</li>`)[0];

			this.fileList.append(file);

			if (selected) {
				file.querySelector("input[type='radio'], input[type='checkbox']").checked = true;
			}

			return file;
		}


		addFolder(f) {
			let hasCount = Array.isArray(f.items);
			let itemsLength = hasCount ? f.items.length : 0;
			let name = this.escapeHTML(f.name);
			let icon = itemsLength ? '<span class="icon folder full"></span>' : '<span class="icon folder"></span>';

			let details;
			if (!hasCount) {
				details = '';
			} else if (itemsLength == 1) {
				details = '1 item';
			} else if (itemsLength > 1) {
				details = itemsLength + ' items';
			} else {
				details = 'Empty';
			}

			let folder = generateElements(`<li class="folders">
						<input type="hidden" value="${this.escapeAttr(f.path)}" name="filename[]">
						<a href="${this.escapeAttr(f.path)}" title="${this.escapeAttr(f.path)}" class="folders">${icon}<div class="info"><span class="name">${name}</span> <span class="details">${details}</span></div></a></li>`)[0];

			this.fileList.append(folder);

			return folder;
		}

		render(data) {
			let scannedFolders = [];
			let scannedFiles = [];

			if (Array.isArray(data)) {
				data.forEach(function(d) {
					if (d.type === 'folder') {
						scannedFolders.push(d);
					} else if (d.type === 'file') {
						scannedFiles.push(d);
					}
				});
			} else if (typeof data === 'object') {
				scannedFolders = data.folders;
				scannedFiles = data.files;
			}

			// Empty the old result and make the new one
			this.fileList.replaceChildren();

			this.nothingFound.style.display = (!scannedFolders.length && !scannedFiles.length) ? '' : 'none';

			scannedFolders.forEach((f) => this.addFolder(f));
			scannedFiles.forEach((f) => this.addFile(f));

			// Generate the breadcrumbs
			let url = '';

			if (this.filemanager.classList.contains('searching')) {
				url = '<span>Search results: </span>';
				this.fileList.classList.remove('animated');
			} else {
				this.fileList.classList.add('animated');

				this.breadcrumbsUrls.forEach((u, i) => {
					let nameParts = u.split('/');
					let label = this.escapeHTML(nameParts[nameParts.length - 1]);

					url += (i !== this.breadcrumbsUrls.length - 1)
						? `<a href="${this.escapeAttr(u)}"><span class="folderName">${label}</span></a> <span class="arrow">→</span> `
						: `<span class="folderName">${label}</span>`;
				});
			}

			this.breadcrumbs.replaceChildren();
			this.breadcrumbs.appendChild(generateElements('<a href="/"><svg class="svg-icon" aria-hidden="true"><use href="/admin/default/img/icons.svg#home"></use></svg><span class="folderName">&ensp;home</span></a>')[0]);
			this.breadcrumbs.appendChild(generateElements('<span>' + url + '</span>')[0]);

			// Show the generated elements
			this.fileList.style.display = '';
		}


		/* ------------------------------------------------------------------
		 * Utilities
		 * ------------------------------------------------------------------ */

		// Escapes special html characters in text nodes (names, labels)
		escapeHTML(text) {
			return String(text)
				.replaceAll('&', '&amp;')
				.replaceAll('<', '&lt;')
				.replaceAll('>', '&gt;');
		}

		// Escapes characters that would break out of a double quoted attribute
		escapeAttr(text) {
			return this.escapeHTML(text).replaceAll('"', '&quot;').replaceAll("'", '&#039;');
		}

		// Converts byte counts to human readable units
		bytesToSize(bytes) {
			const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

			if (!bytes) return '0 Bytes';

			let i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);

			return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
		}
	}

	// Exported globals (consumed by libs/vvveb/index.js, openverse.js, inline onclick handlers)
	window.ucFirst = ucFirst;
	window.videoExtensions = videoExtensions;
	window.fileExtension = fileExtension;
	window.isVideo = isVideo;
	window.clearMedia = clearMedia;
	window.MediaModal = MediaModal;
})();
