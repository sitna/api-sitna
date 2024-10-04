import TC from '../../TC';
import Consts from '../../TC/Consts';
import Util from '../../TC/Util';
import Cfg from '../../TC/Cfg';
import Control from '../../TC/Control';
//import Popup from '../../TC/control/Popup';
//import ResultsPanel from '../../TC/control/ResultsPanel';
import ControlContainer from '../../TC/control/ControlContainer';

/**
 * Espacio de nombres de las entidades geográficas del mapa.
 * @namespace SITNA.feature
 */

/**
 * Entidad geográfica genérica (sin especificar geometría) del mapa. Normalmente no se instancia directamente
 * esta clase, sino objetos de clases que heredan de esta.
 * @class Feature
 * @memberof SITNA.feature
 * @param {Array} coordinates - Coordenadas de la geometría expresadas en las unidades del CRS del mapa.
 * @param {SITNA.feature.FeatureOptions} [options] Objeto de opciones de la entidad geográfica.
 * @see SITNA.layer.Vector#addFeature
 * @see SITNA.layer.Vector#addFeatures
 * @example <caption>[Ver en vivo](../examples/feature.methods.html)</caption> {@lang html}
<div id="mapa"></div>
<script>
    SITNA.Cfg.workLayers = [
        {
            id: "entidades",
            title: "Demostración de setCoordinates",
            type: SITNA.Consts.layerType.VECTOR
        }
    ];
    var map = new SITNA.Map("mapa");
    map.loaded(async () => {
        // Obtenemos la instancia de la capa vectorial
        const vectorLayer = map.getLayer("entidades");
        let step = 0;
        const stepAngle = Math.PI / 200;
        const stepLength = 1;

        const iconUrlBase = '//sitna.navarra.es/api/TC/css/img/pegman';
        const iconUrls = [
            iconUrlBase + '0.png',
            iconUrlBase + '23.png',
            iconUrlBase + '45.png',
            iconUrlBase + '68.png',
            iconUrlBase + '90.png',
            iconUrlBase + '113.png',
            iconUrlBase + '135.png',
            iconUrlBase + '158.png',
            iconUrlBase + '180.png',
            iconUrlBase + '203.png',
            iconUrlBase + '225.png',
            iconUrlBase + '248.png',
            iconUrlBase + '270.png',
            iconUrlBase + '293.png',
            iconUrlBase + '315.png',
            iconUrlBase + '338.png'
        ];
        const updateMarker = function (marker) {
            const coords = marker.getCoordinates();
            const style = marker.getStyle();

            const dx = stepLength * Math.cos(step * stepAngle);
            const dy = stepLength * Math.sin(step * stepAngle / 2);

            let direction = Math.atan(dx / dy);
            if (dy < 0) {
                direction = (direction + Math.PI) % (2 * Math.PI);
            }

            const iconIndex = Math.round(iconUrls.length * direction / Math.PI / 2);

            // Asignamos nuevas coordenadas y nuevo icono
            style.url = iconUrls[iconIndex];
            marker
                .setCoordinates([coords[0] + dx, coords[1] + dy])
                .setStyle(style);

            step++;
        };

        vectorLayer.addMarker([610431, 4740837], {
            url: iconUrls[0]
        }).then(marker => {
            // Nos centramos en el marcador recién creado
            map.zoomToFeatures([marker]);
            setInterval(() => {
                updateMarker(marker);
            }, 50);
        });
    });
</script>
 */

class Feature {
    STYLETYPE = Consts.geom.POLYGON;
    #hasSelectedStyle = false;
    #selected = false;
    #visibilityState = Consts.visibility.VISIBLE;

