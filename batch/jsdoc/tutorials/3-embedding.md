En la API SITNA, los atributos de una entidad geográfica se muestran en una tabla en dos columnas, 
la primera muestra los nombres de los atributos y la segunda sus valores.

Pero en el caso de elementos multimedia o direcciones de páginas web, se pueden mostrar de una manera más accesible.
Para ello se ha definido una convención para marcar los atributos de la entidad geográfica que tienen tipos especiales de dato.
Estas marcas se pueden añadir al nombre o al valor del atributo.

## Imágenes

Un atributo de entidad geográfica con la marca convenida mostrará en su tabla de atributos la imagen en tamaño reducido. 
Pulsando en la imagen esta se amplía al tamaño original o al máximo disponible en la pantalla si el tamaño original es mayor que 
el tamaño de la pantalla.

### Alternativa 1: Marca añadida al nombre de atributo

A un atributo cuyo valor se desee tratar como la URL de una imagen se le puede asignar un nombre que siga alguno de los siguientes formatos:

#### 1.a. Marca como sufijo

Expresión regular:
```regex
/^(.)+__image(?:_(\d+|auto)_(\d+|auto))?$/
```
<img src="img/image_name_suffix_regex.svg" title="CC BY Regexper">

| Ejemplo de nombre de atributo         | Título de atributo  | Anchura de miniatura | Altura de miniatura |
| ------------------------------------- | ------------------- | -------------------- | ------------------- |
| `fotografía__image`                   | _fotografía_        | no definida          | no definida         |
| `DSC0001.JPG__image_640_480`          | _DSC0001.JPG_       | 640 píxeles          | 480 píxeles         |
| `Gráfico de barras__image_auto_200`   | _Gráfico de barras_ | no definida          | 200 píxeles         |

#### 1.b. Marca como prefijo

Expresión regular:
```regex
/^image(?:_(\d+|auto)_(\d+|auto))?__(.)+$/
```
<img src="img/image_name_prefix_regex.svg" title="CC BY Regexper">

| Ejemplo de nombre de atributo         | Título de atributo  | Anchura de miniatura | Altura de miniatura |
| ------------------------------------- | ------------------- | -------------------- | ------------------- |
| `image__fotografía`                   | _fotografía_        | no definida          | no definida         |
| `image_640_480__DSC0001.JPG`          | _DSC0001.JPG_       | 640 píxeles          | 480 píxeles         |
| `image_auto_200__Gráfico de barras`   | _Gráfico de barras_ | no definida          | 200 píxeles         |

#### Ejemplo
[Ver en vivo](../examples/attribute.image.name.html)
```html
<div id="mapa"></div>
<script>
    // Crear mapa.
    var map = new SITNA.Map("mapa");

    // Cuando esté todo cargado proceder a trabajar con el mapa.
    map.loaded(function () {
        // Añadir un marcador con un atributo con la URL de la imagen.
        map.addMarker([611061, 4741133], {
		    showPopup: true, // Hacemos que la tabla de atributos se muestre automáticamente
            data: {
                "Imagen adjunta__image_200_auto": "https://upload.wikimedia.org/wikipedia/commons/9/90/Pamplona_-_Monumento_al_Encierro.jpg",
                "Licencia de uso": "Zarateman, CC0, via Wikimedia Commons"
            }
        });
		// Centrar el mapa en el marcador.
		map.zoomToMarkers();
    });
</script>
```

### Alternativa 2: Marca añadida al valor del atributo

En un atributo cuyo valor se desee tratar como la URL de una imagen se puede añadir la marca a la URL con alguno de los siguientes formatos:

#### 2.a. Marca como sufijo

Expresión regular:
```regex
/^(.)+__image(?:_(\d+|auto)_(\d+|auto))?$/
```
<img src="img/image_value_suffix_regex.svg" title="CC BY Regexper">

