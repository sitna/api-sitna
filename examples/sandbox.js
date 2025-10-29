import { basicSetup, EditorView, } from 'codemirror';
import { keymap } from "@codemirror/view"
import { html } from '@codemirror/lang-html';
import { indentWithTab } from "@codemirror/commands"

let sandbox;
let code;

const renderDocument = (html, css, js) => {
	const style = /.*\.css/gmi.test(css) ? '<link rel="stylesheet" href="' + css + '" \/>' : '<style>' + css + '<\/style>';
	//html = html.replace('<script type="text/javascript" src="examples.js"></script>', '');
	const script = '<script src="' + js + '" ><\/script>';
	if (/<head>[\s\S]*<\/head>/.test(html)) {
		const pos = html.search('</head>');
		html = html.substring(0, pos) + style + script + html.substring(pos);
	} else {
		html = '<html>\n\t<head>\n\t\t' + style + '\n\t\t' + script + '\n\t<\/head>\n\t\t<body>\n\t\t\t' + html + '\n\t\t<\/body>\n\t<\/html>';
	}
	if (!/^[\s]*<!.+?>/.test(html)) {
		html = '<!DOCTYPE html>\n' + html;
	}
	return html;
}
const updateListenerExtension = EditorView.updateListener.of((update) => {
	if (update.docChanged) {
		document.querySelector("#command .play").classList.add("changed");
	}
});

class Sandbox {
	constructor(data, DOMobject, iFrameDiv) {
		code = data;
		this.frameDiv = iFrameDiv;
		
		this.viewEditor = new EditorView({
			doc: data,
			extensions: [basicSetup, updateListenerExtension, html(), keymap.of([indentWithTab])],
			parent: DOMobject,
			//parent: document.body
		});

		this.RefreshViewer(data, document.body.classList.contains("fullscreen"));
	}
	RefreshViewer(code, full) {
		let frame = this.frameDiv.querySelector("iframe");
		if (frame) {
			frame.contentDocument.clear();
			frame.src = "about:blank";
			frame.remove();
		}
		this.frameDiv.insertAdjacentHTML('beforeend', '<iframe src="about:blank" width="100%" height="100%" sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-top-navigation allow-top-navigation-by-user-activation" allowfullscreen="" frameborder="0"></iframe>')
		frame = this.frameDiv.querySelector("iframe");
		if (!full)
			code = renderDocument(code, 'examples.css', '../sitna.js');
		//else
		//	code = this.RefreshViewer(code, document.body.classList.contains("fullscreen"));		
		frame.contentDocument.open();
		frame.contentDocument.write(code)
		frame.contentDocument.close();
		frame.contentDocument.querySelectorAll(".instructions a").forEach(a => a.target = "_parent");
	}
}

document.addEventListener("DOMContentLoaded", function () {
	window.addEventListener("message", (event) => {
		if (event.data) {
			const frameDiv = window.document.querySelector('#codeViewer div');
			sandbox = new Sandbox(event.data, document.getElementById("codeEditorBox"), frameDiv);
		}
	});

	document.querySelector(".collapse").addEventListener("click", function (e) {
		const editor = document.querySelector("#codeEditor");
		editor.classList.toggle("collapsed");
		if (editor.classList.contains("collapsed")) {
			this.title = "Desplegar";
		}
		else {
			this.title = "Replegar";
		}
	});
	document.querySelector(".play").addEventListener("click", function (e) {
		sandbox.RefreshViewer(sandbox.viewEditor.state.doc.toString(), document.body.classList.contains("fullscreen"));
		document.querySelector("#command .play").classList.remove("changed");
	});
	document.querySelector(".copy").addEventListener("click", function (e) {
		const self = this;
		navigator.clipboard.writeText(sandbox.viewEditor.state.doc.toString());		
		this.title = "Copiado";
		this.classList.add("copied");
		setTimeout(() => {
			self.title = "Copiar al portapapeles";
			self.classList.remove("copied");
		}, 1000)

	});
	document.querySelector(".copy").addEventListener("mouseout", function (e) {
		this.setAttribute("aria-label", "Copiar al portapapeles");
	});
	if (document.location.search) {
		fetch(document.location.search.substr(1)).then(async function (response) {
			let code = await response.text();
			document.title = /\<title>(.+)\<\/title>/gm.exec(code)[1];
			document.body.classList.add("fullscreen");
			const frameDiv = window.document.querySelector('#codeViewer div');
			code = code.replace('<script type="text/javascript" src="examples.js"></script>', '')
			sandbox = new Sandbox(code, document.getElementById("codeEditorBox"), frameDiv);
		});
	}
	else {
		const code = sessionStorage.getItem("sandboxCode");
		if (code) {
			const frameDiv = document.querySelector('#codeViewer div');
			sandbox = new Sandbox(code, document.getElementById("codeEditorBox"), frameDiv);
		}
    }
	
})








