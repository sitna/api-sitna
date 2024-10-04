import { basicSetup, EditorView } from 'codemirror';
import { html } from '@codemirror/lang-html';

let sandbox;

const renderDocument = (html, css, js) => {
	const style = /.*\.css/gmi.test(css) ? '<link rel="stylesheet" href="' + css + '" \/>' : '<style>' + css + '<\/style>';
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

class Sandbox {
	constructor(data, DOMobject, iFrameDiv) {
		this.frameDiv = iFrameDiv;
		let timeout;
		let updateListenerExtension = EditorView.updateListener.of((update) => {
			if (update.docChanged) {
				if (timeout) {
					clearTimeout(timeout);
				}

				timeout = setTimeout(() => {
					const code = update.state.doc.toString();
					this.RefreshViewer(code);
					
				}, 1000);
			}
		});
		this.viewEditor = new EditorView({
			doc: data,
			extensions: [basicSetup, html(), updateListenerExtension],
			parent: DOMobject,
			//parent: document.body
		});
		this.RefreshViewer(data);
	}
	RefreshViewer(code) {
		this.frameDiv.querySelector("iframe")?.remove();		
		this.frameDiv.insertAdjacentHTML('beforeend','<iframe src="about:blank" width="100%" height="600" sandbox="allow-scripts allow-same-origin allow-forms allow-modals" allowfullscreen="" frameborder="0"></iframe>')
		const frame = this.frameDiv.querySelector("iframe");
		
		frame.contentDocument.open();
		frame.contentDocument.write(renderDocument(code, 'examples.css', '../sitna.js'))
		frame.contentDocument.close();
	}
	NewWindow() {
		const popUp = window.open("about:blank");
		popUp.document.open();
		popUp.document.write(renderDocument(this.viewEditor.state.doc.toString(), 'examples.css', '../sitna.js'))
		popUp.document.close();
	}	

}

document.addEventListener("DOMContentLoaded", function () {
	window.addEventListener("message", (event) => {
		if (event.data) {
			const frameDiv = window.document.querySelector('#codeViewer div');
			sandbox = new Sandbox(event.data, document.getElementById("codeEditor"), frameDiv);
		}
	});
	document.querySelector(".close").addEventListener("click", function (e) {
		parent.document.querySelector(".example-sandbox").remove();
	});
	document.querySelector(".new-window").addEventListener("click", function (e) {

		sandbox.NewWindow();
	});
})