| Ejemplo de valor de atributo                  | URL de imagen                  | Anchura de miniatura | Altura de miniatura |
| --------------------------------------------- | ------------------------------ | -------------------- | ------------------- |
| `DSC0001.JPG__image`                          | _DSC0001.JPG_                  | no definida          | no definida         |
| `/images/pic01.jpeg__image_200_100`           | _/images/pic01.jpeg_           | 200 píxeles          | 100 píxeles         |
| `https://example.com/logo.png__image_64_auto` | _https://example.com/logo.png_ | 64 píxeles           | no definida         |

#### 2.b. Marca como prefijo

Expresión regular:
```regex
/^image(?:_(\d+|auto)_(\d+|auto))?__(.)+$/
```
<img src="img/image_value_prefix_regex.svg" title="CC BY Regexper">


| Ejemplo de valor de atributo                  | URL de imagen                  | Anchura de miniatura | Altura de miniatura |
| --------------------------------------------- | ------------------------------ | -------------------- | ------------------- |
| `image__DSC0001.JPG`                          | _DSC0001.JPG_                  | no definida          | no definida         |
| `image_200_100__/images/pic01.jpeg`           | _/images/pic01.jpeg_           | 200 píxeles          | 100 píxeles         |
| `image_64_auto__https://example.com/logo.png` | _https://example.com/logo.png_ | 64 píxeles           | no definida         |

#### Ejemplo
[Ver en vivo](../examples/attribute.image.value.html)
```html
<div id="mapa"></div>
<script>
    // Crear mapa.
    var map = new SITNA.Map("mapa");

    // Cuando esté todo cargado proceder a trabajar con el mapa.
    map.loaded(function () {
        // Añadir un marcador con un atributo con la URL de la imagen.
        map.addMarker([611061, 4741133], {
		    showPopup: true, // Hacemos que la tabla de atributos se muestre automáticamente
            data: {
                "Imagen adjunta": "image_200_auto__https://upload.wikimedia.org/wikipedia/commons/9/90/Pamplona_-_Monumento_al_Encierro.jpg",
                "Licencia de uso": "Zarateman, CC0, via Wikimedia Commons"
            }
        });
		// Centrar el mapa en el marcador.
		map.zoomToMarkers();
    });
</script>
```

## Vídeos

Un atributo de entidad geográfica que tenga la marca convenida mostrará incrustado en su tabla de atributos un reproductor del vídeo. 
El valor del atributo puede ser una URL de un archivo de vídeo o un enlace de Youtube. Se soportan tres tipos de URL de Youtube:
- El que se refiere a un vídeo en una página independiente, con formato `https://www.youtube.com/watch?v=XXXXXXXXXXX`
- El que se utiliza en código HTML de inserción, con formato `https://www.youtube.com/embed/XXXXXXXXXXX`
- El acortado, con formato `https://youtu.be/XXXXXXXXXXX`

En los tres casos la URL se se transformará al formato de inserción para incrustar el vídeo en la tabla de atributos.

### Alternativa 1: Marca añadida al nombre de atributo

A un atributo cuyo valor se desee tratar como la URL de un vídeo se le puede asignar un nombre con alguno de los siguientes formatos:

#### 1.a. Marca como sufijo

Expresión regular:
```regex
/^(.)+__video(?:_(\d+|auto)_(\d+|auto))?$/
```
<img src="img/video_name_suffix_regex.svg" title="CC BY Regexper">

| Ejemplo de nombre de atributo           | Título de atributo     | Anchura de reproductor de vídeo | Altura de reproductor de vídeo |
| --------------------------------------- | ---------------------- | ------------------------------- | ------------------------------ |
| `Tutorial__video`                       | _Tutorial_             | no definida                     | no definida                    |
| `Anuncio publicitario__video_1920_1080` | _Anuncio publicitario_ | 1920 píxeles                    | 1080 píxeles                   |
| `Grabación__video_640_auto`             | _Grabación_            | 640 píxeles                     | no definida                    |

#### 1.b. Marca como prefijo