    constructor(coords, options) {

        let olFeatureId;
        this.wrap = new TC.wrap.Feature();
        this.wrap.parent = this;
        if (this.wrap.isNative(coords)) {
            this.wrap.feature = coords;
            coords._wrap = this.wrap;
            olFeatureId = this.wrap.getId();
            this.geometry = this.wrap.getGeometry();
            if (coords._folders) {
                this.folders = coords._folders;
            }
            this.setData(this.wrap.getData());
        }

        var opts = this.options = Util.extend(true, {}, options);

        this.id = olFeatureId || opts.id || TC.getUID();
        if (this.wrap.feature && !olFeatureId) {
            this.wrap.feature.setId(this.id);
        }
        this.data = opts.data || this.data || null;
        if (opts.showsPopup === undefined) {
            this.showsPopup = true;
        }
        else {
            this.showsPopup = opts.showsPopup;
        }
        if (opts.showPopup) {
            this.autoPopup = true;
        }
        this.layer = opts.layer || null;

        if (opts.selected) {
            this.select();
        }
    }

    getPath() {
        let result = [];

        if (this.folders) {
            result = this.folders;
        }
        else if (this.options.group) {
            result = [this.options.group];
        }
        return result;
    }

    setVisibility(visible) {
        // Ocultamos el posible popup
        if (!visible && this.showsPopup && this.layer) {
            var popup = this.layer.map.getControlsByClass('TC.control.Popup').filter(function (popup) {
                return popup.currentFeature === this;
            });

            if (popup.length > 0) {
                const p = popup[0];
                if (p.isVisible()) {
                    p.hide();
                }
            }
        }

        if (visible && this.#visibilityState === Consts.visibility.NOT_VISIBLE ||
            !visible && this.#visibilityState === Consts.visibility.VISIBLE) {
            this.#visibilityState = visible ? Consts.visibility.VISIBLE : Consts.visibility.NOT_VISIBLE;
            this.layer.wrap.setFeatureVisibility(this, visible);
        }

        return this;
    }

    getVisibilityState() {
        return this.#visibilityState;
    }

    /**
     * Obtiene el identificador de la entidad geográfica dentro de su capa.
     * @method getId
     * @memberof SITNA.feature.Feature
     * @instance
     * @returns {string} Identificador de la entidad geográfica.
     */
    getId() {
        return this.wrap.getId();
    }

    setId(id) {
        this.id = id;
        this.wrap.setId(id);
        return this;
    }

    getBounds() {
        return this.wrap.getBounds();
    }

    setStyle(style) {
        let newStyle;
        if (style === null) {
            newStyle = null;
        }
        else {
            const mergedStyles = [this.getStyle(), style];
            if (this.layer?.styles?.[this.STYLETYPE]) {
                mergedStyles.unshift(this.layer.styles[this.STYLETYPE]);
            }
            if (this.layer?.map.options.styles?.[this.STYLETYPE]) {
                mergedStyles.unshift(this.layer.map.options.styles[this.STYLETYPE]);
            }
            if (Cfg?.styles?.[this.STYLETYPE]) {
                mergedStyles.unshift(Cfg.styles[this.STYLETYPE]);
            }
            newStyle = Util.mergeStyles(...mergedStyles);
        }
        this.wrap.setStyle(newStyle);
        return this;
    }

    toggleSelectedStyle(condition) {
        if (this.#hasSelectedStyle !== condition) {
            this.#hasSelectedStyle = condition;
            this.wrap.toggleSelectedStyle(condition);
        }
        return this;
    }

    getLegend() {
        if (!this._legend) {
            this._legend = this.wrap.getLegend();
        }
        return this._legend;
    }

    /**
     * Obtiene las coordenadas de la entidad geográfica en el CRS actual del mapa.
     * @method getCoordinates
     * @memberof SITNA.feature.Feature
     * @instance
     * @returns {Array} Coordenadas en el CRS actual del mapa de la geometría de la entidad geográfica.
     */
    getCoordinates(options) {
        const self = this;
        //const sourceCrs = options?.geometryCrs || (self.layer?.map?.on3DView ? self.layer.map.view3D.view2DCRS:self.layer?.map?.crs);
        //const destCrs = options?.crs || self.layer?.map?.getCRS() || Cfg.utmCrs;
        const sourceCrs = options?.geometryCrs || self.layer?.map?.crs;
        const destCrs = options?.crs || self.layer?.map?.options.utmCrs || Cfg.utmCrs;
        self.geometry = self.wrap.getGeometry();
        if (sourceCrs && destCrs) {
            return Util.reproject(this.geometry, sourceCrs, destCrs);
        }
        return this.geometry;
    }

