//Borra el enlace al buscador de ejemplo de menu de Documentación
const liExamples = document.querySelector("#topNavigation > ul > li:nth-child(3) li:last-of-type");
liExamples.parentElement.removeChild(liExamples);
document.querySelector("#topNavigation > ul > li:last-of-type").insertAdjacentElement('beforebegin', liExamples);

document.querySelectorAll(".example-caption a").forEach(link => link.style.display = 'none');

Prism.plugins.toolbar.registerButton('Sandbox', function (env) {
	const regexp1 = /new\s+SITNA\.Map\(["|'](\w+)["|']/gm;

	const matches = env.code.match(regexp1);
	if (!matches) {
		return;
	} else {

		if (!matches.some(match => {
			const mapName = match.replace(/new\s+SITNA\.Map\(["|'](\w+)["|']/, '$1');
			const regexp2 = new RegExp('<([a-zA-Z]+)([^>]*?)id\\s*=\\s*["\']' + mapName + '["\']([^>]*?)>', 'g');
			return !!regexp2.exec(env.code);
		})) {
			return;
		}
	}

	var button = document.createElement('button');
	button.innerHTML = 'Ver en vivo';

	button.addEventListener('click', function () {
		let link = this.closest(".example-code").previousElementSibling?.querySelector(".example-caption a");
		if (link)
			document.location.href = link.href
		else {
			sessionStorage.setItem('sandboxCode', env.code);
			document.location.href = "../examples/sandbox.html";
        }
		
	});

	return button;
});