Expresión regular:
```regex
/^video(?:_(\d+|auto)_(\d+|auto))?__(.)+$/
```
<img src="img/video_name_prefix_regex.svg" title="CC BY Regexper">

| Ejemplo de nombre de atributo           | Título de atributo     | Anchura de reproductor de vídeo | Altura de reproductor de vídeo |
| --------------------------------------- | ---------------------- | ------------------------------- | ------------------------------ |
| `video__Tutorial`                       | _Tutorial_             | no definida                     | no definida                    |
| `video_1920_1080__Anuncio publicitario` | _Anuncio publicitario_ | 1920 píxeles                    | 1080 píxeles                   |
| `video_640_auto__Grabación`             | _Grabación_            | 640 píxeles                     | no definida                    |

#### Ejemplos

##### Archivo de vídeo
[Ver en vivo](../examples/attribute.video.file.name.html)
```html
<div id="mapa"></div>
<script>
    // Crear mapa.
    var map = new SITNA.Map("mapa");

    // Cuando esté todo cargado proceder a trabajar con el mapa.
    map.loaded(function () {
        // Añadir un marcador con un atributo con la URL de un archivo de vídeo.
        map.addMarker([613529, 4747122], {
            showPopup: true, // Hacemos que la tabla de atributos se muestre automáticamente
            data: {
                "Parque fluvial__video_640_auto": "data/Slowmotion_River_Water.mp4"
            }
        });
		// Centrar el mapa en el marcador.
		map.zoomToMarkers();
    });
</script>
```

##### Vídeo de Youtube
[Ver en vivo](../examples/attribute.video.youtube.name.html)
```html
<div id="mapa"></div>
<script>
    // Crear mapa.
    var map = new SITNA.Map("mapa");

    // Cuando esté todo cargado proceder a trabajar con el mapa.
    map.loaded(function () {
        // Añadir un marcador con un atributo con la URL de Youtube.
        map.addMarker([621107, 4670766], {
            showPopup: true, // Hacemos que la tabla de atributos se muestre automáticamente
            data: {
                "Sobrevuelo__video": "https://www.youtube.com/watch?v=Fz32nY6wKv4"
            }
        });
		// Centrar el mapa en el marcador.
		map.zoomToMarkers();
    });
</script>
```

### Alternativa 2: Marca añadida al valor del atributo

En un atributo cuyo valor se desee tratar como la URL de un vídeo se puede añadir la marca a la URL con alguno de los siguientes formatos:

#### 2.a. Marca como sufijo

Expresión regular:
```regex
/^(.)+__video(?:_(\d+|auto)_(\d+|auto))?$/
```
<img src="img/video_value_suffix_regex.svg" title="CC BY Regexper">

| Ejemplo de valor de atributo                                  | URL de vídeo                                  | Anchura de reproductor de vídeo | Altura de reproductor de vídeo |
| ------------------------------------------------------------- | --------------------------------------------- | ------------------------------- | ------------------------------ |
| `tutorial.mp4__video`                                         | _tutorial.mp4_                                | no definida                     | no definida                    |
| `/videos/001.webm__video_1920_1080`                           | _/videos/001.webm_                            | 1920 píxeles                    | 1080 píxeles                   |
| `https://www.youtube.com/watch?v=Fz32nY6wKv4__video_640_auto` | _https://www.youtube.com/watch?v=Fz32nY6wKv4_ | 640 píxeles                     | no definida                    |
| `https://youtu.be/Fz32nY6wKv4__video_auto_480`                | _https://youtu.be/Fz32nY6wKv4_                | no definida                     | 480 píxeles                    |

#### 2.b. Marca como prefijo

Expresión regular:
```regex
/^video(?:_(\d+|auto)_(\d+|auto))?__(.)+$/
```
<img src="img/video_value_prefix_regex.svg" title="CC BY Regexper">

