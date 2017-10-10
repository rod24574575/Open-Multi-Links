// ==UserScript==
// @name            Open Multi Links
// @namespace       Open Multi Links
// @description     Open all link along the mouse moving path during the time between right mouse down with ctrl key and mouse up.
// @version         0.0.1
// @author          rod24574575
// @homepageURL     https://github.com/rod24574575/Open-Multi-Links
// @include         *://*
// @grant           GM_openInTab
// ==/UserScript==

(function() {
	if (typeof(Map) !== 'function') {
		return;
	}

	var triggerKey = 'ctrlKey';
	var cancelTimeout = 3000;
	var markStyle = 'dashed';
	var markWidth = '2px';
	var markColor = 'red';
	var markOffset = '-' + markWidth;

	document.body.addEventListener('mousedown', function(e) {
		if (!e[triggerKey]) {
			return;
		}

		var body = document.body; //e.target.ownerDocument.body;
		var linkMap = new Map();
		var timeout = null;

		var mouse_move = function(e) {
			clear_timeout();
			timeout = set_timeout();
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
				if (!href || linkMap.has(href)) {
					continue;
				}

				// record original information
				var style = elm.style;
				linkMap.set(href, {
					dom: elm,
					style: {
						outlineStyle: style.outlineStyle,
						outlineWidth: style.outlineWidth,
						outlineColor: style.outlineColor,
						outlineOffset: style.outlineOffset
					}
				});

				// modify element style
				style.outlineStyle = markStyle;
				style.outlineWidth = markWidth;
				style.outlineColor = markColor;
				style.outlineOffset = markOffset;
			}
		};

		var mouse_up = function(e) {
			clear_timeout();
			remove_all();

			// check whether to open links
			if (!e[triggerKey]) {
				return;
			}

			// open links (we should always open in reverse order)
			var links = Array.from(linkMap.keys());
			for (var i = links.length - 1; i >= 0; --i) {
				GM_openInTab(links[i], {
					active: false,
					insert: true,
					setParent: true
				});
			}

			// disable default context menu
			if (links.length > 0) {
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

		var set_timeout = function() {
			return window.setTimeout(remove_all, cancelTimeout);
		};

		var clear_timeout = function(reset) {
			if (timeout != null) {
				window.clearTimeout(timeout);
				timeout = null;
			}
		};

		var remove_all = function() {
			body.removeEventListener('mousemove', mouse_move, true);
			body.removeEventListener('mouseup', mouse_up, true);

			// reset element style
			var datas = Array.from(linkMap.values());
			for (var i = datas.length - 1; i >= 0; --i) {
				var data = datas[i], dom_style = data.dom.style, style = data.style;
				for (var key in style) {
					if (Object.prototype.hasOwnProperty.call(style, key)) {
						dom_style[key] = style[key];
					}
				}
			}
		};

		// add handlers
		body.addEventListener('mousemove', mouse_move, true);
		body.addEventListener('mouseup', mouse_up, {
			capture: true,
			once: true
		});
		timeout = set_timeout();
	}, true);
})();
