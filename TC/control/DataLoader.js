﻿
/**
  * Opciones de control para añadir datos geográficos.
  * 
  * En el control se pueden añadir WMS escribiendo la dirección del servicio o eligiendo un servicio de la lista de sugerencias de servicios de interés.
  *
  * También se pueden añadir datos de archivos buscándolos en el cuadro de diálogo que se abre tras pulsar _Abrir archivo_ o arrastrándolos y soltándolos dentro del área del mapa.
  * @typedef DataLoaderOptions
  * @extends SITNA.control.ControlOptions
  * @memberof SITNA.control
  * @see SITNA.control.MapControlOptions
  * @property {HTMLElement|string} [div] - Elemento del DOM en el que crear el control o valor de atributo id de dicho elemento.
  * @property {boolean} [enableDragAndDrop] - Propiedad que establece si está permitido arrastrar y soltar archivos al área del mapa, además de abrirlos de la manera convencional abriendo el cuadro de diálogo de búsqueda de archivos.
  * @property {SITNA.layer.WmsGroupOptions[]} [wmsSuggestions] - Lista de grupos de sugerencias de servicios WMS ofrecidos por el control. Por ejemplo se puede establecer un grupo de servicios WMS estatales y otro de servicios WMS mundiales.
  * @example <caption>[Ver en vivo](../examples/cfg.DataLoaderOptions.html)</caption> {@lang html} 
  * [//]@example {@lang html} 
  * <div id="mapa"></div>
  * <script>
  *     // Establecemos un layout simplificado apto para hacer demostraciones de controles.
  *     SITNA.Cfg.layout = "layout/ctl-container";
  *     // Activamos el proxy para poder acceder a servicios de otro dominio.
  *     SITNA.Cfg.proxy = "proxy/proxy.ashx?";
  *     // Añadimos el control de tabla de contenidos en el primer contenedor.
  *     SITNA.Cfg.controls.TOC = {
  *         div: "slot1"
  *     };
  *     // Añadimos el control de datos externos en el segundo contenedor.
  *     SITNA.Cfg.controls.dataLoader = {
  *         div: "slot2",
  *         enableDragAndDrop: true,
  *         wmsSuggestions: [
  *             {
  *                 group: "Estatales",
  *                 items: [
  *                     {
  *                         name: "Mapa Base (IGN)",
  *                         url: "https://www.ign.es/wms-inspire/ign-base"
  *                     },
  *                     {
  *                         name: "Unidades Administrativas (IGN)",
  *                         url: "https://www.ign.es/wms-inspire/unidades-administrativas"
  *                     },
  *                     {
  *                         name: "Cartografía Topográfica (IGN)",
  *                         url: "https://www.ign.es/wms-inspire/mapa-raster"
  *                     },
  *                     {
  *                         name: "Ortofotos PNOA Máxima Actualidad (IGN)",
  *                         url: "https://www.ign.es/wms-inspire/pnoa-ma"
  *                     }
  *                 ]
  *             },
  *             {
  *                 group: "Comunidades limítrofes",
  *                 items: [
  *                     {
  *                         name: "Aragón",
  *                         url: "http://idearagon.aragon.es/Visor2D"
  *                     },
  *                     {
  *                         name: "La Rioja",
  *                         url: "https://ogc.larioja.org/wms/request.php"
  *                     },
  *                     {
  *                         name: "País Vasco",
  *                         url: "http://www.geo.euskadi.eus/WMS_KARTOGRAFIA"
  *                     }
  *                 ]
  *             }
  *         ]
  *     };
  *     var map = new SITNA.Map("mapa");
  * </script>
  */

/**
  * Opciones de sugerencia de servicio externo WMS.
  * @typedef WmsOptions
  * @memberof SITNA.layer
  * @see SITNA.layer.WmsGroupOptions
  * @property {string} name - Nombre del servicio WMS. Se mostrará como un elemento en la lista de opciones del control.
  * @property {string} url - URL de acceso al servicio WMS.
  */

/**
  * Opciones de grupo de sugerencias de servicios externos WMS.
  * @typedef WmsGroupOptions
  * @memberof SITNA.layer
  * @see SITNA.control.DataLoaderOptions
  * @property {string} group - Nombre del grupo de sugerencias. Se mostrará como una sección en la lista de opciones del control.
  * @property {SITNA.layer.WmsOptions[]} items - Lista de sugerencias de servicios externos WMS.
  */

import TC from '../../TC';
import TabContainer from './TabContainer';

TC.control = TC.control || {};

class DataLoader extends TabContainer {
    constructor() {
        super(...arguments);
        const self = this;

        self.controlOptions = [
            {
                title: 'addWMS',
                externalWMS: { suggestions: self.options.wmsSuggestions }
            },
            {
                fileImport: { enableDragAndDrop: self.options.enableDragAndDrop }
            }
        ];
        self.defaultSelection = 0;
    }

    async register(map) {
        const self = this;
        self.map = map;
        const ctl = await super.register.call(self, map);
        ctl.div.classList.add(TabContainer.prototype.CLASS + '-datldr');
        return ctl;
    }
    render(callback) {
        const self = this;
        self.title = self.getLocaleString('addMaps');
        super.render(callback)

    }
}

TC.control.DataLoader = DataLoader;
export default DataLoader;