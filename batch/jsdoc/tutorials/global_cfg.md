El objeto {@link SITNA.Cfg} está accesible para todas las instancias del la clase {@link SITNA.Map}.

Por tanto, se puede configurar un mapa asignando valores a las propiedades de ese objeto:
Ejemplo:
``` javascript
SITNA.Cfg.crs = "EPSG:4326";
SITNA.Cfg.initialExtent = [
  -2.84820556640625,
  41.78912492257675,
  -0.32135009765625,
  43.55789822064767
];
var map = new SITNA.Map("mapa");
```
