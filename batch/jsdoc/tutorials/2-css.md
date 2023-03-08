Para crear la interfaz de usuario, la API SITNA dibuja en la página una gran cantidad de elementos HTML. Para marcarlos como elementos de la
interfaz de usuario de los objetos de la API SITNA, se les añade una serie de clases CSS con un nombre convenido, de forma que es fácil modificar
el aspecto de los controles de la API mediante reglas CSS, e identificar elementos de interfaz mediante selectores CSS.

El nombre de las clases CSS usadas en la API SITNA es sistemático: todas empiezan con el prefijo `tc-`, y si un elemento está anidado dentro de otro,
generalmente su nombre empieza con el nombre del elemento padre (p.e. el elemento con la clase `tc-ctl-lcat-search` está dentro del elemento
con la clase `tc-ctl-lcat`). Esta no es una regla estricta, porque ciertos elementos son muy genéricos y tienen un nombre más sencillo
(p. e., dentro de un elemento con clase `tc-ctl-lcat` existe un elemento con clase `tc-textbox`, que se utiliza para dar estilo a todas las cajas
de texto de la API SITNA).

Aparte de las clases CSS que definen elementos de la interfaz de usuario, hay otras clases CSS que definen estados de elementos que son relevantes
desde el punto de vista de esa interfaz (p. e., el elemento está oculto, o es un nodo de un árbol que está replegado, o es una herramienta que está
activa).

En general, cualquier cambio de estado en la interfaz de usuario se define añadiendo o quitando clases de este tipo a elementos HTML de la aplicación
(p. e., si un elemento debe ocultarse de la interfaz, en vez de ponerle una regla de estilo `display:none` la API le añade la clase `tc-hidden`).

Para comprobar la estructura de elementos HTML y clases CSS de los controles de la API SITNA puede consultar el siguiente
[ejemplo](../examples/CSS.html).