| Ejemplo de valor de atributo                                  | URL de vídeo                                  | Anchura de reproductor de vídeo | Altura de reproductor de vídeo |
| ------------------------------------------------------------- | --------------------------------------------- | ------------------------------- | ------------------------------ |
| `video__tutorial.mp4`                                         | _tutorial.mp4_                                | no definida                     | no definida                    |
| `video_1920_1080__/videos/001.webm`                           | _/videos/001.webm_                            | 1920 píxeles                    | 1080 píxeles                   |
| `video_640_auto__https://www.youtube.com/watch?v=Fz32nY6wKv4` | _https://www.youtube.com/watch?v=Fz32nY6wKv4_ | 640 píxeles                     | no definida                    |
| `video_auto_480__https://youtu.be/Fz32nY6wKv4`                | _https://youtu.be/Fz32nY6wKv4_                | no definida                     | 480 píxeles                    |

#### Ejemplos

##### Archivo de vídeo
[Ver en vivo](../examples/attribute.video.file.value.html)
```html
<div id="mapa"></div>
<script>
    // Crear mapa.
    var map = new SITNA.Map("mapa");

    // Cuando esté todo cargado proceder a trabajar con el mapa.
    map.loaded(function () {
        // Añadir un marcador con un atributo con la URL de un archivo de vídeo.
        map.addMarker([613529, 4747122], {
            showPopup: true, // Hacemos que la tabla de atributos se muestre automáticamente
            data: {
                "Parque fluvial": "video_640_auto__data/Slowmotion_River_Water.mp4"
            }
        });
		// Centrar el mapa en el marcador.
		map.zoomToMarkers();
    });
</script>
```

##### Vídeo de Youtube
[Ver en vivo](../examples/attribute.video.youtube.value.html)
```html
<div id="mapa"></div>
<script>
    // Crear mapa.
    var map = new SITNA.Map("mapa");

    // Cuando esté todo cargado proceder a trabajar con el mapa.
    map.loaded(function () {
        // Añadir un marcador con un atributo con la URL de Youtube.
        map.addMarker([621107, 4670766], {
            showPopup: true, // Hacemos que la tabla de atributos se muestre automáticamente
            data: {
                "Sobrevuelo": "video__https://www.youtube.com/watch?v=Fz32nY6wKv4"
            }
        });
		// Centrar el mapa en el marcador.
		map.zoomToMarkers();
    });
</script>
```

## Audios

Un atributo de entidad geográfica con la marca convenida mostrará en su tabla de atributos un reproductor de audio. 

### Alternativa 1: Marca añadida al nombre de atributo

A un atributo cuyo valor se desee tratar como la URL de un archivo de audio se le puede asignar un nombre con alguno de los siguientes formatos:

#### 1.a. Marca como sufijo

Expresión regular:
```regex
/^(.)+__audio$/
```
<img src="img/audio_name_suffix_regex.svg" title="CC BY Regexper">

| Ejemplo de nombre de atributo | Título de atributo |
| ----------------------------- | ------------------ |
| `Grabación__audio`            | _Grabación_        |
| `Cuña de radio__audio`        | _Cuña de radio_    |

#### 1.b. Marca como prefijo

Expresión regular:
```regex
/^audio__(.)+$/
```
<img src="img/audio_name_prefix_regex.svg" title="CC BY Regexper">

| Ejemplo de nombre de atributo | Título de atributo |
| ----------------------------- | ------------------ |
| `audio__Grabación`            | _Grabación_        |
| `audio__Cuña de radio`        | _Cuña de radio_    |

#### Ejemplo
[Ver en vivo](../examples/attribute.audio.name.html)
```html
<div id="mapa"></div>
<script>
    // Crear mapa.
    var map = new SITNA.Map("mapa");

    // Cuando esté todo cargado proceder a trabajar con el mapa.
    map.loaded(function () {
        // Añadir un marcador con un atributo con la URL de un archivo de audio.
        map.addMarker([611036, 4741241], {
		    showPopup: true, // Hacemos que la tabla de atributos se muestre automáticamente
            data: {
                "Teatro Gayarre__audio": "data/aplausos.mp3"
            }
        });
		// Centrar el mapa en el marcador.
		map.zoomToMarkers();
    });
</script>
```

