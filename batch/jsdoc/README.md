# Introducción
Esta es la documentación de referencia de la API SITNA, una API JavaScript para el desarrollo de mapas interactivos de manera sencilla.

## Cómo empezar a usar la API SITNA
Para empezar a usar la API, basta seguir estos tres pasos: primero hay que añadir en la página una etiqueta <code>script</code> con la dirección de la API:
``` HTML
<script src="//sitna.navarra.es/api/"></script>
```

A continuación, añade un elemento HTML a la página donde se va a crear el visor geográfico:
``` HTML
<div id="mapa"></div>
```

Finalmente, en un script de la página instanciar un objeto de la clase {@link SITNA.Map}, pasándole como parámetro el 
identificador creado en el paso anterior:
``` javascript
var map = new SITNA.Map("mapa");
```

El resultado es el siguiente:

<iframe class="example" src="../examples/getting-started.html"></iframe>

A lo largo de la documentación hay ejemplos comentados con enlaces a su versión funcional online. Es recomendable abrir el código fuente de 
estas versiones funcionales para ver el ejemplo completo.

## Cómo usar versiones anteriores
La dirección [https://sitna.navarra.es/api/](https://sitna.navarra.es/api/) siempre tendrá la última versión disponible 
de la API SITNA. Si se desea utilizar una versión anterior, esta deberá descargarse de [GitHub](https://github.com/sitna/api-sitna/releases). 

La [lista de versiones de la API SITNA]{@tutorial 4-changes} de esta documentación contiene enlaces a todas las 
versiones disponibles. En la página de la versión **x.y.z**, descargar el archivo `api-sitna-vx.y.z-build.zip` 
correspondiente y descomprimir el contenido en una carpeta accesible para la aplicación que estemos desarrollando.

Para las versiones a partir de la **3.0.0**, el archivo que hay que enlazar desde la aplicación es `sitna.js`.
En las versiones desde la **1.3.0** hasta la **2.2.1**, este archivo debe ser `sitna.ol.min.js`.
En versiones anteriores a la **1.3.0** el archivo es `sitna.ol3.min.js`.

## Instalar la API SITNA mediante npm
La API SITNA está también disponible como paquete de Node.js. Para añadirlo, abre una consola de comandos en la carpeta 
donde está el archivo package.json de tu proyecto y ejecuta el siguiente comando:
```
npm install api-sitna
```

### Definir la URL de base
La API SITNA carga en tiempo de ejecución un conjunto de recursos. Por eso es necesario indicarle la ubicación de esos archivos.
Esto se consigue definiendo una variable global `SITNA_BASE_URL` que contiene la URL de la carpeta donde vamos a 
ubicar dichos recursos. Es importante que esta variable se definirsa antes de importar cualquier clase de la API SITNA.
``` javascript
window.SITNA_BASE_URL = '/js/api-sitna/'; // URL de una carpeta de nuestro proyecto
```

Por último hay que añadir los archivos que se cargan en tiempo de ejecución. Para ello abre a la carpeta 
`node_modules/api-sitna` de tu proyecto y copia las carpetas `css`, `layout`, `lib`, `resources` y `wmts` a la carpeta
definida por `SITNA_BASE_URL`. Si seguimos el ejemplo, en la carpeta del proyecto debería estar el siguiente
árbol de carpetas:

- js
  * api-sitna
    + css
    + layout
    + lib
    + resources
    + wmts

Ahora ya se puede importar los objetos de la API SITNA desde la aplicación:
``` javascript
import SitnaMap from 'api-sitna';
var map = new SitnaMap("mapa");
```

### Cómo configurar Webpack
Si se utiliza Webpack para generar el código de la aplicación, se pueden automatizar las tareas descritas en el punto 
anterior mediante los plugins [DefinePlugin](https://webpack.js.org/plugins/define-plugin/) y 
[CopyWebpackPlugin](https://webpack.js.org/plugins/copy-webpack-plugin/). 
A continuación se muestra un ejemplo de archivo de configuración que se puede utilizar para 
empaquetar una aplicación que use la API SITNA:
``` javascript
const webpack = require('webpack');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const apiSitnaSource = 'node_modules/api-sitna';

module.exports = {
    resolve: {
        // Para evitar errores "Module not found" durante el empaquetamiento
        fallback: {
            assert: false,
            util: false
        }
    },
    plugins: [
        // Define la ruta base de la API SITNA para la carga de recursos
        new webpack.DefinePlugin({
            SITNA_BASE_URL: JSON.stringify('/js/api-sitna/')
        }),
        // Copia los recursos necesarios a la carpeta de publicación
        new CopyWebpackPlugin({ 
            patterns: [
                { from: path.join(apiSitnaSource, 'css'), to: 'css' },
                { from: path.join(apiSitnaSource, 'layout'), to: 'layout' },
                { from: path.join(apiSitnaSource, 'lib'), to: 'lib' },
                { from: path.join(apiSitnaSource, 'resources'), to: 'resources' },
                { from: path.join(apiSitnaSource, 'wmts'), to: 'wmts' }
            ]
        })
    ],
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'js/api-sitna')
    }
};
```