    /**
     * Establece las coordenadas de la entidad geográfica.
     * @method setCoordinates
     * @memberof SITNA.feature.Feature
     * @instance
     * @param {Array} coordinates - Coordenadas de la entidad geográfica en el CRS actual del mapa.
     * @returns {SITNA.feature.Feature} La propia entidad geográfica.
     */
    setCoordinates(coords) {

        const toNumberCoords = function (arr) {
            arr.forEach(function (elm, idx) {
                if (Array.isArray(elm)) {
                    toNumberCoords(elm);
                }
                else {
                    if (elm === null) {
                        arr[idx] = null;
                    }
                    else if (typeof elm !== 'number') {
                        console.log('Warning: coordinate does not have number type');
                        arr[idx] = parseFloat(elm);
                    }
                }
            });
        };

        if (Array.isArray(coords)) {
            toNumberCoords(coords);
        }

        this.geometry = coords;
        this.wrap.setGeometry(coords);
        return this;
    }

    getCoords() {
        return this.getCoordinates();
    }

    setCoords(coords) {
        return this.setCoordinates(coords);
    }

    getCoordsArray() {
        const isPoint = function (elm) {
            return Array.isArray(elm) && elm.length >= 2 && typeof elm[0] === 'number' && typeof elm[1] === 'number';
        };
        const flattenFn = function (val) {
            return isPoint(val) ? [val] : val.reduce(reduceFn, []);
        };
        const reduceFn = function (acc, elm) {
            if (isPoint(elm)) {
                acc.push(elm);
            }
            else {
                acc = acc.concat(flattenFn(elm));
            }
            return acc;
        };
        return flattenFn(this.getCoordinates());
    }

    getGeometryStride() {
        const coordsArray = this.getCoordsArray();
        const firstCoord = coordsArray[0];
        if (firstCoord) {
            return firstCoord.length;
        }
        return 0;
    }

    getGeometryType() {
        return null;
    }

    removeZ() {
        const coords = this.getCoordsArray();
        if (coords[0]?.length > 2) {
            coords.forEach(c => c.length = 2);
            this.setCoordinates(this.geometry);
        }
        return this;
    }

    /**
     * Obtiene los atributos de la entidad geográfica.
     * @method getData
     * @memberof SITNA.feature.Feature
     * @instance
     * @returns {Object} Diccionario de pares clave/valor con los atributos de la entidad geográfica.
     */
    getData() {
        let result = null;
        if (this.data) {
            result = this.data;
        }
        else {
            result = this.wrap.getData();
        }
        return result;
    }

    /**
     * Establece los atributos de la entidad geográfica.
     * @method setData
     * @memberof SITNA.feature.Feature
     * @instance
     * @param {Object} data - Diccionario de pares clave/valor con los atributos a establecer.
     * @returns {SITNA.feature.Feature} La propia entidad geográfica.
     */
    setData(data) {
        if (typeof data === 'string') {
            this.data = data;
        }
        else {
            this.data = { ...this.data, ...data };
            this.attributes = this.attributes || [];
            for (var key in data) {
                let attr = this.attributes.find(attr => attr.name === key);
                if (attr) {
                    attr.value = data[key];
                }
                else {
                    this.attributes.push({ name: key, value: data[key] });
                }
            }
            this.wrap.setData(data);
        }
        return this;
    }

    unsetData(key) {
        delete this.data[key];
        const attr = (this.attributes || []).find(attr => attr.name === key);
        if (attr) {
            this.attributes.splice(this.attributes.indexOf(attr), 1);
        }
        this.wrap.unsetData(key);
        return this;
    }