### Alternativa 2: Marca añadida al valor del atributo

En un atributo cuyo valor se desee tratar como la URL de un archivo de audio se puede añadir la marca a la URL con alguno de los siguientes formatos:

#### 2.a. Marca como sufijo

Expresión regular:
```regex
/^(.)+__audio$/
```
<img src="img/audio_value_suffix_regex.svg" title="CC BY Regexper">

| Ejemplo de valor de atributo                  | URL de audio                           |
| --------------------------------------------- | -------------------------------------- |
| `entradilla.mp3__audio`                       | _entradilla.mp3_                       |
| `/audio/samples/003.WAV__audio`               | _/audio/samples/003.WAV_               |
| `https://example.com/audio/jingle.mp3__audio` | _https://example.com/audio/jingle.mp3_ |

#### 2.b. Marca como prefijo

Expresión regular:
```regex
/^audio__(.)+$/
```
<img src="img/audio_value_prefix_regex.svg" title="CC BY Regexper">

| Ejemplo de valor de atributo                  | URL de audio                           |
| --------------------------------------------- | -------------------------------------- |
| `audio__entradilla.mp3`                       | _entradilla.mp3_                       |
| `audio__/audio/samples/003.WAV`               | _/audio/samples/003.WAV_               |
| `audio__https://example.com/audio/jingle.mp3` | _https://example.com/audio/jingle.mp3_ |

#### Ejemplo
[Ver en vivo](../examples/attribute.audio.value.html)
```html
<div id="mapa"></div>
<script>
    // Crear mapa.
    var map = new SITNA.Map("mapa");

    // Cuando esté todo cargado proceder a trabajar con el mapa.
    map.loaded(function () {
        // Añadir un marcador con un atributo con la URL de un archivo de audio.
        map.addMarker([611036, 4741241], {
            showPopup: true, // Hacemos que la tabla de atributos se muestre automáticamente
            data: {
                "Teatro Gayarre": "audio__data/aplausos.mp3"
            }
        });
		// Centrar el mapa en el marcador.
		map.zoomToMarkers();
    });
</script>
```

## Recursos incrustados

Un atributo de entidad geográfica que tenga la marca convenida mostrará incrustada en su tabla de atributos un
recurso dentro de un elemento `iframe`. El valor del atributo es la URL del recurso.

### Alternativa 1: Marca añadida al nombre de atributo

A un atributo cuyo valor sea la URL de un recurso a incrustar se le puede asignar un nombre que encaje con una de las dos siguientes expresiones regulares:

#### 1.a. Marca como sufijo

Expresión regular:
```regex
/^(.)+__embed(?:_(\d+|auto)_(\d+|auto))?$/
```
<img src="img/embed_name_suffix_regex.svg" title="CC BY Regexper">

| Ejemplo de nombre de atributo             | Título de atributo     | Anchura de elemento `iframe` | Altura de elemento `iframe` |
| ----------------------------------------- | ---------------------- | ---------------------------- | --------------------------- |
| `Ficha__embed`                            | _Ficha_                | no definida                  | no definida                 |
| `Cédula de habitabilidad__embed_768_1024` | _Anuncio publicitario_ | 768 píxeles                  | 1024 píxeles                |
| `Anuncio en prensa__embed_640_auto`       | _Anuncio en prensa_    | 640 píxeles                  | no definida                 |

#### 1.b. Marca como prefijo

Expresión regular:
```regex
/^embed(?:_(\d+|auto)_(\d+|auto))?__(.)+$/
```
<img src="img/embed_name_prefix_regex.svg" title="CC BY Regexper">

