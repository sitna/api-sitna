//Borra el enlace al buscador de ejemplo de menu de Documentación
const liExamples = document.querySelector("#topNavigation > ul > li:nth-child(3) li:last-of-type");
liExamples.parentElement.removeChild(liExamples);
document.querySelector("#topNavigation > ul > li:last-of-type").insertAdjacentElement('beforebegin', liExamples);

Prism.plugins.toolbar.registerButton('Sandbox', {
	text: 'Editar', // required
	onClick: function (e) { // optional		
		//crear div modal
		var shadow = document.createElement("div");
		shadow.classList.add("example-sandbox")
		shadow.classList.add("example-sandbox-modalbg")
		var modal = document.createElement("div");
		modal.classList.add("example-sandbox-modal");
		var iframe = document.createElement("iframe");
		shadow.appendChild(modal);
		modal.appendChild(iframe);
		iframe.src = "../examples/sandbox.html";
		document.body.appendChild(shadow);
		var code = e.code;
		iframe.onload = function () {
			this.contentWindow.postMessage(code);
		}
	}
});