    clearData() {
        this.data = {};
        this.attributes = [];
        this.wrap.clearData();
        return this;
    }

    getInfo(options) {
        let result = null;
        const locale = options?.locale || this.layer?.map && Util.getMapLocale(this.layer.map);
        const data = this.getData();
        if (typeof data === 'object') {
            var template = this.wrap.getTemplate();
            if (template) {
                // GLS: Contemplo en la expresión regular la opción de que el nombre del campo se componga de $[aaa/abc/loQueMeInteresa] 
                // (la expresión no está limitada a 2 niveles), hasta ahora se manejaba $[loQueMeInteresa]
                result = template.replace(/\$\[?(?:\w+\/)*([^><]+)\]/g, function (match, p1) {
                    //esto es por si la feature viene de un KML con este formato de datos
                    /*
                     * <Data name="nombre del atributo">
                            <value>valor del atributo</value>
                            <displayName>Texto a mostrar como clave</displayName>
                        </Data>
                     */
                    if (data[p1] instanceof Object && Object.prototype.hasOwnProperty.call(data[p1], "value")) {
                        return data[p1]["value"];
                    }
                    return data[p1];
                });
            }
            else {
                var html = [];
                const hSlots = [];
                const openText = Util.getLocaleString(locale, 'open');
                const titleText = Util.getLocaleString(locale, 'linkInNewWindow');
                const formatValue = function (value) {
                    let result;
                    var isUrl = Util.isURL(value);
                    if (isUrl) {
                        result = `<a href="${value}" target="_blank" title="${titleText}">${openText}</a>`;
                    }
                    else {
                        result = value !== undefined ?
                            typeof value === "number" ? Util.formatNumber(value, locale) : value
                            : '&mdash;';
                    }
                    return result;
                };
                const recursiveFn = function (data) {
                    var html = [];
                    if (data instanceof Array) {
                        const id = 'complexAttr_' + TC.getUID();
                        html.push(`<div class="tc-complex-attr"><input type="checkbox" id="${id}" /><div><label for="${id}" title="" class="tc-plus"></label>`);
                        html.push(`<label for="${id}" title="" class="tc-title">${data.length} ${Util.getLocaleString(locale, 'featureInfo.complexData.array')}</label><br/>`);
                        html.push('<table class="tc-complex-attr"><tbody>');
                        data.forEach(item => {
                            html.push('<tr><td>');
                            html = html.concat(recursiveFn(item));
                            html.push('</td></tr>');
                        });
                        html.push('</tbody></table></div></div>');
                    } else if (data instanceof Object) {
                        if (data.getType) {
                            const tttt = {
                                type: data.getType(),
                                coordinates: data.getCoordinates()
                            };
                            html = html.concat(recursiveFn(tttt));
                        }
                        else {
                            html.push('<table class="tc-complex-attr"><tbody>');
                            for (var i in data) {
                                html.push('<tr>');
                                if (data[i] && data[i] instanceof Array) {
                                    const id = 'complexAttr_' + TC.getUID();
                                    html.push(`<th style="display:none">${i}</th>
                                           <td><label for="${id}" class="tc-title">${i}</label><br/>`);
                                    html = html.concat(recursiveFn(data[i]));
                                    html.push('</div></td>');
                                }
                                else if (data[i] && data[i] instanceof Object) {
                                    const id = 'complexAttr_' + TC.getUID();
                                    //if(data[i] && Object.entries(data[i]).some((item)=>{return item[1] instanceof Object})){						
                                    html.push(`<th style="display:none">${i}</th>
                                           <td><input type="checkbox" id="${id}" /><div><label for="${id}" title="" class="tc-plus"></label>`);
                                    html.push(`<label for="${id}" title="" class="tc-title">${i}</label><br/>`);
                                    html = html.concat(recursiveFn(data[i]));
                                    html.push('</div></td>');
                                }
                                else {
                                    html.push(`<th class="key">${i}</th>
                                           <td class="value">`);
                                    html = html.concat(recursiveFn(data[i]));
                                    html.push('</td>');
                                }
                                html.push('</tr>');
                            }
                            html.push('</tbody></table>');
                        }
                    } else {
                        html.push(formatValue(data));
                    }
                    return html;
                };
                for (var key in data) {
                    const value = data[key];
                    const match = key.match(/^h(\d)_/i);
                    if (match) {
                        hSlots[match[1]] = value;
                    }
                    else {
                        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'undefined') {
                            html.push(`<tr><th>${key}</th><td>${formatValue(value)}</td></tr>`);
                        }
                        else {
                            html.push(`<tr><th>${key}</th><td>`);
                            html = html.concat(recursiveFn(value));
                            html.push('</td></tr>');

                        }
                    }
                }
                const headers = hSlots
                    .map(function (val, idx) {
                        if (val) {
                            return `<h${idx}>${val}</h${idx}>`;
                        }
                    })
                    .filter(function (val) {
                        return val;
                    });
                if (headers.length) {
                    html = headers.concat(html);
                }
                if (html.length > 0) {
                    html.unshift('<table class="tc-attr">');
                    html.push('</table>');
                    result = html.join('');
                }
            }
        }
        else if (typeof data === 'string') {
            result = data;
        }
        if (!result) {
            result = this.title;
            if (this.group) {
                result += ' ' + this.group;
            }
        }
        if (!result) {
            result = Util.getLocaleString(locale, 'noData');
        }
        return result;
    }

    getTemplate() {
        let result = this.wrap.getTemplate();
        if (result) {
            return result;
        }
        return null;
    }

    clone() {
        const nativeClone = this.wrap.cloneFeature();
        nativeClone._wrap = this.wrap;
        const result = new this.constructor(nativeClone, this.options);
        if (this.folders) {
            result.folders = this.folders.slice();
        }
        return result;
    }

    getStyle() {
        return this.wrap.getStyle();
    }

    async showPopup(options = {}) {
        const control = options instanceof Control ? options : options.control;
        const map = this.layer?.map || control?.map;
        if (map) {
            let popup = control || this.popup;
            if (!popup) {
                // Buscamos un popup existente que no esté asociado a un control.
                var popups = map.getControlsByClass('TC.control.Popup');
                for (var i = 0, len = popups.length; i < len; i++) {
                    var p = popups[i];
                    if (!p.caller) {
                        popup = p;
                        break;
                    }
                }
            }
            if (!popup) {
                popup = await map.addControl('popup');
            }
            if (popup.isVisible() && popup.currentFeature !== this) {
                popup.hide();
            }
            popup.currentFeature = this;
            map.getControlsByClass('TC.control.Popup')
                .filter(p => p !== popup && p.isVisible())
                .forEach(p => p.hide());
            if (!popup.getContainerElement()) await popup.renderPromise();            
            popup.setDragged(false);
            this.wrap.showPopup(Object.assign({}, options, { control: popup }));
            map.trigger(Consts.event.POPUP, { control: popup });
            popup.fitToView(true);
            popup.contentDiv.querySelectorAll('img').forEach(img => img.addEventListener('load', () => popup.fitToView()));
            return popup;
        }
        return null;
    }

    async showResultsPanel(options = {}) {
        const control = options instanceof Control ? options : options.control;
        const map = this.layer?.map || control?.map;
        if (map) {
            let panel;

            var resultsPanelOptions = {
                content: "table",
                titles: {
                    main: Util.getLocaleString(map.options.locale, "rsp.title"),
                    max: Util.getLocaleString(map.options.locale, "rsp.title")
                }
            };
            var controlContainer = map.getControlsByClass(ControlContainer)[0];
            if (controlContainer) {
                resultsPanelOptions.position = controlContainer.POSITION.RIGHT;
                //URI 24/01/2022 comprobar que ya existe un resultpanel para la feature en cuestión, sino se crea uno nuevo
                panel = map.getControlsByClass('TC.control.ResultsPanel').find(resultPanel => resultPanel.currentFeature === this);
                if (!panel) panel = await controlContainer.addControl('resultsPanel', resultsPanelOptions);
            } else {
                resultsPanelOptions.div = document.createElement('div');
                map.div.appendChild(resultsPanelOptions.div);
                //URI 24/01/2022 comprobar que ya existe un resultpanel para la feature en cuestión, sino se crea uno nuevo
                panel = map.getControlsByClass('TC.control.ResultsPanel').find(resultsPanel => resultsPanel.currentFeature === this);
                if (!panel) panel = await map.addControl('resultsPanel', resultsPanelOptions);
            }

            panel.currentFeature = this;

            // GLS: si contamos con el contenedor de controles no es necesario cerra el resto de paneles ya que no habrá solape excepto los paneles
            if (map.getControlsByClass(ControlContainer).length === 0) {
                map.getControlsByClass('TC.control.ResultsPanel').filter(ctrl => ctrl.options.content === "table").forEach(function (p) {
                    p.close();
                });
            }

            // cerramos los paneles con feature asociada que no sean gráfico
            const panels = map.getControlsByClass('TC.control.ResultsPanel');
            panels.filter(ctrl => panel !== ctrl).forEach(function (p) {
                if (p.currentFeature && !p.chart) {
                    p.close();
                }
            });

            panel.menuDiv.innerHTML = '';
            panel.open(options.html || this.getInfo({ locale: map.options.locale }), panel.getInfoContainer());

            const resizeObserver = new ResizeObserver(entries => {
                for (let entry of entries) {
                    entry.target.querySelectorAll('h3, h4').forEach(function (hx) {
                        hx.addEventListener("mouseenter", function (_e) {
                            if (this.offsetWidth < this.scrollWidth) {
                                this.title = this.childNodes.item(0).textContent;
                            }
                            else {
                                this.title = "";
                            }
                        }, { passive: true });
                    });
                }
            });
            resizeObserver.observe(panel.infoDiv);

            var onViewChange = function (_e) {
                map.off(Consts.event.VIEWCHANGE, onViewChange);

                panel.close();
            };
            map.on(Consts.event.VIEWCHANGE, onViewChange);
            return panel;
        }
        return null;
    }

    async showInfo(options = {}) {

        if (!TC.control || !TC.control.FeatureInfoCommons) {
            const { default: FeatureInfoCommons } = await import('../../TC/control/FeatureInfoCommons');
            TC.control = TC.control || {};
            TC.control.FeatureInfoCommons = FeatureInfoCommons;
        }

        let html;
        if (this.getTemplate()) {
            html = this.getInfo();
        }
        else {
            if (typeof this.data === 'string') {
                html = this.data;
            }
            else {
                html = await TC.control.FeatureInfoCommons.renderFeatureAttributeTable({
                    // Quitamos los atributos que son otras entidades (p.e. referencePoint)
                    attributes: this.attributes.filter((attr) => !(attr.value instanceof Feature)),
                    singleFeature: true
                });
            }
        }
        const opts = Util.extend({}, options, { html: html });
        let control;
        if (options.control && TC.control) {
            const optionsControl = options.control;
            const { default: Popup } = await import('../../TC/control/Popup');
            const { default: ResultsPanel } = await import('../../TC/control/ResultsPanel');
            if (optionsControl instanceof Popup) {
                control = await this.showPopup(opts);
            }
            else if (optionsControl instanceof ResultsPanel) {
                control = await this.showResultsPanel(opts);
            }
        }
        else {
            if (this.layer.map.on3DView || this.layer.map.defaultInfoContainer === Consts.infoContainer.RESULTS_PANEL) {
                control = await this.showResultsPanel(opts);
            }
            else {
                control = await this.showPopup(opts);
            }
        }
        this.infoControl = control;
        this.toggleSelectedStyle(true);
        TC.control.FeatureInfoCommons.addSpecialAttributeEventListeners(control.getContainerElement());
    }

    select() {
        this.#selected = true;
        if (this.layer) {
            this.layer.selectedFeatures.push(this);
        }
        var selectionOptions = this.options.selection || {};
        this.setStyle(Util.extend({}, Cfg.styles.selection[this.STYLETYPE], selectionOptions[this.STYLETYPE]));
        //URI:Traer al frente

        return this;
    }

    unselect() {
        this.#selected = false;
        // Volvemos al estilo por defecto
        this.setStyle(this.options);
        //this.setStyle(Object.assign({}, this.options, Cfg.styles[this.STYLETYPE]));

        if (this.layer) {
            const idx = this.layer.selectedFeatures.indexOf(this);
            if (idx >= 0) {
                this.layer.selectedFeatures.splice(idx, 1);
            }
        }
        return this;
    }

    isSelected() {
        return this.#selected;
    }

    toGML(version, srsName) {
        return this.wrap.toGML(version, srsName);
    }
}