| Ejemplo de nombre de atributo             | Título de atributo     | Anchura de elemento `iframe` | Altura de elemento `iframe` |
| ----------------------------------------- | ---------------------- | ---------------------------- | --------------------------- |
| `embed__Ficha`                            | _Ficha_                | no definida                  | no definida                 |
| `embed_768_1024__Cédula de habitabilidad` | _Anuncio publicitario_ | 768 píxeles                  | 1024 píxeles                |
| `embed_640_auto__Anuncio en prensa`       | _Anuncio en prensa_    | 640 píxeles                  | no definida                 |

#### Ejemplo
[Ver en vivo](../examples/attribute.embed.name.html)
```html
<div id="mapa"></div>
<script>
    // Crear mapa.
    var map = new SITNA.Map("mapa");

    // Cuando esté todo cargado proceder a trabajar con el mapa.
    map.loaded(function () {
        // Añadir un marcador con un atributo con un enlace a su ficha catastral.
        map.addMarker([610818, 4741558], {
            showPopup: true, // Hacemos que la tabla de atributos se muestre automáticamente
            data: {
                "Información catastral__embed_640_200": "https://catastro.navarra.es/ref_catastral/unidades.aspx?C=201&PO=1&PA=1"
            }
        });
		// Centrar el mapa en el marcador.
		map.zoomToMarkers();
    });
</script>
```

### Alternativa 2: Marca añadida al valor del atributo

En un atributo cuyo valor sea la URL de un recurso a incrustar se puede añadir la marca a la URL con alguno de los siguientes formatos:

#### 2.a. Marca como sufijo

Expresión regular:
```regex
/^(.)+__embed(?:_(\d+|auto)_(\d+|auto))?$/
```
<img src="img/embed_value_suffix_regex.svg" title="CC BY Regexper">

| Ejemplo de valor de atributo                               | URL de recurso incrustado                  | Anchura de elemento `iframe` | Altura de elemento `iframe` |
| ---------------------------------------------------------- | ------------------------------------------ | ---------------------------- | --------------------------- |
| `ficha.html__embed`                                        | _ficha.html_                               | no definida                  | no definida                 |
| `/documentos/cedula02.pdf__embed_768_1024`                 | _/documentos/cedula02.pdf_                 | 768 píxeles                  | 1024 píxeles                |
| `https://example.com/docs/doc.aspx?id=001__embed_640_auto` | _https://example.com/docs/doc.aspx?id=001_ | 640 píxeles                  | no definida                 |

#### 2.b. Marca como prefijo

Expresión regular:
```regex
/^embed(?:_(\d+|auto)_(\d+|auto))?__(.)+$/
```
<img src="img/embed_value_prefix_regex.svg" title="CC BY Regexper">

| Ejemplo de valor de atributo                               | URL de recurso incrustado                  | Anchura de elemento `iframe` | Altura de elemento `iframe` |
| ---------------------------------------------------------- | ------------------------------------------ | ---------------------------- | --------------------------- |
| `embed__ficha.html`                                        | _ficha.html_                               | no definida                  | no definida                 |
| `embed_768_1024__/documentos/cedula02.pdf`                 | _/documentos/cedula02.pdf_                 | 768 píxeles                  | 1024 píxeles                |
| `embed_640_auto__https://example.com/docs/doc.aspx?id=001` | _https://example.com/docs/doc.aspx?id=001_ | 640 píxeles                  | no definida                 |

#### Ejemplo
[Ver en vivo](../examples/attribute.embed.value.html)
```html
<div id="mapa"></div>
<script>
    // Crear mapa.
    var map = new SITNA.Map("mapa");

    // Cuando esté todo cargado proceder a trabajar con el mapa.
    map.loaded(function () {
        // Añadir un marcador con un atributo con un enlace a su ficha catastral.
        map.addMarker([610818, 4741558], {
            showPopup: true, // Hacemos que la tabla de atributos se muestre automáticamente
            data: {
                "Información catastral": "embed_640_200__https://catastro.navarra.es/ref_catastral/unidades.aspx?C=201&PO=1&PA=1"
            }
        });
		// Centrar el mapa en el marcador.
		map.zoomToMarkers();
    });
</script>
```