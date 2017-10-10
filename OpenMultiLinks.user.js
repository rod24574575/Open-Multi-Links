// ==UserScript==
// @name            Open Multi Links
// @namespace       
// @description     Open all link along the mouse moving path during the time between right mouse down with ctrl key and mouse up.
// @include         *://*
// @grant           GM_openInTab
// ==/UserScript==

(function() {
	var triggerKey = 'ctrlKey';
	var markStyle = 'dashed';
	var markWidth = '2px';
	var markColor = 'red';
	var markOffset = '-' + markWidth;

	document.body.addEventListener('mousedown', function(e) {
		if (!e[triggerKey]) {
			return;
		}

		var body = document.body; //e.target.ownerDocument.body;
		var link_map = Object.create(null);
		var timeout = null;

		var mouse_move = function(e) {
			clear_timeout(true);
			if (!e[triggerKey]) {
				return;
			}

			// find anchor element along path to body
			for (var elm = e.target; elm && elm !== body; elm = elm.parentNode) {
				if (elm.tagName !== 'A') {
					continue;
				}

				// check url availability
				var href = elm.href;
				if (!href || (href in link_map)) {
					continue;
				}

				// record original information
				var style = elm.style;
				link_map[href] = {
					dom: elm, 
					style: {
						outlineStyle: style.outlineStyle,
						outlineWidth: style.outlineWidth,
						outlineColor: style.outlineColor,
						outlineOffset: style.outlineOffset
					}
				};

				// modify element style
				style.outlineStyle = markStyle;
				style.outlineWidth = markWidth;
				style.outlineColor = markColor;
				style.outlineOffset = markOffset;
			}
		};

		var mouse_up = function(e) {
			remove_all_listener();

			// reset element style
			var i, urls = Object.keys(link_map);
			for (i = 0; i < urls.length; ++i) {
				var data = link_map[urls[i]], dom_style = data.dom.style, style = data.style;
				for (var key in style) {
					if (Object.prototype.hasOwnProperty.call(style, key)) {
						dom_style[key] = style[key];
					}
				}
			}

			// check whether to open links
			if (!e[triggerKey]) {
				return;
			}

			// open links
			for (i = 0; i < urls.length; ++i) {
				GM_openInTab(urls[i], {
					active: false,
					insert: true,
					setParent: true
				});
			}

			// disable default context menu
			if (urls.length) {
				body.addEventListener('contextmenu', disable_contextmenu, {
					capture: true, 
					once: true
				});
				window.setTimeout(function() {
					body.removeEventListener('contextmenu', disable_contextmenu, true);
				}, 10);
			}
		};

		var disable_contextmenu = function(e) {
			e.preventDefault();
		};

		var clear_timeout = function(reset) {
			if (timeout != null) {
				window.clearTimeout(timeout);
			}
			if (reset) {
				timeout = window.setTimeout(remove_all_listener, 3000);
			} else {
				timeout = null;
			}
		};

		var remove_all_listener = function() {
			body.removeEventListener('mousemove', mouse_move, true);
			body.removeEventListener('mouseup', mouse_up, true);
			clear_timeout();
		};

		// add handlers
		body.addEventListener('mousemove', mouse_move, true);
		body.addEventListener('mouseup', mouse_up, {
			capture: true, 
			once: true
		});
		timeout = window.setTimeout(function() {
			timeout = null;
			remove_all_listener();
		}, 3000);
	}, true);	
})();