export default Feature;

/**
 * Opciones de entidad. Hay que tener en cuenta que el archivo `config.json` de una maquetación 
 * puede sobreescribir los valores por defecto de esta propiedad
 * (para ver instrucciones de uso de maquetaciones, consultar {@tutorial layout_cfg}).
 * @typedef FeatureOptions
 * @memberof SITNA.feature
 * @property {object|string} [data] - Diccionario de pares clave-valor que representa los atributos 
 * alfanuméricos de la entidad geográfica o bien cadena de caracteres con el código HTML asociado a la misma. 
 * Al pulsar sobre la entidad geográfica, bien una tabla con los atributos o bien el HTML especificado 
 * se mostrarán en un bocadillo.
 * @property {string} [group] - Nombre de grupo en el que incluir la entidad geográfica. 
 * Los grupos se muestran en la tabla de contenidos y en la leyenda.
 * @property {string} [layer] - Identificador de una capa de tipo [SITNA.Consts.layerType.VECTOR]{@link SITNA.Consts} en la
 * que se añadirá la entidad geográfica.
 * Cuando un objeto de este tipo se pasa como parámetro a {@link SITNA.Map#addMarker} y no se especifica 
 * esta propiedad, se creará una capa específica para las entidades geográficas que se añadan.
 * @property {boolean} [showPopup] - Si se establece a `true`, la entidad geográfica se añade al mapa con el bocadillo de información asociada visible por defecto.
 */

