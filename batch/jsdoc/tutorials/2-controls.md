Los controles de usuario son elementos de la interfaz gráfica que permiten al usuario interactuar con el mapa.
Típicamente contienen botones, menús, cuadros de diálogo, etc. incrustados dentro del mapa o en su entorno y que tienen una 
referencia a él, mediante la cual pueden interactuar con el mismo (cambiar la vista, añadir o quitar capas, etc.).

Una clase que represente un control de usuario debe implementar la interfaz de programación {@link MapControl}.

# La clase {@link SITNA.control.Control}

La manera más sencilla de crear un control nuevo es crear una clase nueva que herede de la clase {@link SITNA.control.Control}. 
Esta clase, aparte de implementar la interfaz {@link MapControl}, es un [elemento personalizado](https://developer.mozilla.org/es/docs/Web/API/Web_components/Using_custom_elements), 
por tanto es un elemento HTML y tiene todas las propiedades y métodos de `HTMLElement`.

```javascript
class MyControl extends SITNA.control.Control {
	constructor() {
		super(...arguments);
		
		// Aquí va la inicialización del control
		this.title = "Mi control";
		this.text = "Hola mundo";
	}
}
```

# Implementar la interfaz {@link MapControl}

## El método [register]{@link MapControl#register}

En la clase que hemos creado debemos redefinir los métodos de la interfaz {@link MapControl} que implementa {@link SITNA.control.Control} 
para aportar la lógica necesaria para nuestras necesidades. El primero de ellos es {@link MapControl#register}, 
que lleva a cabo dos labores: por un lado pone en contacto el control con el mapa, y por otro crea el contenido HTML del control y lo inserta en el DOM.

Si este control debe escuchar a eventos del mapa, aquí es el lugar adecuado para añadir los gestores de dichos eventos.

```javascript
class MyControl extends SITNA.control.Control {
	
	/* ... */
	
	async register(map) {
		await super.register(map); // Llamamos al método register de la clase antecesora

		// Si es necesario, añadimos gestores de eventos del mapa
		map.addEventListener("sitna:layeradd", (event) => {
			// Manejamos el evento
		});

		return this; // La interfaz MapControl requiere que register devuelva una promesa que resuelve con el propio control
	}

	/* ... */
}
```

## La propiedad [template]{@link MapControl#template} y el método [loadTemplates]{@link MapControl#loadTemplates}

Otra de las tareas que debe hacer el control es crear su contenido HTML. Los controles de la API SITNA utilizan plantillas para definir su estructura HTML, y esas plantillas
se guardan en la propiedad {@link MapControl#template} del control. El desarrollador es libre para definir la estructura del valor de esta propiedad, siempre y cuando los métodos 
{@link MapControl#loadTemplates} y {@link MapControl#render} que vamos a ver a continuación sepan interpretarla.

A modo ilustrativo comentaremos cómo se almacenan las plantillas en los controles integrados en la API SITNA: en este caso la propiedad `template` es un objeto plano con una o varias propiedades.
Los nombres de las propiedades son los nombres de las plantillas, y los valores son plantillas *[Handlebars](https://handlebarsjs.com/)* compiladas (funciones que aceptan un objeto como parámetro y devuelven 
una cadena de texto). Si hay más de una plantilla, una será la plantilla principal y las demás serán plantillas parciales que se han registrado mediante `Handlebars.definePartial` y que se llaman desde la primera.

El método {@link MapControl#loadTemplates} se encarga de cargar las plantillas necesarias para el control, haciéndolas disponibles en la propiedad {@link MapControl#template}.
En nuestro ejemplo, suponiendo que utilizamos *Handlebars*, una implementación sencilla de este método podría ser la siguiente:

```javascript
class MyControl extends SITNA.control.Control {
	
	/* ... */
	
	async loadTemplates() {
		const templateNames = [
			"my-control-main", 
			"my-control-partial1", 
			"my-control-partial2"
		];

		this.template = {}
		for (let i = 0, ii = templateNames.length; i < ii; i++) {
			const name = templateNames[i];
			this.template[name] = Handlebars.compile(await (await fetch(`./templates/${name}.hbs`)).text());
			if (i > 0) Handlebars.registerPartial(name, this.template[name]);
		}
	}

	/* ... */
}
```
Para ver un caso en que se utilizan plantillas HTML en lugar de *Handlebars*, se puede consultar [este ejemplo](../examples/control.template.html).

## El método [render]{@link MapControl#render}

Una vez que las plantillas están cargadas, el método {@link MapControl#render} se encarga de generar el contenido HTML del control y añadirlo al DOM.
En concreto, las tareas que debe realizar este método son:
1. Si no está inicializada la propiedad template, cargar las plantillas. La manera heterodoxa de realizar esto es llamar a {@link MapControl#loadTemplates}.
2. Procesar la plantilla y pegar el HTML generado al DOM.
3. Lanzar el evento {@link MapControl#sitna:controlrender} mediante `EventTarget#dispatchEvent` (siendo un elemento HTML implementa la interfaz `EventTarget`).
4. Llamar a {@link MapControl#addUIEventListeners} para añadir eventos de interfaz de usuario a los elementos HTML recién creados.
5. Si está definida, ejecutar la función `callback` pasada como parámetro.

Siguiendo con nuestro ejemplo, vamos a aprovechar el método de utilidad {@link SITNA.control.Control#renderData} que ya implementa 
los pasos 1, 2 y 3, aceptando como parámetro un objeto con los datos que se van a pasar a la plantilla.

```javascript
class MyControl extends SITNA.control.Control {
	
	/* ... */
	
	async render(callback) {
		await this.renderData({ title: this.title, text: this.text}); // Pasamos a la plantilla los datos pertinentes
		this.addUIEventListeners(); // Añade los gestores de eventos de la interfaz del control
		if (typeof callback === 'function') {
			callback();
		}
	}

	/* ... */
}
```

## El método [addUIEventListeners]{@link MapControl#addUIEventListeners}

En el ejemplo de código anterior hemos visto que el método {@link MapControl#render} llama a {@link MapControl#addUIEventListeners}.
 Este método es el lugar adecuado para añadir los gestores de eventos de la interfaz de usuario del control que han sido añadidos, 
 es decir, los eventos que se disparan al interactuar con los elementos HTML del control (botones, menús, etc.).

```javascript
class MyControl extends SITNA.control.Control {
	
	/* ... */
	
	addUIEventListeners() {
		// Aquí van los gestores de eventos de la interfaz del control
		this.querySelector("button").addEventListener("click", (event) => {
			alert("¡Hola mundo!");
		});
	}

	/* ... */
}
```

# Registrar el control como elemento HTML personalizado

La clase {@link SITNA.control.Control} es ella misma un [elemento personalizado](https://developer.mozilla.org/es/docs/Web/API/Web_components/Using_custom_elements) 
por tanto la clase que hemos creado también lo es. Por eso mismo, para que el navegador reconozca nuestra clase como un nuevo 
elemento HTML, debemos registrarla con un nombre único. Este nombre debe [cumplir unas reglas](https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name), 
como estar en minúsculas, empezar por una letra y contener por lo menos un guión (`-`), para que el navegador lo reconozca como un elemento personalizado.

```javascript
customElements.define("my-control", MyControl);
```

Una vez registrado el elemento, ya podemos crear instancias del mismo mediante `document.createElement`:
```javascript
const myControl = document.createElement("my-control");
myMap.addControl(myControl);
```
O bien con el constructor de la clase:
```javascript
const myControl = new MyControl();
myMap.addControl(myControl);
```
O directamente insertando el elemento en el documento HTML:
```html
<!DOCTYPE html>
<html>
	<body>

		<!-- ... -->

		<my-control></my-control>

		<!-- ... -->

	</body>
</html>
```

Se puede ver un ejemplo de este último caso de uso [aquí](../examples/control.markup.html).

# Usar elementos de interfaz de usuario del espacio de nombres {@link SITNA.ui}

La API SITNA incluye dentro del espacio de nombres {@link SITNA.ui} una serie de elementos personalizados que representan componentes de interfaz de usuario. 
El uso de estos elementos en las plantillas facilita la coherencia visual y funcional de los controles, ya que todos ellos comparten el mismo estilo y comportamiento.

Los tres elementos disponibles a dia de hoy son: 

## {@link SITNA.ui.Button} 

En HTML se representa como `<sitna-button>`. Representa un botón, o un elemento de interaz de usuario que realiza una función cuando es pulsado.

```html
<sitna-button id="my-button">Pulsa aquí</sitna-button>
<script>
	document.getElementById("my-button").addEventListener("click", () => {
		alert("¡Hola mundo!");
	});
</script>
```

## {@link SITNA.ui.Toggle} 

En HTML se representa como `<sitna-toggle>`, y representa elemento que puede estar en dos estados: activado o desactivado, y que alternativamente pasa de un estado
a otro pulsando sobre él.

```html
<sitna-toggle id="my-toggle">¿Hay saludo?</sitna-toggle>
<script>
	document.getElementById("my-toggle").addEventListener("change", function (e) {
		if (this.checked) alert("¡Hola mundo!");
	});
</script>
```

## {@link SITNA.ui.Tab}  

Se representa como `<sitna-tab>` en HTML. Representa una pestaña que forma parte de un conjunto, y que al ser activada muestra un contenido asociado a la misma, ocultando
el contenido de las demás pestañas del conjunto.

```html
<div>
    <sitna-tab group="ejemplo" for="div-1">Primera pestaña</sitna-tab>
    <sitna-tab group="ejemplo" for="div-2">Segunda pestaña</sitna-tab>
    <sitna-tab group="ejemplo" for="div-3">Tercera pestaña</sitna-tab>
</div>
<div>
    <section id="div-1" class="tc-hidden">Esto sale si la primera pestaña está seleccionada</section>
    <section id="div-2" class="tc-hidden">Esto sale si la segunda pestaña está seleccionada</section>
    <section id="div-3" class="tc-hidden">Esto sale si la tercera pestaña está seleccionada</section>
</div>
```

# Usar controles existentes como base para nuevos controles

Si el control que queremos crear es similar a uno ya existente, en vez de partir de {@link SITNA.control.Control} podemos crear 
la clase heredando de la clase de ese control y redefinir las plantillas o los métodos necesarios para adaptarlo a nuestras necesidades. Se puede ver un ejemplo de este caso 
[aquí](../examples/control.layerCatalog.custom.html).
