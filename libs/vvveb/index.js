/*
Copyright 2019 Ziadin Givan

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

https://github.com/givanz/VvvebJs
*/

//import {MediaModal} from '../media/media.js';

if (Vvveb === undefined) var Vvveb = {};


let mediaModal = document.getElementById("MediaModal");
if (mediaModal) {

	if (!Vvveb.MediaModal) {
		Vvveb.MediaModal = new MediaModal(false);
	}
	Vvveb.MediaModal.mediaPath = mediaPath;
	Vvveb.MediaModal.type = "multiple";
	Vvveb.MediaModal.open(mediaModal);
}

document.addEventListener("click", (event) => {
  let target = event.target.closest("[data-media-gallery]"); 	
  if (target) {
	if (!Vvveb.MediaModal) {
		Vvveb.MediaModal = new MediaModal(true);
	}
	Vvveb.MediaModal.mediaPath = mediaPath;
	Vvveb.MediaModal.open(target);
  }
});		

