Al instanciar {@link SITNA.Map} se le puede pasar como parámetro un objeto de opciones con la estructura de {@link SITNA.Cfg}:
``` javascript
var map = new SITNA.Map("mapa", {
  crs: "EPSG:4326",
  initialExtent: [
    -2.84820556640625,
    41.78912492257675,
    -0.32135009765625,
    43.55789822064767
  ]
});
```