/**
 * Opciones para la obtención de una medida. Cuando queremos obtener la longitud o el área de la geometría 
 * de una entidad geográfica hay que tener en cuenta que el resultado depende de en qué unidades están definidas 
 * sus coordenadas y sobre qué CRS se proyecta la entidad.
 * @typedef MeasurementOptions
 * @memberof SITNA.feature
 * @property {string} [crs=["EPSG:25830"]{@link https://epsg.io/25830}] - Cadena con el código identificador del CRS sobre la que se proyecta la geometría de la entidad geográfica.
 * Dado que al proyectar una entidad geográfica sobre un plano se puede alterar su forma o tamaño, la medida es 
 * dependiente del CRS utilizado.
 * @property {string} [geometryCrs] - Cadena con el código identificador del CRS en que están las coordenadas 
 * de la geometría de la entidad geográfica. Si no se especifica se tomará el CRS del mapa en que 
 * se encuentra la entidad.
 * @see SITNA.feature.Polyline#getLength
 * @see SITNA.feature.MultiPolyline#getLength
 * @see SITNA.feature.Polygon#getArea
 * @see SITNA.feature.Polygon#getLength
 * @see SITNA.feature.MultiPolygon#getArea
 * @see SITNA.feature.MultiPolygon#getLength
 * @see SITNA.feature.Circle#getRadius
 */